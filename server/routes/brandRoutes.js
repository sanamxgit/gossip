const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const Notification = require('../models/Notification');
const { protect, seller, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const brandController = require('../controllers/brandController');
const { uploadToCloudinary } = require('../middleware/cloudinaryMiddleware');

// @route   GET /api/brands
// @desc    Get all brands
// @access  Public
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find().populate('seller', 'name email');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/brands
// @desc    Create a brand
// @access  Private/Seller
router.post('/', protect, seller, upload.array('documents', 5), async (req, res) => {
  try {
    const { name, description } = req.body;
    const files = req.files;

    // Upload documents to Cloudinary
    const documents = await Promise.all(
      files.map(async (file) => {
        const result = await uploadToCloudinary(file.path);
        return {
          name: file.originalname,
          url: result.secure_url,
          public_id: result.public_id,
          type: file.fieldname
        };
      })
    );

    const brand = new Brand({
      name,
      description,
      seller: req.user._id,
      documents
    });

    const savedBrand = await brand.save();

    // Create notification for admin
    await Notification.create({
      type: 'brand_verification',
      title: 'New Brand Registration',
      message: `A new brand "${name}" has been registered by seller ${req.user.email} and requires verification.`,
      forAdmin: true,
      data: {
        brandId: savedBrand._id,
        brandName: name,
        sellerId: req.user._id,
        sellerEmail: req.user.email
      }
    });

    res.status(201).json(savedBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/brands/featured
// @desc    Get featured brands
// @access  Public
router.get('/featured', brandController.getFeaturedBrands);

// @route   GET /api/brands/:id
// @desc    Get brand by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate('seller', 'name email');
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/brands/:id
// @desc    Update a brand
// @access  Private/Admin
router.put(
  '/:id',
  protect,
  admin,
  upload.single('logo'),
  brandController.updateBrand
);

// @route   DELETE /api/brands/:id
// @desc    Delete a brand
// @access  Private/Admin
router.delete('/:id', protect, admin, brandController.deleteBrand);

// @route   GET /api/brands/:id/products
// @desc    Get products of a brand
// @access  Public
router.get('/:id/products', brandController.getBrandProducts);

// @route   PUT /api/brands/:id/verify
// @desc    Verify a brand
// @access  Private/Admin
router.put('/:id/verify', protect, admin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const brand = await Brand.findById(req.params.id).populate('seller', 'email');

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    brand.verificationStatus = status;
    brand.verificationNotes = notes;
    brand.isVerified = status === 'approved';
    brand.verifiedAt = status === 'approved' ? Date.now() : null;
    brand.verifiedBy = req.user._id;

    const updatedBrand = await brand.save();

    // Create notification for seller
    await Notification.create({
      type: 'brand_verification',
      title: `Brand Verification ${status.toUpperCase()}`,
      message: `Your brand "${brand.name}" has been ${status}. ${notes ? `Notes: ${notes}` : ''}`,
      forUser: brand.seller._id,
      data: {
        brandId: brand._id,
        brandName: brand.name,
        status,
        notes
      }
    });

    res.json(updatedBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/brands/seller/me
// @desc    Get seller's brands
// @access  Private/Seller
router.get('/seller/me', protect, seller, async (req, res) => {
  try {
    const brands = await Brand.find({ seller: req.user._id });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/brands/admin/pending
// @desc    Get pending brand verifications
// @access  Private/Admin
router.get('/admin/pending', protect, admin, async (req, res) => {
  try {
    const brands = await Brand.find({ verificationStatus: 'pending' })
      .populate('seller', 'name email');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 