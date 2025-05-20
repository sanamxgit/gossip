const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('parent')
      .populate('children')
      .sort('order');
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
router.post('/', protect, admin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, parent, attributes, order } = req.body;

    // Upload images to Cloudinary if provided
    let image = null;
    let icon = null;

    if (req.files.image) {
      const imageResult = await uploadToCloudinary(req.files.image[0].path);
      image = {
        url: imageResult.secure_url,
        public_id: imageResult.public_id
      };
    }

    if (req.files.icon) {
      const iconResult = await uploadToCloudinary(req.files.icon[0].path);
      icon = {
        url: iconResult.secure_url,
        public_id: iconResult.public_id
      };
    }

    const category = new Category({
      name,
      description,
      parent: parent || null,
      attributes: attributes ? JSON.parse(attributes) : [],
      order: order || 0,
      image,
      icon
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private/Admin
router.put('/:id', protect, admin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, description, parent, attributes, order } = req.body;

    // Handle image uploads
    if (req.files.image) {
      // Delete old image from Cloudinary if exists
      if (category.image?.public_id) {
        await deleteFromCloudinary(category.image.public_id);
      }
      const imageResult = await uploadToCloudinary(req.files.image[0].path);
      category.image = {
        url: imageResult.secure_url,
        public_id: imageResult.public_id
      };
    }

    if (req.files.icon) {
      // Delete old icon from Cloudinary if exists
      if (category.icon?.public_id) {
        await deleteFromCloudinary(category.icon.public_id);
      }
      const iconResult = await uploadToCloudinary(req.files.icon[0].path);
      category.icon = {
        url: iconResult.secure_url,
        public_id: iconResult.public_id
      };
    }

    // Update other fields
    category.name = name || category.name;
    category.description = description || category.description;
    category.parent = parent || category.parent;
    if (attributes) {
      category.attributes = JSON.parse(attributes);
    }
    if (order !== undefined) {
      category.order = order;
    }

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

    // Check if category has children
    const hasChildren = await Category.exists({ parent: category._id });
    if (hasChildren) {
      return res.status(400).json({ message: 'Cannot delete category with subcategories' });
    }

    // Delete images from Cloudinary
    if (category.image?.public_id) {
      await deleteFromCloudinary(category.image.public_id);
    }
    if (category.icon?.public_id) {
      await deleteFromCloudinary(category.icon.public_id);
    }

    await category.deleteOne();
    res.json({ message: 'Category removed' });
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