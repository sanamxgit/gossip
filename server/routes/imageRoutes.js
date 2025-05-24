const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryMiddleware');

// Model for storing image metadata
const Image = require('../models/Image');

// @route   POST /api/images/banner
// @desc    Upload banner image
// @access  Private/Admin
router.post('/banner', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.path, {
      folder: 'banners',
      transformation: [
        { width: 1920, height: 600, crop: 'fill' },
        { quality: 'auto:best' }
      ]
    });

    const image = new Image({
      type: 'banner',
      url: result.secure_url,
      public_id: result.public_id,
      uploadedBy: req.user._id
    });

    await image.save();
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/images/trending
// @desc    Upload trending image
// @access  Private/Admin
router.post('/trending', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.path, {
      folder: 'trending',
      transformation: [
        { width: 800, height: 800, crop: 'fill' },
        { quality: 'auto:best' }
      ]
    });

    const image = new Image({
      type: 'trending',
      url: result.secure_url,
      public_id: result.public_id,
      uploadedBy: req.user._id
    });

    await image.save();
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/images/banners
// @desc    Get all banner images
// @access  Public
router.get('/banners', async (req, res) => {
  try {
    const images = await Image.find({ type: 'banner' })
      .sort('-createdAt')
      .populate('uploadedBy', 'name');
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/images/trending
// @desc    Get all trending images
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const images = await Image.find({ type: 'trending' })
      .sort('-createdAt')
      .populate('uploadedBy', 'name');
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/images/:id
// @desc    Delete an image
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(image.public_id);

    // Delete from database
    await image.deleteOne();

    res.json({ message: 'Image removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 