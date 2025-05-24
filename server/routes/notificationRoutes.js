const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/notifications/admin
// @desc    Get admin notifications
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const notifications = await Notification.find({ forAdmin: true })
      .sort('-createdAt')
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/notifications/user
// @desc    Get user notifications
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ forUser: req.user._id })
      .sort('-createdAt')
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user has permission to mark this notification as read
    if (notification.forAdmin && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (notification.forUser && notification.forUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user has permission to delete this notification
    if (notification.forAdmin && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (notification.forUser && notification.forUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 