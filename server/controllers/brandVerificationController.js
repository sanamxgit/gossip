const BrandVerification = require('../models/BrandVerification');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryMiddleware');

// @desc    Submit brand verification request
// @route   POST /api/brand-verification
// @access  Private/Seller
const submitVerification = async (req, res) => {
  try {
    const { brandName, documentType, description } = req.body;
    
    // Check if already has a pending request
    const existingRequest = await BrandVerification.findOne({
      seller: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'You already have a pending verification request'
      });
    }

    // Upload documents
    const documents = [];
    if (req.files && req.files.length > 0) {
      console.log('Processing files:', req.files.length);
      
      for (const file of req.files) {
        try {
          console.log('Uploading file:', file.originalname);
          const result = await uploadToCloudinary(file, 'brand_verifications');
          console.log('Upload result:', result);
          
          documents.push({
            url: result.url,
            public_id: result.public_id,
            type: documentType || 'other',
            description: description || file.originalname
          });
        } catch (uploadError) {
          console.error('Error uploading file to Cloudinary:', uploadError);
          // Delete any documents that were already uploaded
          for (const doc of documents) {
            try {
              await deleteFromCloudinary(doc.public_id);
            } catch (deleteError) {
              console.error('Error deleting document:', deleteError);
            }
          }
          return res.status(500).json({
            message: 'Error uploading documents to cloud storage',
            error: uploadError.message
          });
        }
      }
    } else {
      return res.status(400).json({
        message: 'No documents provided for verification'
      });
    }

    const verificationRequest = new BrandVerification({
      seller: req.user._id,
      brandName,
      documents
    });

    await verificationRequest.save();

    res.status(201).json({
      message: 'Verification request submitted successfully',
      request: verificationRequest
    });
  } catch (error) {
    console.error('Error in submitVerification:', error);
    res.status(500).json({ 
      message: 'Error submitting verification request',
      error: error.message 
    });
  }
};

// @desc    Get seller's verification requests
// @route   GET /api/brand-verification/seller
// @access  Private/Seller
const getSellerRequests = async (req, res) => {
  try {
    const requests = await BrandVerification.find({ seller: req.user._id })
      .sort('-createdAt');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all verification requests
// @route   GET /api/brand-verification/admin
// @access  Private/Admin
const getAllRequests = async (req, res) => {
  try {
    const requests = await BrandVerification.find()
      .populate('seller', 'username email')
      .sort('-createdAt');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update verification request status
// @route   PUT /api/brand-verification/:id
// @access  Private/Admin
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes, rejectionReason } = req.body;
    const request = await BrandVerification.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    request.status = status;
    request.adminNotes = adminNotes;
    if (status === 'rejected') {
      request.rejectionReason = rejectionReason;
    }

    // If approved, update user's seller status
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.seller, {
        'sellerProfile.isBrandVerified': true,
        'sellerProfile.brandName': request.brandName
      });
    }

    await request.save();
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitVerification,
  getSellerRequests,
  getAllRequests,
  updateRequestStatus
}; 