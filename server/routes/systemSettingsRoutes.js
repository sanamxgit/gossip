const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/systemSettingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getSettings);
router.put('/', protect, admin, updateSettings);

module.exports = router; 