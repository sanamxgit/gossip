const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder for uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log(`Serving static files from: ${path.join(__dirname, 'uploads')} via /uploads URL path`);

// Set an additional path specifically for section images
app.use('/sections', express.static(path.join(__dirname, 'uploads', 'sections')));
console.log(`Serving section images from: ${path.join(__dirname, 'uploads', 'sections')} via /sections URL path`);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
const sectionDir = path.join(uploadDir, 'sections');
const iconCategoriesDir = path.join(sectionDir, 'icons');
const bannerDir = path.join(sectionDir, 'banner');
const categoriesDir = path.join(sectionDir, 'categories');

// Create uploads directories if they don't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory');
}
if (!fs.existsSync(sectionDir)) {
  fs.mkdirSync(sectionDir, { recursive: true });
  console.log('Created sections directory');
}
if (!fs.existsSync(iconCategoriesDir)) {
  fs.mkdirSync(iconCategoriesDir, { recursive: true });
  console.log('Created icons directory for icon-categories');
}
if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
  console.log('Created banner directory');
}
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true });
  console.log('Created categories directory');
}

// Create a placeholder image if it doesn't exist
const placeholderPath = path.join(uploadDir, 'placeholder.svg');
if (!fs.existsSync(placeholderPath)) {
  const placeholderSVG = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" font-family="Arial" font-size="18" fill="#888" text-anchor="middle">Placeholder</text></svg>';
  fs.writeFileSync(placeholderPath, placeholderSVG);
  console.log('Created placeholder image');
}

// Ensure placeholder-image.png exists (used for fallback)
const placeholderPngPath = path.join(uploadDir, 'placeholder-image.png');
if (!fs.existsSync(placeholderPngPath)) {
  try {
    const placeholderSVG = '<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="32" fill="#888" text-anchor="middle" dominant-baseline="middle">Image Not Available</text></svg>';
    const svgBuffer = Buffer.from(placeholderSVG);
    fs.writeFileSync(placeholderPngPath, svgBuffer);
    console.log('Created placeholder PNG image');
  } catch (error) {
    console.error('Error creating placeholder PNG:', error);
  }
}

// Add a debug route to check file access
app.get('/check-file-access', (req, res) => {
  const testFilePath = path.join(uploadDir, 'test-write.txt');
  try {
    // Test write access
    fs.writeFileSync(testFilePath, 'This is a test file to check write permissions.');
    
    // Test read access
    const content = fs.readFileSync(testFilePath, 'utf8');
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
    res.json({
      success: true,
      message: 'File system permissions check passed',
      uploadDir,
      sectionDir,
      dirExists: {
        uploadDir: fs.existsSync(uploadDir),
        sectionDir: fs.existsSync(sectionDir),
        bannerDir: fs.existsSync(bannerDir),
        categoriesDir: fs.existsSync(categoriesDir)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'File system permissions check failed',
      error: error.message,
      uploadDir,
      sectionDir,
      permissions: {
        canRead: fs.existsSync(uploadDir),
        canWrite: false
      }
    });
  }
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const modelRoutes = require('./routes/modelRoutes');
const homeSectionRoutes = require('./routes/homeSectionRoutes');
const homepageSectionRoutes = require('./routes/homepageSectionRoutes');
const brandVerificationRoutes = require('./routes/brandVerificationRoutes');

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Test direct routes
app.post('/auth/login-test', (req, res) => {
  res.json({ message: 'Login test route working!', body: req.body });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/home-sections', homeSectionRoutes);
app.use('/api/homepage/sections', homepageSectionRoutes);
app.use('/api/brand-verification', brandVerificationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

// Fallback MongoDB URI if not set in environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gossip';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Starting server without MongoDB connection for testing purposes...');
    
    // Start server anyway for testing purposes
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in TEST mode on port ${PORT} (without MongoDB)`);
    });
  }); 
  console.log('Mongo URI:', process.env.MONGODB_URI);
