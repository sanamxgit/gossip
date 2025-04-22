const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Submit seller application
// @route   POST /api/sellers/apply
// @access  Private
const applyForSeller = async (req, res) => {
  try {
    const {
      storeName,
      storeDescription,
      address,
      contactEmail,
      contactPhone,
    } = req.body;

    // Check if user already has a pending or approved application
    const existingApplication = await SellerApplication.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You already have a pending or approved seller application',
      });
    }

    // Check if user is already a seller
    const user = await User.findById(req.user._id);
    if (user.role === 'seller') {
      return res.status(400).json({
        message: 'You are already a seller',
      });
    }

    // Create new seller application
    const sellerApplication = new SellerApplication({
      user: req.user._id,
      storeName,
      storeDescription,
      address,
      contactEmail,
      contactPhone,
      // Get document paths from uploaded files
      documents: req.files ? req.files.map((file) => file.path) : [],
    });

    const createdApplication = await sellerApplication.save();
    res.status(201).json(createdApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get seller application status
// @route   GET /api/sellers/application
// @access  Private
const getSellerApplicationStatus = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    if (!application) {
      return res.status(404).json({ message: 'No application found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update seller profile
// @route   PUT /api/sellers/profile
// @access  Private/Seller
const updateSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a seller
    if (user.role !== 'seller') {
      return res.status(403).json({ message: 'Not authorized as a seller' });
    }

    const {
      storeName,
      storeDescription,
      address,
      contactEmail,
      contactPhone,
      returnPolicy,
      shippingPolicy,
    } = req.body;

    // Update seller profile
    user.sellerProfile = {
      ...user.sellerProfile,
      storeName: storeName || user.sellerProfile.storeName,
      storeDescription: storeDescription || user.sellerProfile.storeDescription,
      address: address || user.sellerProfile.address,
      contactEmail: contactEmail || user.sellerProfile.contactEmail,
      contactPhone: contactPhone || user.sellerProfile.contactPhone,
      returnPolicy: returnPolicy || user.sellerProfile.returnPolicy,
      shippingPolicy: shippingPolicy || user.sellerProfile.shippingPolicy,
    };

    // Update logo if provided
    if (req.file) {
      user.sellerProfile.logo = req.file.path;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      sellerProfile: updatedUser.sellerProfile,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get seller dashboard data
// @route   GET /api/sellers/dashboard
// @access  Private/Seller
const getSellerDashboard = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    const last3Months = new Date(now.setMonth(now.getMonth() - 2));
    
    // Get total product count
    const totalProducts = await Product.countDocuments({ seller: req.user._id });
    
    // Get total orders count
    const orders = await Order.find({
      'orderItems.seller': req.user._id,
    });
    
    // Calculate total revenue
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let quarterlyRevenue = 0;
    
    for (const order of orders) {
      // Only count completed orders
      if (order.isDelivered) {
        // Filter order items for this seller
        const sellerItems = order.orderItems.filter(
          item => item.seller.toString() === req.user._id.toString()
        );
        
        // Calculate revenue for this seller from this order
        const orderRevenue = sellerItems.reduce(
          (sum, item) => sum + item.price * item.qty,
          0
        );
        
        totalRevenue += orderRevenue;
        
        // Check if order is from the last month
        if (order.deliveredAt >= lastMonth) {
          monthlyRevenue += orderRevenue;
        }
        
        // Check if order is from the last 3 months
        if (order.deliveredAt >= last3Months) {
          quarterlyRevenue += orderRevenue;
        }
      }
    }
    
    // Get recent orders (last 5)
    const recentOrders = await Order.find({
      'orderItems.seller': req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username');
    
    // Get top selling products
    const products = await Product.find({ seller: req.user._id });
    
    // Sort products by sales count
    const topProducts = products
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);
    
    res.json({
      totalProducts,
      totalOrders: orders.length,
      totalRevenue,
      monthlyRevenue,
      quarterlyRevenue,
      recentOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller profile by ID (public)
// @route   GET /api/sellers/:id
// @access  Public
const getSellerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user || user.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      sellerProfile: user.sellerProfile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get seller orders
// @route   GET /api/sellers/orders
// @access  Private/Seller
const getSellerOrders = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    // Find all orders containing products from this seller
    const orders = await Order.find({
      'orderItems.seller': req.user._id,
    })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    
    // Count total orders for pagination
    const count = await Order.countDocuments({
      'orderItems.seller': req.user._id,
    });
    
    // Process orders to only include items from this seller
    const processedOrders = orders.map(order => {
      // Filter order items to only include this seller's items
      const sellerItems = order.orderItems.filter(
        item => item.seller.toString() === req.user._id.toString()
      );
      
      // Calculate total price for this seller's items
      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );
      
      // Return a simplified order object with only relevant information
      return {
        _id: order._id,
        user: order.user,
        orderItems: sellerItems,
        sellerTotal,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        isDelivered: order.isDelivered,
        deliveredAt: order.deliveredAt,
        status: order.status,
        createdAt: order.createdAt,
      };
    });
    
    res.json({
      orders: processedOrders,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (seller specific)
// @route   PUT /api/sellers/orders/:id
// @access  Private/Seller
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if any order item belongs to this seller
    const sellerItems = order.orderItems.filter(
      item => item.seller.toString() === req.user._id.toString()
    );
    
    if (sellerItems.length === 0) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }
    
    // Update status for only this seller's items
    order.orderItems = order.orderItems.map(item => {
      if (item.seller.toString() === req.user._id.toString()) {
        return { ...item, status };
      }
      return item;
    });
    
    // If all items are marked as shipped, mark the order as delivered
    if (status === 'shipped' && 
        order.orderItems.every(item => item.status === 'shipped')) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    
    const updatedOrder = await order.save();
    
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  applyForSeller,
  getSellerApplicationStatus,
  updateSellerProfile,
  getSellerDashboard,
  getSellerById,
  getSellerOrders,
  updateOrderStatus,
}; 