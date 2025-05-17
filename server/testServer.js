const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const sectionsDir = path.join(uploadsDir, 'sections');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(sectionsDir)) {
  fs.mkdirSync(sectionsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test routes
app.get('/', (req, res) => {
  res.send('Test server is running');
});

// Mock HomepageSection data
const homepageSections = [
  {
    _id: "1",
    title: "Main Banner",
    type: "banner",
    content: {
      slides: [
        {
          imageUrl: "/uploads/placeholder.jpg",
          title: "Welcome to Our Store",
          subtitle: "Find amazing deals",
          buttonText: "Shop Now",
          buttonLink: "/products"
        }
      ]
    },
    order: 1,
    active: true
  },
  {
    _id: "2",
    title: "Featured Products",
    type: "products",
    content: {
      productIds: [1, 2, 3, 4]
    },
    order: 2,
    active: true
  },
  {
    _id: "3",
    title: "Categories",
    type: "categories",
    content: {
      categories: [
        {
          name: "Electronics",
          image: "/uploads/placeholder.jpg",
          description: "Latest gadgets"
        }
      ]
    },
    order: 3,
    active: true
  },
  {
    _id: "4",
    title: "Catgories",
    type: "icon-categories",
    content: {
      categories: [
        {
          name: "Mobile & Devices",
          imageUrl: "/uploads/placeholder.jpg",
          link: "/category/mobile"
        }
      ]
    },
    order: 4,
    active: true
  }
];

// Homepage Section API routes
app.get('/api/homepage/sections', (req, res) => {
  const activeSections = homepageSections.filter(section => section.active);
  res.json(activeSections);
});

app.get('/api/homepage/sections/admin', (req, res) => {
  res.json(homepageSections);
});

app.get('/api/homepage/sections/admin/:id', (req, res) => {
  const section = homepageSections.find(s => s._id === req.params.id);
  if (!section) {
    return res.status(404).json({ message: 'Section not found' });
  }
  res.json(section);
});

app.post('/api/homepage/sections/admin', (req, res) => {
  const { title, type, content, order, active } = req.body;
  const newSection = {
    _id: Date.now().toString(),
    title,
    type,
    content: typeof content === 'string' ? JSON.parse(content) : content,
    order: order || 999,
    active: active !== undefined ? active : true
  };
  homepageSections.push(newSection);
  res.status(201).json(newSection);
});

app.put('/api/homepage/sections/admin/:id', (req, res) => {
  try {
    const { title, type, content, order, active } = req.body;
    
    // Log the incoming data for debugging
    console.log('Received PUT request for section:', {
      id: req.params.id,
      data: {
        title,
        type,
        content: typeof content === 'string' ? content.substring(0, 100) + '...' : JSON.stringify(content, null, 2),
        order,
        active
      }
    });
    
    const sectionIndex = homepageSections.findIndex(s => s._id === req.params.id);
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    const section = homepageSections[sectionIndex];
    
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
            console.log('Successfully parsed content JSON string');
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
            
            // Validate each category item
            const validatedCategories = categories.map(cat => {
              if (!cat || typeof cat !== 'object') {
                throw new Error('Each category must be an object');
              }
              
              return {
                name: cat.name || '',
                imageUrl: cat.imageUrl || '',
                link: cat.link || ''
              };
            });
            
            section.content = { categories: validatedCategories };
          } catch (catError) {
            console.error('Error processing icon-categories content:', catError);
            return res.status(400).json({
              message: `Invalid icon-categories format: ${catError.message}`,
              receivedContent: typeof content === 'string' ? content : JSON.stringify(content)
            });
          }
        } else {
          section.content = parsedContent;
        }
      } catch (error) {
        console.error('Error processing section content:', error);
        return res.status(400).json({
          message: 'Invalid content format',
          error: error.message
        });
      }
    }
    if (order !== undefined) section.order = order;
    if (active !== undefined) section.active = active;
    
    homepageSections[sectionIndex] = section;
    res.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({
      message: 'Server error while updating section',
      error: error.message
    });
  }
});

app.delete('/api/homepage/sections/admin/:id', (req, res) => {
  const sectionIndex = homepageSections.findIndex(s => s._id === req.params.id);
  if (sectionIndex === -1) {
    return res.status(404).json({ message: 'Section not found' });
  }
  
  homepageSections.splice(sectionIndex, 1);
  res.json({ message: 'Section deleted successfully' });
});

app.post('/api/homepage/sections/upload-image', (req, res) => {
  // In a test server, just return a success response
  res.json({
    message: 'File uploaded successfully',
    fileUrl: '/uploads/placeholder.jpg'
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Hardcoded credentials check
  if (email === 'sanam@gmail.com' && password === 'Sanam@123') {
    res.json({
      _id: '123456789',
      username: 'Sanam',
      email: email,
      role: 'seller',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OSIsImVtYWlsIjoic2FuYW1AZ21haWwuY29tIiwicm9sZSI6InNlbGxlciIsImlhdCI6MTY0MzI5MjQ4MCwiZXhwIjoxNjQ1ODg0NDgwfQ.sample-token'
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Start server
const PORT = 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
}); 