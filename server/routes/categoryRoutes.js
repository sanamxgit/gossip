const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', categoryController.getCategories);

// @route   POST /api/categories
// @desc    Create a category
// @access  Private/Admin
router.post(
  '/',
  protect,
  admin,
  upload.single('image'),
  categoryController.createCategory
);

// @route   GET /api/categories/featured
// @desc    Get featured categories
// @access  Public
router.get('/featured', categoryController.getFeaturedCategories);

// @route   GET /api/categories/top
// @desc    Get top level categories
// @access  Public
router.get('/top', categoryController.getTopCategories);

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', categoryController.getCategoryById);

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put(
  '/:id',
  protect,
  admin,
  upload.single('image'),
  categoryController.updateCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', protect, admin, categoryController.deleteCategory);

// @route   GET /api/categories/:id/subcategories
// @desc    Get subcategories of a category
// @access  Public
router.get('/:id/subcategories', categoryController.getSubcategories);

// @route   GET /api/categories/:id/products
// @desc    Get products in a category
// @access  Public
router.get('/:id/products', categoryController.getCategoryProducts);

module.exports = router; 