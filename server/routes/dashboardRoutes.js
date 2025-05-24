const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    // Get total sales
    const totalSales = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Get total sellers
    const totalSellers = await User.countDocuments({ role: 'seller' });

    // Get recent sales
    const recentSales = await Order.find({ status: 'completed' })
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name email')
      .populate('items.product', 'title price');

    // Get recent sellers
    const recentSellers = await User.find({ role: 'seller' })
      .sort('-createdAt')
      .limit(5)
      .select('name email createdAt');

    // Get sales by month (last 12 months)
    const salesByMonth = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get sellers by month (last 12 months)
    const sellersByMonth = await User.aggregate([
      {
        $match: {
          role: 'seller',
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalSellers,
      recentSales,
      recentSellers,
      salesByMonth,
      sellersByMonth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/dashboard/seller-stats/:id
// @desc    Get seller dashboard statistics
// @access  Private/Seller
router.get('/seller-stats/:id', protect, async (req, res) => {
  try {
    // Ensure the requesting user is the seller or an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get seller's total sales
    const totalSales = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          'items.seller': req.params.id
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get seller's recent sales
    const recentSales = await Order.find({
      'items.seller': req.params.id,
      status: 'completed'
    })
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name email')
      .populate('items.product', 'title price');

    // Get seller's sales by month (last 12 months)
    const salesByMonth = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          'items.seller': req.params.id,
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11)) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get total products
    const totalProducts = await Product.countDocuments({ seller: req.params.id });

    res.json({
      totalSales: totalSales[0]?.total || 0,
      totalProducts,
      recentSales,
      salesByMonth
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 