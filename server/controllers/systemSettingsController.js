const SystemSettings = require('../models/SystemSettings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    
    // Update only the fields that are provided
    Object.keys(req.body).forEach(key => {
      if (settings.schema.paths[key]) {
        settings[key] = req.body[key];
      }
    });
    
    settings.updatedBy = req.user._id;
    const updatedSettings = await settings.save();
    
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
}; 