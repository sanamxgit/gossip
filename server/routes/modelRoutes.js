const express = require('express');
const { protect, seller } = require('../middleware/authMiddleware');
const { 
  uploadModelToGitHub, 
  getModelsFromGitHub 
} = require('../controllers/modelController');
const modelUpload = require('../config/modelUpload');

const router = express.Router();

// Upload model to GitHub
router.post('/upload-to-github', protect, seller, uploadModelToGitHub);

// Get models from GitHub
router.get('/github-models', protect, seller, getModelsFromGitHub);

// @route   POST /api/models/upload
// @desc    Upload 3D model
// @access  Private/Seller
router.post('/upload', protect, seller, (req, res) => {
  modelUpload(req, res, async (err) => {
    try {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      res.json({
        secure_url: req.file.path,
        public_id: req.file.filename
      });
    } catch (error) {
      console.error('Error uploading 3D model:', error);
      res.status(500).json({ message: error.message || 'Error uploading 3D model' });
    }
  });
});

module.exports = router; 