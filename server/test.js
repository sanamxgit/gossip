const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.send('Test API is running');
});

// In-memory storage for sections
let sections = [
  {
    _id: "4",
    title: "Categories",
    type: "icon-categories",
    content: {
      categories: [
        {
          name: "Mobile & Devices",
          imageUrl: "/uploads/placeholder.svg",
          link: "/category/mobile-devices"
        },
        {
          name: "Watch",
          imageUrl: "/uploads/placeholder.svg",
          link: "/category/watch"
        }
      ]
    },
    order: 4,
    active: true
  }
];

// Helper function to fix image URLs in categories
const processImageUrls = (categories) => {
  if (!categories || !Array.isArray(categories)) return [];
  
  return categories.map(cat => {
    // Skip if category is invalid
    if (!cat || typeof cat !== 'object') return null;
    
    // Handle blob URLs by using a placeholder image
    const imageUrl = cat.imageUrl || '';
    const fixedImageUrl = imageUrl.startsWith('blob:') 
      ? '/uploads/placeholder.svg' 
      : imageUrl;
    
    return {
      name: cat.name || '',
      imageUrl: fixedImageUrl,
      link: cat.link || ''
    };
  }).filter(Boolean); // Remove any null values
};

// Update section route
app.put('/api/homepage/sections/admin/:id', (req, res) => {
  try {
    console.log('Received update request for section ID:', req.params.id);
    console.log('Request headers:', req.headers);
    console.log('Request body (truncated):', {
      ...req.body,
      content: typeof req.body.content === 'string' 
        ? req.body.content.substring(0, 100) + '...' 
        : JSON.stringify(req.body.content).substring(0, 100) + '...'
    });
    
    const { title, type, content, order, active } = req.body;
    
    // Find section by ID
    const sectionIndex = sections.findIndex(s => s._id === req.params.id);
    if (sectionIndex === -1) {
      console.log('Section not found:', req.params.id);
      return res.status(404).json({ message: 'Section not found' });
    }
    
    const section = { ...sections[sectionIndex] };
    
    // Update fields
    if (title !== undefined) section.title = title;
    if (type !== undefined) section.type = type;
    
    if (content !== undefined) {
      try {
        // Parse content if it's a string
        let parsedContent;
        if (typeof content === 'string') {
          try {
            console.log('Parsing content string...');
            parsedContent = JSON.parse(content);
            console.log('Successfully parsed content string');
          } catch (parseError) {
            console.error('Error parsing content JSON string:', parseError);
            return res.status(400).json({ 
              message: 'Invalid JSON format in content field',
              error: parseError.message,
              receivedContent: content.substring(0, 100) + '...'
            });
          }
        } else {
          console.log('Content is already an object');
          parsedContent = content;
        }
        
        console.log('Content type:', typeof parsedContent);
        
        // Handle different section types
        if (type === 'icon-categories') {
          try {
            console.log('Processing icon-categories content');
            
            // Ensure content is an object
            if (!parsedContent || typeof parsedContent !== 'object') {
              throw new Error('Content must be a valid object');
            }
            
            // Extract categories array
            let categories = [];
            if (Array.isArray(parsedContent)) {
              categories = parsedContent;
            } else if (parsedContent.categories && Array.isArray(parsedContent.categories)) {
              categories = parsedContent.categories;
            } else {
              throw new Error('Categories must be an array');
            }
            
            console.log('Found categories array with', categories.length, 'items');
            
            // Process image URLs
            const processedCategories = processImageUrls(categories);
            
            // Set processed content
            section.content = { categories: processedCategories };
            
            console.log('Processed and validated content');
          } catch (catError) {
            console.error('Error processing icon-categories content:', catError);
            return res.status(400).json({ 
              message: `Invalid icon-categories format: ${catError.message}`,
              error: catError.stack
            });
          }
        } else {
          // For other section types
          section.content = parsedContent;
        }
      } catch (error) {
        console.error('Error processing content:', error);
        return res.status(400).json({ 
          message: 'Error processing content',
          error: error.stack
        });
      }
    }
    
    if (order !== undefined) section.order = order;
    if (active !== undefined) section.active = active;
    
    // Update section in array
    sections[sectionIndex] = section;
    
    console.log('Section updated successfully');
    res.json(section);
  } catch (error) {
    console.error('Unhandled error in update route:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get all sections
app.get('/api/homepage/sections/admin', (req, res) => {
  res.json(sections);
});

// Get a section by ID
app.get('/api/homepage/sections/admin/:id', (req, res) => {
  const section = sections.find(s => s._id === req.params.id);
  if (!section) {
    return res.status(404).json({ message: 'Section not found' });
  }
  res.json(section);
});

// Start server
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test API running on port ${PORT}`);
}); 