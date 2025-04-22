const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

// @desc    Get all seller applications
// @route   GET /api/admin/applications
// @access  Private/Admin
const getSellerApplications = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    // Filter applications by status if provided
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const count = await SellerApplication.countDocuments(filter);
    const applications = await SellerApplication.find(filter)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    
    res.json({
      applications,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single seller application
// @route   GET /api/admin/applications/:id
// @access  Private/Admin
const getSellerApplicationById = async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id)
      .populate('user', 'username email');
    
    if (application) {
      res.json(application);
    } else {
      res.status(404).json({ message: 'Application not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update seller application status
// @route   PUT /api/admin/applications/:id
// @access  Private/Admin
const updateSellerApplicationStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    
    const application = await SellerApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    // Update application status
    application.status = status;
    application.adminFeedback = {
      message: message || (status === 'approved' ? 'Your application has been approved.' : 'Your application has been rejected.'),
      date: new Date(),
    };
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    
    // If approved, update the user role to seller
    if (status === 'approved') {
      const user = await User.findById(application.user);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      user.role = 'seller';
      user.sellerProfile = {
        storeName: application.storeName,
        storeDescription: application.storeDescription,
        address: application.address,
        contactEmail: application.contactEmail,
        logo: '',
        isVerified: true,
        verificationStatus: 'approved',
        dateApplied: application.createdAt,
      };
      
      await user.save();
    }
    
    const updatedApplication = await application.save();
    res.json(updatedApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    // Get counts
    const usersCount = await User.countDocuments();
    const sellersCount = await User.countDocuments({ role: 'seller' });
    const productsCount = await Product.countDocuments();
    const ordersCount = await Order.countDocuments();
    const pendingApplicationsCount = await SellerApplication.countDocuments({ status: 'pending' });
    const categoriesCount = await Category.countDocuments();
    const brandsCount = await Brand.countDocuments();
    
    // Get recent orders
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username');
    
    // Get recent products
    const recentProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('seller', 'username')
      .populate('category', 'name')
      .populate('brand', 'name');
    
    // Get recent users
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password');
    
    // Get sales data for last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Get top selling categories
    const topCategories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);
    
    // Populate category names
    const categoryIds = topCategories.map(item => item._id);
    const categories = await Category.find({ _id: { $in: categoryIds } });
    
    const topCategoriesWithNames = topCategories.map(item => {
      const category = categories.find(c => c._id.toString() === item._id.toString());
      return {
        _id: item._id,
        name: category ? category.name : 'Unknown',
        count: item.count,
      };
    });
    
    res.json({
      counts: {
        users: usersCount,
        sellers: sellersCount,
        products: productsCount,
        orders: ordersCount,
        pendingApplications: pendingApplicationsCount,
        categories: categoriesCount,
        brands: brandsCount,
      },
      recentOrders,
      recentProducts,
      recentUsers,
      salesData,
      topCategories: topCategoriesWithNames,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent downgrading of own account if admin
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot downgrade your own admin account' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSellerApplications,
  getSellerApplicationById,
  updateSellerApplicationStatus,
  getAdminDashboard,
  changeUserRole,
}; 