const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, seller, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', productController.getProducts);

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', productController.getFeaturedProducts);

// @route   GET /api/products/category/:categoryId
// @desc    Get products by category
// @access  Public
router.get('/category/:categoryId', productController.getProductsByCategory);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', productController.searchProducts);

// @route   GET /api/products/seller/:sellerId
// @desc    Get products by seller
// @access  Public
router.get('/seller/:sellerId', productController.getProductsBySeller);

// @route   GET /api/products/seller/me
// @desc    Get current seller's products
// @access  Private/Seller
router.get('/seller/me', protect, seller, productController.getMyProducts);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Seller
router.post(
  '/',
  protect,
  seller,
  upload.array('images', 5),
  productController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Seller
router.put(
  '/:id',
  protect,
  seller,
  upload.array('images', 5),
  productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Seller
router.delete('/:id', protect, seller, productController.deleteProduct);

// @route   POST /api/products/:id/images
// @desc    Upload product images
// @access  Private/Seller
router.post(
  '/:id/images',
  protect,
  seller,
  upload.array('images', 5),
  productController.uploadProductImages
);

// @route   DELETE /api/products/:id/images/:imageId
// @desc    Delete product image
// @access  Private/Seller
router.delete(
  '/:id/images/:imageId',
  protect,
  seller,
  productController.deleteProductImage
);

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock
// @access  Private/Seller
router.patch('/:id/stock', protect, seller, productController.updateProductStock);

// Admin routes
// @route   GET /api/products/admin/all
// @desc    Get all products (admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, productController.getAllProductsAdmin);

// @route   PUT /api/products/admin/:id
// @desc    Update a product (admin)
// @access  Private/Admin
router.put(
  '/admin/:id',
  protect,
  admin,
  upload.array('images', 5),
  productController.updateProductAdmin
);

// @route   DELETE /api/products/admin/:id
// @desc    Delete a product (admin)
// @access  Private/Admin
router.delete('/admin/:id', protect, admin, productController.deleteProductAdmin);

module.exports = router; 