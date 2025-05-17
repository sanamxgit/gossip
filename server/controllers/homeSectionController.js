const HomeSection = require('../models/HomeSection');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// @desc    Create a new home section
// @route   POST /api/home-sections
// @access  Private/Admin
const createHomeSection = asyncHandler(async (req, res) => {
  const { title, type, description, position, active, layout, categoryId, products, backgroundImage, backgroundColor, textColor, buttonText, buttonLink } = req.body;

  const homeSection = await HomeSection.create({
    title,
    type,
    description,
    position,
    active,
    layout,
    categoryId,
    products,
    backgroundImage,
    backgroundColor,
    textColor,
    buttonText,
    buttonLink
  });

  res.status(201).json(homeSection);
});

// @desc    Update a home section
// @route   PUT /api/home-sections/:id
// @access  Private/Admin
const updateHomeSection = asyncHandler(async (req, res) => {
  const homeSection = await HomeSection.findById(req.params.id);

  if (!homeSection) {
    res.status(404);
    throw new Error('Home section not found');
  }

  // Dynamically update fields that are sent
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      homeSection[key] = req.body[key];
    }
  });

  // Save the updated section
  const updatedHomeSection = await homeSection.save();
  res.json(updatedHomeSection);
});

// @desc    Delete a home section
// @route   DELETE /api/home-sections/:id
// @access  Private/Admin
const deleteHomeSection = asyncHandler(async (req, res) => {
  const homeSection = await HomeSection.findById(req.params.id);

  if (!homeSection) {
    res.status(404);
    throw new Error('Home section not found');
  }

  await homeSection.remove();
  res.json({ message: 'Home section removed' });
});

// @desc    Get all home sections
// @route   GET /api/home-sections
// @access  Public
const getHomeSections = asyncHandler(async (req, res) => {
  const homeSections = await HomeSection.find({ active: true })
    .sort({ position: 1 })
    .populate({
      path: 'products',
      select: 'title price originalPrice images sold rating isFeatured colors',
      populate: {
        path: 'category',
        select: 'name image'
      }
    });

  // For sections that are dynamic (e.g., featured, new-arrivals), fetch the products
  const processedSections = await Promise.all(
    homeSections.map(async (section) => {
      const sectionObj = section.toObject();
      
      // If it's a dynamic section and no products are explicitly assigned
      if ((section.type === 'featured' || section.type === 'new-arrivals' || section.type === 'best-sellers') && (!section.products || section.products.length === 0)) {
        let query = {};
        let sort = {};
        
        if (section.type === 'featured') {
          query = { isFeatured: true };
          sort = { updatedAt: -1 };
        } else if (section.type === 'new-arrivals') {
          sort = { createdAt: -1 };
        } else if (section.type === 'best-sellers') {
          sort = { sold: -1 };
        }
        
        const products = await Product.find(query)
          .sort(sort)
          .limit(8)
          .select('title price originalPrice images sold rating isFeatured colors')
          .populate({
            path: 'category',
            select: 'name image'
          });
        
        sectionObj.products = products;
      }
      
      return sectionObj;
    })
  );

  res.json(processedSections);
});

// @desc    Get a single home section
// @route   GET /api/home-sections/:id
// @access  Public
const getHomeSectionById = asyncHandler(async (req, res) => {
  const homeSection = await HomeSection.findById(req.params.id)
    .populate({
      path: 'products',
      select: 'title price originalPrice images sold rating isFeatured colors',
      populate: {
        path: 'category',
        select: 'name image'
      }
    });

  if (!homeSection) {
    res.status(404);
    throw new Error('Home section not found');
  }

  res.json(homeSection);
});

// @desc    Reorder home sections
// @route   PUT /api/home-sections/reorder
// @access  Private/Admin
const reorderHomeSections = asyncHandler(async (req, res) => {
  const { sectionOrder } = req.body;

  if (!sectionOrder || !Array.isArray(sectionOrder)) {
    res.status(400);
    throw new Error('Section order must be provided as an array');
  }

  // Update each section's position
  const updateOperations = sectionOrder.map((item, index) => {
    return {
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { position: index } }
      }
    };
  });

  await HomeSection.bulkWrite(updateOperations);

  // Get the updated sections
  const updatedSections = await HomeSection.find({})
    .sort({ position: 1 });

  res.json(updatedSections);
});

module.exports = {
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  getHomeSections,
  getHomeSectionById,
  reorderHomeSections
}; 