const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, seller, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryMiddleware');
const Product = require('../models/Product');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for basic disk storage
const modelUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = os.tmpdir();
      // Ensure the callback is properly called with two arguments
      fs.access(uploadDir, fs.constants.W_OK, (err) => {
        if (err) {
          console.error('Upload directory not accessible:', err);
          cb(new Error('Upload directory not accessible'));
        } else {
          console.log('Upload directory exists and is writable:', uploadDir);
          cb(null, uploadDir);
        }
      });
    },
    filename: function (req, file, cb) {
      const hash = crypto.randomBytes(8).toString('hex');
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${hash}-${safeName}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Get platform from request body
    const platform = req.body.platform;
    
    // Log the entire request body and file details for debugging
    console.log('Request body:', req.body);
    console.log('File details:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype
    });
    
    if (!platform || !['ios', 'android'].includes(platform)) {
      console.error('Invalid platform:', platform);
      cb(new Error('Platform (ios or android) is required'));
      return;
    }

    if (platform === 'ios' && ext !== '.usdz') {
      cb(new Error('Only USDZ files are allowed for iOS'));
      return;
    }

    if (platform === 'android' && !['.glb', '.gltf'].includes(ext)) {
      cb(new Error('Only GLB or GLTF files are allowed for Android'));
      return;
    }
    
    cb(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1 // Only allow one file per request
  }
}).single('file');

// Configure multer storage with Cloudinary for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// @route   POST /api/products/upload/model
// @desc    Upload 3D model
// @access  Private/Seller
router.post('/upload/model', protect, seller, (req, res) => {
  console.log('New model upload request received');
  console.log('Request headers:', req.headers);
  
  // Configure multer for model upload
  const modelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'models');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const modelUpload = multer({
    storage: modelStorage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
  }).single('file');

  modelUpload(req, res, async (err) => {
    if (err) {
      console.error('Error in file upload middleware:', err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get platform from form data
    const platform = req.body.platform;
    console.log('Platform from request:', platform);

    if (!platform || !['ios', 'android'].includes(platform)) {
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      return res.status(400).json({ message: 'Platform (ios or android) is required' });
    }

    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `ar_models/${platform}`,
        resource_type: 'raw',
        use_filename: true,
        unique_filename: true,
        timeout: 300000 // 5 minute timeout
      });

      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });

      res.json({
        secure_url: result.secure_url,
        public_id: result.public_id,
        platform: platform
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      res.status(500).json({ message: 'Error uploading file to cloud storage' });
    }
  });
});

// @route   POST /api/products/upload
// @desc    Upload product image
// @access  Private/Seller
router.post('/upload', protect, seller, imageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Since we're using CloudinaryStorage, req.file will contain Cloudinary info
    res.json({
      secure_url: req.file.path, // This is the Cloudinary URL
      public_id: req.file.filename // This is the Cloudinary public_id
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Regular Routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/search', productController.searchProducts);
router.get('/seller/:sellerId', productController.getProductsBySeller);
router.get('/seller/me', protect, seller, productController.getMyProducts);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', productController.getProductById);

// @route   GET /api/products/ar-view/:id
// @desc    Get product AR model
// @access  Public
router.get('/ar-view/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const userAgent = req.headers['user-agent'].toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIOS) {
      if (product.arModels?.ios?.url) {
        const modelUrl = product.arModels.ios.url;
        
        // For iOS, we need to handle USDZ files directly
        if (modelUrl.endsWith('.usdz')) {
          // Instead of redirecting directly to the model URL,
          // use our proxy endpoint that sets the correct MIME type
          const proxyUrl = `/api/products/usdz-proxy?url=${encodeURIComponent(modelUrl)}`;
          
          // Serve the AR Quick Look page with the proxied URL
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Cache-Control', 'no-cache');
          
          res.send(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                <title>${product.title} - View in AR</title>
                <style>
                  body { margin: 0; padding: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
                  .ar-link {
                    display: block;
                    width: 100%;
                    height: 100%;
                    text-decoration: none;
                  }
                </style>
              </head>
              <body>
                <a rel="ar" href="${proxyUrl}">
                  <img src="${encodeURI(product.images?.[0]?.url || '')}" style="display: none;">
                </a>
                <script>
                  // Auto-trigger AR Quick Look
                  window.addEventListener('load', () => {
                    document.querySelector('a[rel="ar"]').click();
                  });
                </script>
              </body>
            </html>
          `);
          return;
        }
        
        // If not a USDZ file, continue with normal handling
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache');
        
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
              <title>${product.title} - View in AR</title>
              <style>
                body { margin: 0; padding: 0; width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
                .ar-link {
                  display: block;
                  width: 100%;
                  height: 100%;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <a rel="ar" href="${encodeURI(modelUrl)}">
                <img src="${encodeURI(product.images?.[0]?.url || '')}" style="display: none;">
              </a>
              <script>
                // Auto-trigger AR Quick Look
                window.addEventListener('load', () => {
                  document.querySelector('a[rel="ar"]').click();
                });
              </script>
            </body>
          </html>
        `);
      } else {
        res.status(404).json({ message: 'No iOS AR model available' });
      }
    } else {
      // For Android devices
      if (product.arModels?.android?.url) {
        const modelUrl = product.arModels.android.url;
        
        // Set proper headers for Android Scene Viewer
        res.setHeader('Content-Type', 'text/html');
        
        // Create the Scene Viewer URL with proper parameters
        const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_preferred&title=${encodeURIComponent(product.title)}`;
        
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${product.title} - View in AR</title>
            </head>
            <body>
              <script>
                window.location.href = '${sceneViewerUrl}';
              </script>
            </body>
          </html>
        `);
      } else {
        res.status(404).json({ message: 'No Android AR model available' });
      }
    }
  } catch (error) {
    console.error('Error serving AR model:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Seller
router.post(
  '/',
  protect,
  seller,
  upload.array('images', 5),
  productController.createProduct
);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Seller
router.put(
  '/:id',
  protect,
  seller,
  upload.array('images', 5),
  productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Seller
router.delete('/:id', protect, seller, productController.deleteProduct);

// @route   POST /api/products/:id/images
// @desc    Upload product images
// @access  Private/Seller
router.post(
  '/:id/images',
  protect,
  seller,
  upload.array('images', 5),
  productController.uploadProductImages
);

// @route   DELETE /api/products/:id/images/:imageId
// @desc    Delete product image
// @access  Private/Seller
router.delete(
  '/:id/images/:imageId',
  protect,
  seller,
  productController.deleteProductImage
);

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock
// @access  Private/Seller
router.patch('/:id/stock', protect, seller, productController.updateProductStock);

// Admin routes
// @route   GET /api/products/admin/all
// @desc    Get all products (admin)
// @access  Private/Admin
router.get('/admin/all', protect, admin, productController.getAllProductsAdmin);

// @route   PUT /api/products/admin/:id
// @desc    Update a product (admin)
// @access  Private/Admin
router.put(
  '/admin/:id',
  protect,
  admin,
  upload.array('images', 5),
  productController.updateProductAdmin
);

// @route   DELETE /api/products/admin/:id
// @desc    Delete a product (admin)
// @access  Private/Admin
router.delete('/admin/:id', protect, admin, productController.deleteProductAdmin);

// @route   DELETE /api/products/image/:public_id
// @desc    Delete product image from Cloudinary
// @access  Private/Seller
router.delete('/image/:public_id', protect, seller, async (req, res) => {
  try {
    console.log('Deleting image with public_id:', req.params.public_id);
    
    // Decode the public_id parameter as it might be URL-encoded
    const publicId = decodeURIComponent(req.params.public_id);
    console.log('Decoded public_id:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary delete result:', result);
    
    if (result.result !== 'ok') {
      console.error('Cloudinary deletion failed:', result);
      return res.status(400).json({ 
        message: 'Failed to delete image', 
        error: result.result
      });
    }
    
    res.json({ message: 'Image deleted successfully', result });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

// @route   DELETE /api/products/upload/delete
// @desc    Delete product image from Cloudinary
// @access  Private/Seller
router.delete('/upload/delete', protect, seller, async (req, res) => {
  try {
    if (!req.body || !req.body.public_id) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
    
    console.log('Deleting image with public_id:', req.body.public_id);
    const result = await cloudinary.uploader.destroy(req.body.public_id);
    console.log('Cloudinary delete result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

// @route   DELETE /api/products/upload/cloudinary/:public_id
// @desc    Delete image directly from Cloudinary without product association
// @access  Private/Seller
router.delete('/upload/cloudinary/:public_id', protect, seller, async (req, res) => {
  try {
    // For direct Cloudinary deletion, first try to properly extract the public_id
    let publicId = req.params.public_id;
    
    // Make sure we have a valid public_id
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
    
    // Decode the public_id parameter as it might be URL-encoded
    publicId = decodeURIComponent(publicId);
    
    console.log('Directly deleting image from Cloudinary with public_id:', publicId);
    
    try {
      // Attempt to delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary direct delete result:', result);
      
      if (result.result !== 'ok') {
        return res.status(400).json({ 
          message: 'Failed to delete image from Cloudinary', 
          error: result.result 
        });
      }
      
      return res.json({ 
        message: 'Image deleted from Cloudinary successfully', 
        result 
      });
    } catch (cloudinaryError) {
      console.error('Error in Cloudinary deletion:', cloudinaryError);
      return res.status(500).json({ 
        message: 'Error deleting from Cloudinary', 
        error: cloudinaryError.message 
      });
    }
  } catch (error) {
    console.error('Unexpected error in direct Cloudinary deletion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/products/ping
// @desc    Test connection to server
// @access  Public
router.get('/ping', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// @route   GET /api/products/ar-proxy
// @desc    Proxy for serving USDZ files with correct MIME type
// @access  Public
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

    // Fetch the file from Cloudinary
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

// @route   GET /api/products/usdz-proxy
// @desc    Proxy for serving USDZ files with correct MIME type
// @access  Public
router.get('/usdz-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    // Validate file extension
    if (!url.toLowerCase().endsWith('.usdz')) {
      return res.status(400).json({ message: 'Only USDZ files are supported' });
    }

    // Stream the file from Cloudinary
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
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
    
    // If Cloudinary provides content length, pass it through
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    
    // Pipe the response directly to avoid loading the entire file into memory
    response.data.pipe(res);

    // Handle errors in the stream
    response.data.on('error', (error) => {
      console.error('Error streaming USDZ file:', error);
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming USDZ file' });
      }
    });
  } catch (error) {
    console.error('Error serving USDZ file:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error serving USDZ file' });
    }
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Create a product review
// @access  Private/Seller
router.post('/:id/reviews', protect, productController.createProductReview);

// @route   POST /api/products/:id/reviews/:reviewId/reply
// @desc    Add a review reply
// @access  Private/Seller
router.post('/:id/reviews/:reviewId/reply', protect, productController.addReviewReply);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a search regex pattern
    const searchPattern = new RegExp(q, 'i');

    // Search in title, description, and brand
    const products = await Product.find({
      $or: [
        { title: searchPattern },
        { description: searchPattern },
        { brand: searchPattern }
      ]
    })
    .select('title description price images brand category')
    .populate('category', 'name')
    .limit(10); // Limit to 10 results for quick search

    res.json({ products });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Server error while searching products' });
  }
});

module.exports = router; 