const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
  }
};

// Base upload directory - use absolute path
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
createDir(UPLOAD_PATH);

// Create subdirectories
const dirs = [
  'products', 
  'categories', 
  'brands', 
  'stores', 
  'documents', 
  'avatars', 
  'misc', 
  'sections', 
  'sections/banner',
  'sections/categories', 
  'sections/icons'
];

// Create all directories
dirs.forEach(dir => {
  const fullPath = path.join(UPLOAD_PATH, dir);
  createDir(fullPath);
  console.log(`Ensuring directory exists: ${fullPath}`);
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      console.log(`Processing file upload: ${file.fieldname}, ${file.originalname}, ${file.mimetype}`);
      
      let uploadPath = UPLOAD_PATH;
      
      // Determine folder based on file type
      if (file.fieldname === 'images' || file.fieldname === 'productImages') {
        uploadPath = path.join(uploadPath, 'products');
      } else if (file.fieldname === 'image' || file.fieldname === 'categoryImage') {
        // Check if this is a section image from the URL path or content-type
        const isSection = req.originalUrl && req.originalUrl.includes('sections');
        if (isSection) {
          // This is a section image
          uploadPath = path.join(uploadPath, 'sections');
          console.log('Section image detected via URL path, using directory:', uploadPath);
        } else {
          uploadPath = path.join(uploadPath, 'categories');
        }
      } else if (file.fieldname === 'logo' || file.fieldname === 'brandLogo') {
        uploadPath = path.join(uploadPath, 'brands');
      } else if (file.fieldname === 'storeLogo') {
        uploadPath = path.join(uploadPath, 'stores');
      } else if (file.fieldname === 'documents') {
        uploadPath = path.join(uploadPath, 'documents');
      } else if (file.fieldname === 'avatar') {
        uploadPath = path.join(uploadPath, 'avatars');
      } else if (file.fieldname === 'sectionImage') {
        // Handle section images - default to misc folder in sections
        // The actual directory will be set by the route handler
        uploadPath = path.join(uploadPath, 'sections');
        console.log('Section image upload detected, using directory:', uploadPath);
      } else {
        uploadPath = path.join(uploadPath, 'misc');
        console.log(`Unknown fieldname "${file.fieldname}", using misc directory:`, uploadPath);
      }
      
      createDir(uploadPath);
      console.log(`File will be saved to: ${uploadPath}`);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error in storage destination:', error);
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    try {
      // Generate unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = file.fieldname + '-' + uniqueSuffix + ext;
      console.log('Generated filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(error);
    }
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  try {
    const filetypes = /jpeg|jpg|png|webp|gif|svg|pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.log('File type rejected:', {
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      cb(new Error('Error: Only images (JPEG, PNG, WebP, GIF, SVG), PDFs, and Office documents are allowed!'), false);
    }
  } catch (error) {
    console.error('Error in file filter:', error);
    cb(error, false);
  }
};

// Create the multer instance with default options
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB default file size limit
});

// Create a memory storage instance for section images
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB default file size limit
});

module.exports = { upload, uploadMemory }; 