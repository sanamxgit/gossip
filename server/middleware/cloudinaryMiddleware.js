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
        // Accept images and documents
        if (file.mimetype.startsWith('image/') || 
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only image and document files are allowed!'), false);
        }
    }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file, folder = 'products') => {
    try {
        let uploadResult;
        
        if (file.buffer) {
            // Handle buffer upload (from memory storage)
            const fileStr = file.buffer.toString('base64');
            uploadResult = await cloudinary.uploader.upload(
                `data:${file.mimetype};base64,${fileStr}`,
                {
                    folder: folder,
                    resource_type: 'auto'
                }
            );
        } else if (file.path) {
            // Handle path-based upload (from disk storage)
            uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: folder,
                resource_type: 'auto'
            });
        } else {
            throw new Error('Invalid file format: neither buffer nor path provided');
        }

        return {
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            resource_type: uploadResult.resource_type
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
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