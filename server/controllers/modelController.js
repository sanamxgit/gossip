const { Octokit } = require('@octokit/rest');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

// Configure GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// GitHub repository details
const GITHUB_OWNER = 'sanamxgit';
const GITHUB_REPO = 'models';
const GITHUB_BRANCH = 'main'; // or 'master' depending on your repository

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/models');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Define file filter for 3D models
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    '.usdz', '.glb', '.gltf',
    'model/vnd.usdz+zip', 
    'model/gltf-binary', 
    'model/gltf+json',
    'application/octet-stream'
  ];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Check if the file type is in allowed types
  if (allowedTypes.some(type => 
    fileExt.includes(type) || 
    file.mimetype.includes(type))
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only USDZ, GLB and GLTF files are allowed.'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).single('model');

// @desc    Upload 3D model to GitHub
// @route   POST /api/models/upload-to-github
// @access  Private/Seller
const uploadModelToGitHub = asyncHandler(async (req, res) => {
  // Handle file upload
  upload(req, res, async (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      res.status(400);
      throw new Error(err.message);
    }
    
    // Check if file exists
    if (!req.file) {
      res.status(400);
      throw new Error('No file uploaded');
    }
    
    try {
      const file = req.file;
      const modelType = req.body.type || 'usdz'; // Default to usdz
      
      // Read file content
      const content = fs.readFileSync(file.path);
      const contentEncoded = content.toString('base64');
      
      // Generate file path in GitHub repository
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(4).toString('hex');
      const safeUserId = req.user._id ? req.user._id.toString() : 'unknown';
      const fileName = `${safeUserId}_${timestamp}_${randomString}${path.extname(file.originalname)}`;
      const filePath = `${modelType}/${fileName}`;
      
      // Check if the model type directory exists, create it if not
      try {
        // Try to get the content of the directory
        await octokit.repos.getContent({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          path: modelType,
          ref: GITHUB_BRANCH
        });
      } catch (dirError) {
        if (dirError.status === 404) {
          // Directory doesn't exist, create it with a README file
          console.log(`Creating directory ${modelType} in GitHub repository`);
          await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: `${modelType}/README.md`,
            message: `Create ${modelType} directory`,
            content: Buffer.from(`# ${modelType.toUpperCase()} Models\nThis directory contains ${modelType.toUpperCase()} 3D models for AR experiences.`).toString('base64'),
            branch: GITHUB_BRANCH
          });
        } else {
          throw dirError; // Re-throw if it's not a 404 error
        }
      }
      
      // Upload file to GitHub
      const response = await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: filePath,
        message: `Upload ${modelType} model via API`,
        content: contentEncoded,
        branch: GITHUB_BRANCH
      });
      
      // Clean up temporary file
      fs.unlinkSync(file.path);
      
      // Generate raw URL for the uploaded file
      const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
      
      res.status(201).json({
        success: true,
        url: rawUrl,
        sha: response.data.content.sha,
        type: modelType
      });
    } catch (error) {
      console.error('GitHub upload error:', error);
      res.status(500);
      throw new Error(`Failed to upload to GitHub: ${error.message}`);
    }
  });
});

// @desc    Get models from GitHub repository
// @route   GET /api/models/github-models
// @access  Private/Seller
const getModelsFromGitHub = asyncHandler(async (req, res) => {
  try {
    // Get repository contents
    const response = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: '',
      ref: GITHUB_BRANCH
    });
    
    // Filter folders for model types
    const modelFolders = response.data.filter(item => item.type === 'dir');
    
    // Get models from each folder
    const models = {};
    
    for (const folder of modelFolders) {
      const folderContents = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: folder.path,
        ref: GITHUB_BRANCH
      });
      
      models[folder.name] = folderContents.data.map(file => ({
        name: file.name,
        url: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${folder.name}/${file.name}`,
        sha: file.sha,
        size: file.size,
        type: folder.name
      }));
    }
    
    res.json(models);
  } catch (error) {
    console.error('GitHub API error:', error);
    res.status(500);
    throw new Error(`Failed to fetch models from GitHub: ${error.message}`);
  }
});

module.exports = {
  uploadModelToGitHub,
  getModelsFromGitHub
}; 