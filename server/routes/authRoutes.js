const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', upload.array('documents', 3), authController.registerUser);

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', authController.loginUser);

// @route   GET /api/auth/me
// @desc    Get user profile
// @access  Private
router.get('/me', protect, authController.getUserProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  protect,
  upload.single('avatar'),
  authController.updateUserProfile
);

// @route   GET /api/auth/validate-token
// @desc    Validate JWT token
// @access  Private
router.get('/validate-token', protect, (req, res) => {
  res.json({ valid: true, user: { id: req.user._id, role: req.user.role } });
});

// @route   POST /api/auth/seller-application
// @desc    Apply to become a seller
// @access  Private
router.post(
  '/seller-application',
  protect,
  upload.single('storeImage'),
  authController.applyForSeller
);

// @route   GET /api/auth/seller-application
// @desc    Check seller application status
// @access  Private
router.get('/seller-application', protect, authController.checkSellerApplication);

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post('/admin/login', authController.loginAdmin);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', protect, authController.changePassword);

// Admin Routes
// @route   GET /api/auth/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', protect, admin, authController.getUsers);

// @route   DELETE /api/auth/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', protect, admin, authController.deleteUser);

// @route   GET /api/auth/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/users/:id', protect, admin, authController.getUserById);

// @route   PUT /api/auth/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', protect, admin, authController.updateUser);

// @route   GET /api/auth/sellers
// @desc    Get all sellers
// @access  Private/Admin
router.get('/sellers', protect, admin, authController.getSellers);

// @route   GET /api/auth/seller-applications
// @desc    Get all seller applications
// @access  Private/Admin
router.get('/seller-applications', protect, admin, authController.getSellerApplications);

// @route   PUT /api/auth/sellers/:id/verify
// @desc    Update seller verification status
// @access  Private/Admin
router.put('/sellers/:id/verify', protect, admin, authController.updateSellerVerification);

// @route   PUT /api/auth/seller-applications/:id/approve
// @desc    Approve seller application
// @access  Private/Admin
router.put('/seller-applications/:id/approve', protect, admin, authController.approveSellerApplication);

// @route   PUT /api/auth/seller-applications/:id/reject
// @desc    Reject seller application
// @access  Private/Admin
router.put('/seller-applications/:id/reject', protect, admin, authController.rejectSellerApplication);

module.exports = router; 