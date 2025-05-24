const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../middleware/cloudinaryMiddleware');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    res.json(categories);
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

// @route   POST /api/categories
// @desc    Create a category
// @access  Private/Admin
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, parent } = req.body;
    
    let image = {};
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      image = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    const category = new Category({
      name,
      description,
      parent: parent || null,
      image
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
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
    const { name, description, parent, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.path);
      category.image = {
        url: result.secure_url,
        public_id: result.public_id
      };
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.parent = parent || category.parent;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

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

    // Instead of deleting, mark as inactive
    category.isActive = false;
    await category.save();

    res.json({ message: 'Category deactivated successfully' });
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