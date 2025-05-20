const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Configure multer for temporary storage
const storage = multer.memoryStorage();

// Create multer instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file, folder = 'products') => {
    try {
        // Convert buffer to base64
        const fileStr = file.buffer.toString('base64');
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${fileStr}`,
            {
                folder: folder,
                resource_type: fileType,
            }
        );

        return {
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type
        };
    } catch (error) {
        throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
    }
};

// Helper function to delete from Cloudinary
const deleteFromCloudinary = async (public_id, resource_type = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: resource_type
        });
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