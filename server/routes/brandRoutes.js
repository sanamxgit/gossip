const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   GET /api/brands
// @desc    Get all brands
// @access  Public
router.get('/', brandController.getBrands);

// @route   POST /api/brands
// @desc    Create a brand
// @access  Private/Admin
router.post(
  '/',
  protect,
  admin,
  upload.single('logo'),
  brandController.createBrand
);

// @route   GET /api/brands/featured
// @desc    Get featured brands
// @access  Public
router.get('/featured', brandController.getFeaturedBrands);

// @route   GET /api/brands/:id
// @desc    Get single brand
// @access  Public
router.get('/:id', brandController.getBrandById);

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

module.exports = router; 