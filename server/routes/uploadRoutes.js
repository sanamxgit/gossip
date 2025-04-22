const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const path = require('path');
const { protect, seller, admin } = require('../middleware/authMiddleware');

// @route   POST /api/upload/product
// @desc    Upload product images
// @access  Private/Seller
router.post('/product', protect, seller, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const filePaths = req.files.map(file => file.path);
    res.json({ paths: filePaths });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/category
// @desc    Upload category image
// @access  Private/Admin
router.post('/category', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({ path: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/brand
// @desc    Upload brand logo
// @access  Private/Admin
router.post('/brand', protect, admin, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({ path: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({ path: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/documents
// @desc    Upload seller verification documents
// @access  Private
router.post('/documents', protect, upload.array('documents', 3), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const filePaths = req.files.map(file => file.path);
    res.json({ paths: filePaths });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/upload/store
// @desc    Upload seller store logo
// @access  Private/Seller
router.post('/store', protect, seller, upload.single('storeLogo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.json({ path: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 