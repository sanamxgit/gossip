const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const modelStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname.split('.')[0]}`;
    const platform = req.body.platform || 'default';
    const folderPath = `ar_models/${platform}`;

    console.log('Cloudinary upload configuration:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      ext: ext,
      platform: platform,
      folderPath: folderPath,
      public_id: `${folderPath}/${uniqueFilename}`
    });

    return {
      folder: folderPath,
      resource_type: 'raw', // Explicitly set to 'raw' for 3D models
      format: ext,
      public_id: `${folderPath}/${uniqueFilename}`,
      use_filename: false,
      unique_filename: true,
      overwrite: true,
      access_mode: 'public',
      secure: true
    };
  }
});

const modelUpload = multer({
  storage: modelStorage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.glb', '.gltf', '.usdz', '.reality'];
    const ext = `.${file.originalname.split('.').pop().toLowerCase()}`;
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
}).single('file');

module.exports = modelUpload;