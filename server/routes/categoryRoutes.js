const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../middleware/cloudinaryMiddleware');
const cloudinary = require('cloudinary');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({}).populate('parent');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/categories/tree
// @desc    Get category tree
// @access  Public
router.get('/tree', async (req, res) => {
  try {
    const categories = await Category.find({ parent: null })
      .populate({
        path: 'children',
        populate: { path: 'children' }
      })
      .sort('order');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/categories/trending
// @desc    Get trending categories
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const trendingCategories = await Category.find({ isTrending: true })
      .populate('parent')
      .sort('-productCount');
    res.json({ categories: trendingCategories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/categories
// @desc    Create a category
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    
    // Check if category with same name exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    let image = {};
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, {
          folder: 'categories',
          transformation: [
            { width: 800, height: 800, crop: 'fill' },
            { quality: 'auto:best' }
          ]
        });
        image = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(400).json({ message: 'Error uploading image' });
      }
    }

    const category = new Category({
      name,
      description,
      parent: parent || null,
      image,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, parent, isTrending } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (category.image && category.image.public_id) {
          await cloudinary.uploader.destroy(category.image.public_id);
        }

        const result = await uploadToCloudinary(req.file.path, {
          folder: 'categories',
          transformation: [
            { width: 800, height: 800, crop: 'fill' },
            { quality: 'auto:best' }
          ]
        });
        
        category.image = {
          url: result.secure_url,
          public_id: result.public_id
        };
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(400).json({ message: 'Error uploading image' });
      }
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.parent = parent || category.parent;
    category.isTrending = isTrending !== undefined ? isTrending : category.isTrending;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete image from Cloudinary if exists
    if (category.image && category.image.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/categories/admin/all
// @desc    Get all categories (including inactive)
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const categories = await Category.find().sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/categories/:id/attributes
// @desc    Get category attributes
// @access  Public
router.get('/:id/attributes', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get attributes from all ancestor categories
    const ancestors = await Category.find({ _id: { $in: category.ancestors } });
    const allAttributes = [
      ...ancestors.reduce((acc, cat) => [...acc, ...cat.attributes], []),
      ...category.attributes
    ];

    res.json(allAttributes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 