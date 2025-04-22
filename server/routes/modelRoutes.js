const express = require('express');
const { protect, seller } = require('../middleware/authMiddleware');
const { 
  uploadModelToGitHub, 
  getModelsFromGitHub 
} = require('../controllers/modelController');

const router = express.Router();

// Upload model to GitHub
router.post('/upload-to-github', protect, seller, uploadModelToGitHub);

// Get models from GitHub
router.get('/github-models', protect, seller, getModelsFromGitHub);

module.exports = router; 