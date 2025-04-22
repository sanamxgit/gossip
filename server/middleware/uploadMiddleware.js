const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Base upload directory
const UPLOAD_PATH = process.env.UPLOAD_PATH || '../uploads/';
createDir(path.resolve(UPLOAD_PATH));

// Create subdirectories
const dirs = ['products', 'categories', 'brands', 'stores', 'documents', 'avatars', 'misc'];
dirs.forEach(dir => createDir(path.resolve(UPLOAD_PATH, dir)));

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = UPLOAD_PATH;
    
    // Determine folder based on file type
    if (file.fieldname === 'images' || file.fieldname === 'productImages') {
      uploadPath = path.join(uploadPath, 'products');
    } else if (file.fieldname === 'image' || file.fieldname === 'categoryImage') {
      uploadPath = path.join(uploadPath, 'categories');
    } else if (file.fieldname === 'logo' || file.fieldname === 'brandLogo') {
      uploadPath = path.join(uploadPath, 'brands');
    } else if (file.fieldname === 'storeLogo') {
      uploadPath = path.join(uploadPath, 'stores');
    } else if (file.fieldname === 'documents') {
      uploadPath = path.join(uploadPath, 'documents');
    } else if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadPath, 'avatars');
    } else {
      uploadPath = path.join(uploadPath, 'misc');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|gif|pdf|doc|docx/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images, PDFs, and Office documents are allowed!'), false);
  }
};

// Create the multer instance with default options
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB default file size limit
});

module.exports = upload; 