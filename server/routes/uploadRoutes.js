const express = require('express');
const router = express.Router();
const { protect, seller, admin } = require('../middleware/authMiddleware');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryMiddleware');

// @route   POST /api/upload/product
// @desc    Upload product images to Cloudinary
// @access  Private/Seller
router.post('/product', protect, seller, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const uploadPromises = req.files.map(file => uploadToCloudinary(file, 'products'));
    const results = await Promise.all(uploadPromises);
    
    res.json({ files: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/category
// @desc    Upload category image to Cloudinary
// @access  Private/Admin
router.post('/category', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file, 'categories');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/brand
// @desc    Upload brand logo to Cloudinary
// @access  Private/Admin
router.post('/brand', protect, admin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file, 'brands');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar to Cloudinary
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file, 'avatars');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/documents
// @desc    Upload seller verification documents to Cloudinary
// @access  Private
router.post('/documents', protect, upload.array('documents', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const uploadPromises = req.files.map(file => uploadToCloudinary(file, 'documents'));
    const results = await Promise.all(uploadPromises);
    
    res.json({ files: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/store
// @desc    Upload seller store logo to Cloudinary
// @access  Private/Seller
router.post('/store', protect, seller, upload.single('storeLogo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file, 'stores');
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/sections
// @desc    Upload section images to Cloudinary
// @access  Private/Admin
router.post('/sections', protect, admin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get section type from request
    const sectionType = req.body.sectionType || 'default';
    const folder = `sections/${sectionType}`;
    
    const result = await uploadToCloudinary(req.file, folder);
    
    res.json({
      message: 'File uploaded successfully',
      url: result.url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// @route   DELETE /api/upload/:public_id
// @desc    Delete file from Cloudinary
// @access  Private
router.delete('/:public_id', protect, async (req, res) => {
  try {
    const { public_id } = req.params;
    const { resource_type = 'image' } = req.query;
    
    const result = await deleteFromCloudinary(public_id, resource_type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 