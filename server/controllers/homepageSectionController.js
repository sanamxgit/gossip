const HomePageSection = require('../models/HomePageSection');
const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

// @desc    Get all homepage sections
// @route   GET /api/homepage/sections
// @access  Public
const getHomePageSections = asyncHandler(async (req, res) => {
  const sections = await HomePageSection.find({})
    .sort({ order: 1 });
  
  res.json(sections);
});

// @desc    Get a single homepage section
// @route   GET /api/homepage/sections/:id
// @access  Private/Admin
const getHomePageSectionById = asyncHandler(async (req, res) => {
  const section = await HomePageSection.findById(req.params.id);
  
  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }
  
  res.json(section);
});

// @desc    Create a new homepage section
// @route   POST /api/homepage/sections
// @access  Private/Admin
const createHomePageSection = asyncHandler(async (req, res) => {
  const { title, type, content, order, active } = req.body;
  
  // Process content based on type
  let processedContent = content;
  
  if (type === 'banner') {
    // Ensure slides is an array
    if (!Array.isArray(content.slides)) {
      processedContent = { 
        slides: [{ 
          imageUrl: content.image || '',
          title: content.title || '',
          subtitle: content.subtitle || '',
          buttonText: content.buttonText || '',
          buttonLink: content.buttonLink || '' 
        }]
      };
    }
  }
  
  // Find the highest order to place new section at the end if order not specified
  let sectionOrder = order;
  if (!sectionOrder) {
    const highestSection = await HomePageSection.findOne().sort('-order');
    sectionOrder = highestSection ? highestSection.order + 1 : 1;
  }
  
  const section = await HomePageSection.create({
    title,
    type,
    content: processedContent,
    order: sectionOrder,
    active: active !== undefined ? active : true,
  });
  
  res.status(201).json(section);
});

// @desc    Update a homepage section
// @route   PUT /api/homepage/sections/:id
// @access  Private/Admin
const updateHomePageSection = asyncHandler(async (req, res) => {
  const { title, type, content, order, active } = req.body;
  
  const section = await HomePageSection.findById(req.params.id);
  
  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }
  
  // Process content based on type
  let processedContent = content;
  
  if (type === 'banner' && !Array.isArray(content.slides)) {
    processedContent = { 
      slides: [{ 
        imageUrl: content.image || '',
        title: content.title || '',
        subtitle: content.subtitle || '',
        buttonText: content.buttonText || '',
        buttonLink: content.buttonLink || '' 
      }]
    };
  }
  
  section.title = title || section.title;
  section.type = type || section.type;
  section.content = processedContent || section.content;
  section.order = order !== undefined ? order : section.order;
  section.active = active !== undefined ? active : section.active;
  
  const updatedSection = await section.save();
  
  res.json(updatedSection);
});

// @desc    Delete a homepage section
// @route   DELETE /api/homepage/sections/:id
// @access  Private/Admin
const deleteHomePageSection = asyncHandler(async (req, res) => {
  const section = await HomePageSection.findById(req.params.id);
  
  if (!section) {
    res.status(404);
    throw new Error('Section not found');
  }
  
  await section.remove();
  
  res.json({ message: 'Section removed' });
});

// @desc    Reorder homepage sections
// @route   PUT /api/homepage/sections/reorder
// @access  Private/Admin
const reorderHomePageSections = asyncHandler(async (req, res) => {
  const { sectionIds } = req.body;
  
  if (!Array.isArray(sectionIds)) {
    res.status(400);
    throw new Error('sectionIds must be an array');
  }
  
  // Update order for each section
  const updatePromises = sectionIds.map((id, index) => {
    return HomePageSection.findByIdAndUpdate(id, { order: index + 1 });
  });
  
  await Promise.all(updatePromises);
  
  // Get updated sections
  const updatedSections = await HomePageSection.find({
    _id: { $in: sectionIds },
  }).sort({ order: 1 });
  
  res.json(updatedSections);
});

// @desc    Get all products for the homepage editor
// @route   GET /api/homepage/products
// @access  Private/Admin
const getProductsForHomepage = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .select('_id name price images')
    .sort('-createdAt')
    .limit(50);
  
  res.json(products);
});

// @desc    Get all categories for the homepage editor
// @route   GET /api/homepage/categories
// @access  Private/Admin
const getCategoriesForHomepage = asyncHandler(async (req, res) => {
  const categories = await Category.find({})
    .select('_id name image slug')
    .sort('name');
  
  res.json(categories);
});

module.exports = {
  getHomePageSections,
  getHomePageSectionById,
  createHomePageSection,
  updateHomePageSection,
  deleteHomePageSection,
  reorderHomePageSections,
  getProductsForHomepage,
  getCategoriesForHomepage,
}; 