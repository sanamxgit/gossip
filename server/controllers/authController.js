const User = require('../models/User');
const SellerApplication = require('../models/SellerApplication');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role, sellerProfile } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role === 'seller' ? 'seller' : 'user', // Only allow user or seller roles
    });

    // If registering as a seller, store seller profile data
    if (role === 'seller' && sellerProfile) {
      user.sellerProfile = {
        storeName: sellerProfile.storeName,
        storeDescription: sellerProfile.storeDescription,
        phoneNumber: sellerProfile.phoneNumber,
        address: sellerProfile.address
      };
      
      if (req.file) {
        user.sellerProfile.storeImage = req.file.path;
      }
    }

    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sellerProfile: user.sellerProfile,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email with password included
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Generate JWT token
      const token = user.generateAuthToken();

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        sellerProfile: user.sellerProfile,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and check if admin, with password included
    const user = await User.findOne({ email, role: 'admin' }).select('+password');

    // Check if user exists, is admin, and password matches
    if (user && (await user.matchPassword(password))) {
      // Generate JWT token
      const token = user.generateAuthToken();

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update basic user info
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;

      // Update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      // Update avatar if provided
      if (req.file) {
        // Remove old avatar if exists
        if (user.avatar && user.avatar.startsWith('uploads')) {
          const oldAvatarPath = path.join(__dirname, '..', '..', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        user.avatar = req.file.path;
      }

      // Update seller profile if user is a seller
      if (user.role === 'seller' && req.body.sellerProfile) {
        user.sellerProfile = {
          ...user.sellerProfile,
          ...req.body.sellerProfile,
        };
      }

      const updatedUser = await user.save();

      // Generate new token with updated info
      const token = updatedUser.generateAuthToken();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        sellerProfile: updatedUser.sellerProfile,
        token,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply to become a seller
// @route   POST /api/auth/seller-application
// @access  Private
const applyForSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'seller') {
      return res.status(400).json({ message: 'User is already a seller' });
    }

    const { storeName, storeDescription, phoneNumber, address } = req.body;

    // Create seller application
    const sellerApplication = new SellerApplication({
      user: user._id,
      storeName,
      storeDescription,
      phoneNumber,
      address: JSON.parse(address),
      storeImage: req.file ? req.file.path : null,
      status: 'pending'
    });

    await sellerApplication.save();

    res.status(201).json({ 
      message: 'Seller application submitted successfully',
      application: sellerApplication 
    });
  } catch (error) {
    console.error('Seller application error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check seller application status
// @route   GET /api/auth/seller-application
// @access  Private
const checkSellerApplication = async (req, res) => {
  try {
    const application = await SellerApplication.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    
    if (!application) {
      return res.status(404).json({ message: 'No seller application found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Check application error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const count = await User.countDocuments({});
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    
    res.json({
      users,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Cannot delete own account' });
      }
      
      await user.remove();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/auth/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  getUserProfile,
  updateUserProfile,
  changePassword,
  applyForSeller,
  checkSellerApplication,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
}; 