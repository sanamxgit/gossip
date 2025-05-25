const express = require('express');
const router = express.Router();
const { protect, seller, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/cloudinaryMiddleware');
const {
  submitVerification,
  getSellerRequests,
  getAllRequests,
  updateRequestStatus
} = require('../controllers/brandVerificationController');

// Seller routes
router.post('/', protect, seller, upload.array('documents', 5), submitVerification);
router.get('/seller', protect, seller, getSellerRequests);

// Admin routes
router.get('/admin', protect, admin, getAllRequests);
router.put('/:id', protect, admin, updateRequestStatus);

module.exports = router; 