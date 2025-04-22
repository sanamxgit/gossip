const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { protect, seller, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/sellers/apply
// @desc    Apply to become a seller
// @access  Private
router.post(
  '/apply',
  protect,
  upload.array('documents', 3), // Allow up to 3 documents for verification
  sellerController.applyForSeller
);

// @route   GET /api/sellers/application
// @desc    Get seller application status
// @access  Private
router.get('/application', protect, sellerController.getSellerApplicationStatus);

// @route   PUT /api/sellers/profile
// @desc    Update seller profile
// @access  Private/Seller
router.put(
  '/profile',
  protect,
  seller,
  upload.single('logo'),
  sellerController.updateSellerProfile
);

// @route   GET /api/sellers/dashboard
// @desc    Get seller dashboard data
// @access  Private/Seller
router.get('/dashboard', protect, seller, sellerController.getSellerDashboard);

// @route   GET /api/sellers/orders
// @desc    Get seller orders
// @access  Private/Seller
router.get('/orders', protect, seller, sellerController.getSellerOrders);

// @route   PUT /api/sellers/orders/:id
// @desc    Update order status (seller specific)
// @access  Private/Seller
router.put('/orders/:id', protect, seller, sellerController.updateOrderStatus);

// @route   GET /api/sellers/:id
// @desc    Get seller profile by ID (public)
// @access  Public
router.get('/:id', sellerController.getSellerById);

module.exports = router; 