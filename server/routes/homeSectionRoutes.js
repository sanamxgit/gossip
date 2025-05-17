const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  getHomeSections,
  getHomeSectionById,
  reorderHomeSections
} = require('../controllers/homeSectionController');

const router = express.Router();

// Public routes
router.get('/', getHomeSections);

// Admin routes
router.post('/', protect, admin, createHomeSection);
// Put specific routes before parameterized routes
router.put('/reorder', protect, admin, reorderHomeSections);

// Parameterized routes
router.get('/:id', getHomeSectionById);
router.put('/:id', protect, admin, updateHomeSection);
router.delete('/:id', protect, admin, deleteHomeSection);

module.exports = router; 