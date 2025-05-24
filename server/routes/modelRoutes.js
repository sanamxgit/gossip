const express = require('express');
const { protect, seller } = require('../middleware/authMiddleware');
const { 
  uploadModelToGitHub, 
  getModelsFromGitHub 
} = require('../controllers/modelController');
const modelUpload = require('../config/modelUpload');
const axios = require('axios');

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

// Proxy route to serve USDZ files with correct MIME type
router.get('/ar-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Validate file extension
    if (!url.toLowerCase().endsWith('.usdz')) {
      return res.status(400).json({ message: 'Only USDZ files are supported for AR Quick Look' });
    }

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'ARQuickLook/1.0'
      }
    });

    // Set comprehensive headers for iOS AR QuickLook
    res.setHeader('Content-Type', 'model/vnd.usdz+zip');
    res.setHeader('Content-Disposition', 'inline; filename="model.usdz"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Send the buffer directly
    res.send(response.data);
  } catch (error) {
    console.error('Error serving AR model:', error);
    res.status(500).json({ message: 'Error serving AR model' });
  }
});

// Validate USDZ file
router.post('/validate-usdz', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Check file extension
    if (!url.toLowerCase().endsWith('.usdz')) {
      return res.status(400).json({ 
        valid: false, 
        message: 'File must have .usdz extension' 
      });
    }

    // Try to fetch headers
    const response = await axios.head(url);
    
    // Check content type
    const contentType = response.headers['content-type'];
    const isValidContentType = contentType && (
      contentType.includes('model/vnd.usdz+zip') ||
      contentType.includes('application/octet-stream')
    );

    if (!isValidContentType) {
      return res.status(200).json({
        valid: false,
        message: 'Invalid content type for USDZ file'
      });
    }

    res.json({
      valid: true,
      message: 'USDZ file appears to be valid'
    });
  } catch (error) {
    console.error('Error validating USDZ file:', error);
    res.status(200).json({
      valid: false,
      message: 'Error validating USDZ file'
    });
  }
});

// AR Quick Look HTML wrapper route
router.get('/ar-view', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  // Create HTML with proper meta tags for AR Quick Look
  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>View in AR</title>
    <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .ar-button { 
            padding: 20px 40px;
            font-size: 18px;
            background: #007AFF;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="ar" href="${url}">
    <a rel="ar" href="${url}">
        <button class="ar-button">View in AR</button>
    </a>
    <script>
        // Auto-trigger AR on iOS devices
        window.addEventListener('load', function() {
            if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
                document.querySelector('a[rel="ar"]').click();
            }
        });
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router; 