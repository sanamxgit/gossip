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
      // Use the system's temp directory
      cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
      // Create a unique filename
      const hash = crypto.randomBytes(8).toString('hex');
      cb(null, `${hash}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
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
  
  // Use multer to handle the file upload to disk
  modelUpload(req, res, async (err) => {
    let tempFilePath = null;
    
    try {
      // Handle multer errors
      if (err) {
        console.error('Error in file upload middleware:', err);
        return res.status(400).json({ message: err.message });
      }
      
      // Check if file exists
      if (!req.file) {
        console.error('No file provided');
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      tempFilePath = req.file.path;
      
      console.log('File received:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        tempPath: tempFilePath
      });
      
      // Get the platform
      const platform = req.body.platform || 'default';
      
      console.log('Uploading to Cloudinary for platform:', platform);
      
      // Get file extension from original name
      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      
      // Generate a unique public_id
      const publicId = `ar_models/${platform}/${Date.now()}-${path.basename(req.file.originalname, path.extname(req.file.originalname))}`;
      
      // Configure upload options for Cloudinary
      const uploadOptions = {
        resource_type: 'raw',  // Use 'raw' for 3D model files
        public_id: publicId,
        overwrite: true
      };
      
      console.log('Cloudinary upload options:', uploadOptions);
      
      // Upload directly to Cloudinary
      cloudinary.uploader.upload(tempFilePath, uploadOptions, (error, result) => {
        // Always clean up the temp file regardless of success or failure
        if (tempFilePath) {
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting temp file:', unlinkErr);
            }
          });
        }
        
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({
            message: 'Error uploading to Cloudinary',
            error: error.message
          });
        }
        
        console.log('Cloudinary upload success:', {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format
        });
        
        // Return success response
        res.json({
          secure_url: result.secure_url,
          public_id: result.public_id,
          platform: platform
        });
      });
    } catch (error) {
      console.error('Unexpected error in model upload:', error);
      
      // Clean up the temp file if it exists
      if (tempFilePath) {
        fs.unlink(tempFilePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting temp file:', unlinkErr);
          }
        });
      }
      
      res.status(500).json({
        message: 'Server error during file upload',
        error: error.message
      });
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

    res.json({
      secure_url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
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

    // Check if iOS or Android
    const userAgent = req.headers['user-agent'].toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    console.log('AR View Request:', {
      productId: req.params.id,
      userAgent: req.headers['user-agent'],
      isIOS,
      arModels: product.arModels
    });
    
    if (isIOS) {
      // For iOS, redirect directly to AR Quick Look
      if (product.arModels && product.arModels.ios && product.arModels.ios.url) {
        return res.redirect(product.arModels.ios.url);
      } else {
        return res.status(404).json({ message: 'No iOS AR model available' });
      }
    } else {
      // For Android, redirect to Scene Viewer
      if (product.arModels && product.arModels.android && product.arModels.android.url) {
        const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${product.arModels.android.url}&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
        return res.redirect(sceneViewerUrl);
      } else {
        return res.status(404).json({ message: 'No Android AR model available' });
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

module.exports = router; 