const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, admin, seller } = require('../middleware/authMiddleware');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, orderController.createOrder);

// @route   GET /api/orders/my-orders
// @desc    Get logged in user orders
// @access  Private
router.get('/my-orders', protect, orderController.getMyOrders);

// @route   GET /api/orders/seller
// @desc    Get seller's orders
// @access  Private/Seller
router.get('/seller', protect, seller, orderController.getSellerOrders);

// @route   GET /api/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/', protect, admin, orderController.getOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, orderController.getOrderById);

// @route   PUT /api/orders/:id/pay
// @desc    Update order to paid
// @access  Private
router.put('/:id/pay', protect, orderController.updateOrderToPaid);

// @route   PUT /api/orders/:id/deliver
// @desc    Update order to delivered
// @access  Private/Admin
router.put('/:id/deliver', protect, admin, orderController.updateOrderToDelivered);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin/Seller
router.put('/:id/status', protect, (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized to update order status' });
  }
}, orderController.updateOrderStatus);

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router; 