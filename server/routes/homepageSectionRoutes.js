const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const HomepageSection = require('../models/HomepageSection');
const { upload } = require('../middleware/uploadMiddleware');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Base upload directory - use absolute path
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');

// Helper function to find section by order or id
const findByOrderOrId = async (idOrOrder) => {
  console.log(`Attempting to find section with ID/Order: ${idOrOrder}`);
  
  // First, try to find by MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrOrder)) {
    console.log(`${idOrOrder} is a valid ObjectId, searching by _id`);
    const section = await HomepageSection.findById(idOrOrder);
    if (section) {
      console.log(`Found section by ObjectId: ${section._id}, Title: ${section.title}`);
      return section;
    } else {
      console.log(`No section found with ObjectId: ${idOrOrder}`);
    }
  } else {
    console.log(`${idOrOrder} is not a valid ObjectId`);
  }
  
  // If not found or not a valid ObjectId, try to find by order
  if (!isNaN(parseInt(idOrOrder))) {
    const orderNum = parseInt(idOrOrder);
    console.log(`Searching for section with order: ${orderNum}`);
    
    // Log all sections for debugging
    const allSections = await HomepageSection.find().sort({ order: 1 });
    console.log(`Total sections in database: ${allSections.length}`);
    allSections.forEach(s => {
      console.log(`- ID: ${s._id}, Title: ${s.title}, Order: ${s.order}`);
    });
    
    const section = await HomepageSection.findOne({ order: orderNum });
    if (section) {
      console.log(`Found section by order: ${section._id}, Title: ${section.title}, Order: ${section.order}`);
      return section;
    } else {
      console.log(`No section found with order: ${orderNum}`);
    }
  } else {
    console.log(`${idOrOrder} is not a valid number for order lookup`);
  }
  
  // Not found
  console.log(`Section not found with ID/Order: ${idOrOrder}`);
  return null;
};

// Helper function to fix image URLs in categories
const processImageUrls = (categories) => {
  try {
    if (!categories || !Array.isArray(categories)) {
      console.log('Invalid categories input:', categories);
      return [];
    }
    
    return categories.map(cat => {
      try {
        // Skip if category is invalid
        if (!cat || typeof cat !== 'object') {
          console.log('Invalid category object:', cat);
          return null;
        }
        
        // Handle blob URLs by using a placeholder image
        const imageUrl = cat.imageUrl || '';
        let fixedImageUrl = imageUrl;
        
        if (imageUrl.startsWith('blob:')) {
          fixedImageUrl = '/uploads/placeholder.svg';
          console.log('Replaced blob URL with placeholder:', imageUrl);
        } else if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
          fixedImageUrl = `/uploads/${imageUrl}`;
          console.log('Fixed relative URL:', imageUrl, '->', fixedImageUrl);
        }
        
        return {
          name: cat.name || '',
          imageUrl: fixedImageUrl,
          link: cat.link || ''
        };
      } catch (catError) {
        console.error('Error processing category:', catError);
        return null;
      }
    }).filter(Boolean); // Remove any null values
  } catch (error) {
    console.error('Error in processImageUrls:', error);
    return [];
  }
};

// Serve static files from the uploads directory
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// For direct access to section images
router.use('/sections', express.static(path.join(UPLOAD_PATH, 'sections')));

// Log and debug routes - make this visible when debugging
console.log(`Serving static files from: ${path.join(__dirname, '..', 'uploads')}`);
console.log(`Serving section images from: ${path.join(UPLOAD_PATH, 'sections')}`);

// Get all active homepage sections (public route)
router.get('/', async (req, res) => {
  try {
    const sections = await HomepageSection.find({ active: true })
      .sort({ order: 1 })
      .lean();
    res.json(sections);
  } catch (error) {
    console.error('Error fetching homepage sections:', error);
    res.status(500).json({ message: 'Server error while fetching homepage sections' });
  }
});

// Get all homepage sections (admin route)
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const sections = await HomepageSection.find()
      .sort({ order: 1 })
      .lean();
    res.json(sections);
  } catch (error) {
    console.error('Error fetching homepage sections for admin:', error);
    res.status(500).json({ message: 'Server error while fetching homepage sections' });
  }
});

// Endpoints for admin editor to get products and categories
router.get('/admin/products', protect, admin, async (req, res) => {
  try {
    // In a real app, fetch from Product model
    // For demo purposes, return mock data
    const mockProducts = Array(10).fill().map((_, index) => ({
      id: index + 1,
      name: `Product ${index + 1}`,
      price: 9999,
      image: `/placeholder.svg?height=200&width=200&text=Product${index + 1}`
    }));
    
    res.json(mockProducts);
  } catch (error) {
    console.error('Error fetching products for editor:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

router.get('/admin/categories', protect, admin, async (req, res) => {
  try {
    // In a real app, fetch from Category model
    // For demo purposes, return mock data
    const mockCategories = Array(5).fill().map((_, index) => ({
      id: index + 1,
      name: `Category ${index + 1}`,
      image: `/placeholder.svg?height=200&width=200&text=Category${index + 1}`
    }));
    
    res.json(mockCategories);
  } catch (error) {
    console.error('Error fetching categories for editor:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// Get a single homepage section by ID - moved after specific routes
router.get('/admin/:id', protect, admin, async (req, res) => {
  try {
    const section = await findByOrderOrId(req.params.id);
    
    if (!section) {
      return res.status(404).json({ message: 'Homepage section not found' });
    }
    
    res.json(section);
  } catch (error) {
    console.error('Error fetching homepage section:', error);
    res.status(500).json({ message: 'Server error while fetching homepage section' });
  }
});

// Create a new homepage section (admin only)
router.post('/admin', protect, admin, async (req, res) => {
  try {
    const { title, type, content, order, active } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required' });
    }
    
    // Create new section
    const section = new HomepageSection({
      title,
      type,
      content,
      order: order || 999, // Default to end if not specified
      active: active !== undefined ? active : true
    });
    
    const savedSection = await section.save();
    res.status(201).json(savedSection);
  } catch (error) {
    console.error('Error creating homepage section:', error);
    res.status(500).json({ message: 'Server error while creating homepage section' });
  }
});

// Update a homepage section (admin only)
router.put('/admin/:id', protect, admin, async (req, res) => {
  try {
    const { title, type, content, order, active } = req.body;
    
    console.log('=== UPDATE SECTION REQUEST ===');
    console.log(`Request ID param: ${req.params.id}`);
    console.log(`Request body: ${JSON.stringify({
      title,
      type,
      content: typeof content === 'string' ? content.substring(0, 100) + '...' : '(object)',
      order,
      active
    }, null, 2)}`);
    
    // Find section by ID or order
    const section = await findByOrderOrId(req.params.id);
    
    if (!section) {
      console.log(`Section not found with ID/Order: ${req.params.id}`);
      return res.status(404).json({ message: 'Homepage section not found' });
    }
    
    console.log('Found existing section:', {
      id: section._id,
      order: section.order,
      type: section.type,
      content: JSON.stringify(section.content, null, 2)
    });
    
    // Update fields
    if (title !== undefined) section.title = title;
    if (type !== undefined) section.type = type;
    if (content !== undefined) {
      try {
        // Parse content if it's a string
        let parsedContent;
        if (typeof content === 'string') {
          try {
            parsedContent = JSON.parse(content);
            console.log('Successfully parsed content string');
          } catch (parseError) {
            console.error('Error parsing content JSON string:', parseError);
            return res.status(400).json({ 
              message: 'Invalid JSON format in content field',
              error: parseError.message,
              receivedContent: content
            });
          }
        } else {
          parsedContent = content;
        }
        
        console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));
        
        // Handle icon-categories specifically
        if (type === 'icon-categories') {
          try {
            // Ensure parsedContent is an object
            if (!parsedContent || typeof parsedContent !== 'object') {
              throw new Error('Content must be a valid object');
            }
            
            // Handle both direct categories array and nested categories structure
            let categories = [];
            if (Array.isArray(parsedContent)) {
              categories = parsedContent;
            } else if (parsedContent.categories && Array.isArray(parsedContent.categories)) {
              categories = parsedContent.categories;
            } else {
              throw new Error('Categories must be an array');
            }
            
            // Validate and process each category item using helper function
            const validatedCategories = processImageUrls(categories);
            
            section.content = { categories: validatedCategories };
            console.log('Validated icon-categories content:', JSON.stringify(section.content, null, 2));
          } catch (catError) {
            console.error('Error processing icon-categories content:', catError);
            return res.status(400).json({ 
              message: `Invalid icon-categories format: ${catError.message}`,
              receivedContent: typeof content === 'string' ? content : JSON.stringify(content)
            });
          }
        } else if (type === 'banner' && !Array.isArray(parsedContent.slides)) {
          section.content = {
            slides: [{
              imageUrl: parsedContent.image || '',
              title: parsedContent.title || '',
              subtitle: parsedContent.subtitle || '',
              buttonText: parsedContent.buttonText || '',
              buttonLink: parsedContent.buttonLink || ''
            }]
          };
        } else {
          section.content = parsedContent;
        }
        
        console.log('Final processed content:', JSON.stringify(section.content, null, 2));
      } catch (error) {
        console.error('Error processing content:', error);
        return res.status(400).json({ 
          message: 'Invalid content format',
          error: error.message,
          receivedContent: typeof content === 'string' ? content : JSON.stringify(content)
        });
      }
    }
    if (order !== undefined) section.order = order;
    if (active !== undefined) section.active = active;
    
    console.log('Saving section with content:', JSON.stringify(section.content, null, 2));
    
    try {
      const updatedSection = await section.save();
      console.log('Section updated successfully:', {
        id: updatedSection._id,
        type: updatedSection.type,
        content: JSON.stringify(updatedSection.content, null, 2)
      });
      
      res.json(updatedSection);
    } catch (saveError) {
      console.error('Error saving section:', saveError);
      return res.status(500).json({
        message: 'Error saving section to database',
        error: saveError.message,
        validationErrors: saveError.errors
      });
    }
  } catch (error) {
    console.error('Error updating homepage section:', error);
    res.status(500).json({ 
      message: 'Server error while updating homepage section',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete a homepage section (admin only)
router.delete('/admin/:id', protect, admin, async (req, res) => {
  try {
    const section = await findByOrderOrId(req.params.id);
    
    if (!section) {
      return res.status(404).json({ message: 'Homepage section not found' });
    }
    
    await HomepageSection.deleteOne({ _id: section._id });
    
    res.json({ message: 'Homepage section deleted successfully' });
  } catch (error) {
    console.error('Error deleting homepage section:', error);
    res.status(500).json({ message: 'Server error while deleting homepage section' });
  }
});

// Reorder homepage sections (admin only)
router.put('/admin/reorder', protect, admin, async (req, res) => {
  try {
    const { sectionIds } = req.body;
    
    if (!sectionIds || !Array.isArray(sectionIds)) {
      return res.status(400).json({ message: 'Section IDs array is required' });
    }
    
    // Find all the sections first
    const updatePromises = [];
    
    for (let i = 0; i < sectionIds.length; i++) {
      const id = sectionIds[i];
      const section = await findByOrderOrId(id);
      
      if (section) {
        // Update the order
        section.order = i + 1;
        updatePromises.push(section.save());
      } else {
        console.warn(`Section with ID ${id} not found during reordering`);
      }
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    // Fetch and return the updated sections
    const sections = await HomepageSection.find()
      .sort({ order: 1 })
      .lean();
    
    res.json(sections);
  } catch (error) {
    console.error('Error reordering homepage sections:', error);
    res.status(500).json({ message: 'Server error while reordering homepage sections' });
  }
});

// Upload section image
router.post('/upload-image', protect, admin, upload.single('sectionImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File upload request received:', {
      file: req.file.originalname,
      fieldname: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      body: req.body
    });

    // Get section type from request
    const sectionType = req.body.sectionType || 'icon-categories';
    
    // Normalize section type to folder name
    let folderName;
    switch(sectionType) {
      case 'banner':
        folderName = 'banner';
        break;
      case 'categories':
        folderName = 'categories';
        break;
      case 'icon-categories':
      case 'icons':
        folderName = 'icons';
        break;
      default:
        folderName = 'misc';
    }

    // Get the target directory path
    const targetDir = path.join(UPLOAD_PATH, 'sections', folderName);
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`Created directory: ${targetDir}`);
      } catch (mkdirError) {
        console.error('Error creating directory:', mkdirError);
        
        // Try with different permissions
        try {
          fs.mkdirSync(targetDir, { recursive: true, mode: 0o777 });
          console.log(`Created directory with full permissions: ${targetDir}`);
        } catch (retryError) {
          console.error('Error creating directory with full permissions:', retryError);
          return res.status(500).json({
            message: 'Unable to create upload directory',
            error: retryError.message
          });
        }
      }
    }
    
    // Generate a unique filename to prevent conflicts
    const fileExt = path.extname(req.file.originalname);
    const timestamp = Date.now();
    const safeFilename = req.file.originalname
      .replace(fileExt, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const uniqueFilename = `${safeFilename}-${timestamp}${fileExt}`;
    
    // Move the file to the appropriate directory
    const sourcePath = req.file.path;
    const targetPath = path.join(targetDir, uniqueFilename);
    
    // If the file isn't already in the right place, move it
    if (sourcePath !== targetPath) {
      try {
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved file from ${sourcePath} to ${targetPath}`);
      } catch (moveError) {
        console.error('Error moving file:', moveError);
        // Fallback: copy the file instead of moving it
        try {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied file from ${sourcePath} to ${targetPath}`);
          // Optionally try to delete the source file
          try {
            fs.unlinkSync(sourcePath);
          } catch (unlinkError) {
            console.error('Could not delete source file after copy:', unlinkError);
          }
        } catch (copyError) {
          console.error('Error copying file:', copyError);
          return res.status(500).json({ 
            message: 'Error saving uploaded file',
            error: copyError.message
          });
        }
      }
    }
    
    // Verify the file was successfully moved/copied
    if (!fs.existsSync(targetPath)) {
      return res.status(500).json({
        message: 'File not found after upload - possible permission issue',
        targetPath
      });
    }
    
    // Return the URL - use multiple formats to ensure compatibility
    const apiUrl = process.env.API_URL || '';
    
    // Create both absolute and relative URLs
    const relativePath = `/uploads/sections/${folderName}/${uniqueFilename}`;
    const alternativePath = `/sections/${folderName}/${uniqueFilename}`;
    const absolutePath = `${apiUrl}${relativePath}`;
    
    console.log('File URLs generated:');
    console.log(`- Relative path: ${relativePath}`);
    console.log(`- Alternative path: ${alternativePath}`);
    console.log(`- Absolute path: ${absolutePath}`);
    
    console.log('File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: uniqueFilename,
      path: targetPath
    });
    
    // Return both URLs to client so it can try both
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: relativePath,
      alternativeUrl: alternativePath,
      absoluteUrl: apiUrl ? absolutePath : null,
      fileName: uniqueFilename,
      fileSize: req.file.size,
      fullPath: targetPath
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({
      message: 'Error handling file upload',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Public route to check section IDs (for debugging)
router.get('/check-ids', async (req, res) => {
  try {
    const sections = await HomepageSection.find().sort({ order: 1 });
    
    const result = sections.map(section => ({
      _id: section._id.toString(),
      title: section.title,
      order: section.order,
      type: section.type
    }));
    
    res.json({
      message: 'Homepage sections',
      count: result.length,
      sections: result
    });
  } catch (error) {
    console.error('Error checking section IDs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 