const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/applications
// @desc    Get all seller applications
// @access  Private/Admin
router.get('/applications', protect, admin, adminController.getSellerApplications);

// @route   GET /api/admin/applications/:id
// @desc    Get single seller application
// @access  Private/Admin
router.get('/applications/:id', protect, admin, adminController.getSellerApplicationById);

// @route   PUT /api/admin/applications/:id
// @desc    Update seller application status
// @access  Private/Admin
router.put('/applications/:id', protect, admin, adminController.updateSellerApplicationStatus);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private/Admin
router.get('/dashboard', protect, admin, adminController.getAdminDashboard);

// @route   PUT /api/admin/users/:id/role
// @desc    Change user role
// @access  Private/Admin
router.put('/users/:id/role', protect, admin, adminController.changeUserRole);

module.exports = router; 