const express = require('express');
const router = express.Router();
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/uploadHandler');
const fs = require('fs').promises;

// Upload single file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.path);
        
        // Delete the file from local storage
        await fs.unlink(req.file.path);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadPromises = req.files.map(async (file) => {
            const result = await uploadToCloudinary(file.path);
            await fs.unlink(file.path);
            return result;
        });

        const results = await Promise.all(uploadPromises);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload 3D model
router.post('/model', upload.single('model'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const platform = req.body.platform;
        if (!platform || !['ios', 'android'].includes(platform)) {
            return res.status(400).json({ error: 'Invalid platform specified' });
        }

        // Upload to Cloudinary with specific settings for 3D models
        const result = await uploadToCloudinary(req.file.path, {
            resource_type: 'raw',
            folder: `models/${platform}`,
            use_filename: true,
            unique_filename: true
        });
        
        // Delete the file from local storage
        await fs.unlink(req.file.path);

        // For iOS (USDZ), return direct URL
        // For Android (GLB), return Scene Viewer URL
        const url = platform === 'ios' 
            ? result.secure_url
            : `https://arvr.google.com/scene-viewer/1.0?file=${result.secure_url}&mode=ar_preferred`;

        res.json({
            url,
            public_id: result.public_id,
            resource_type: result.resource_type
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete file from Cloudinary
router.delete('/delete/:public_id', async (req, res) => {
    try {
        const result = await deleteFromCloudinary(req.params.public_id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 