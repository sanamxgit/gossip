const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/models/'),
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images and videos only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|avi|wmv)$/i)) {
            return cb(new Error('Only image and video files are allowed!'), false);
        }
        cb(null, true);
    }
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise} Cloudinary upload response
 */
const uploadToCloudinary = async (filePath, folder = 'products') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: "auto" // automatically detect if it's an image or video
        });
        return {
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type
        };
    } catch (error) {
        throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} public_id - Public ID of the file to delete
 * @returns {Promise} Cloudinary deletion response
 */
const deleteFromCloudinary = async (public_id) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        return result;
    } catch (error) {
        throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
};

module.exports = {
    upload,
    uploadToCloudinary,
    deleteFromCloudinary
}; 