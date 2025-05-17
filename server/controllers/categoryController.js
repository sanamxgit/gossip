const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
const getFeaturedCategories = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 4;
    
    // Find categories with product counts
    const categories = await Category.find({})
      .sort({ name: 1 })
      .limit(limit);
    
    // Add description field for each category if missing
    const categoriesWithDescriptions = categories.map(cat => {
      const category = cat.toObject();
      if (!category.description) {
        category.description = `Shop ${category.name}`;
      }
      return category;
    });
    
    res.json({ categories: categoriesWithDescriptions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;
    
    // Check if category name already exists
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    // Create new category
    const category = new Category({
      name,
      description,
      parentCategory: parentCategory || null,
      image: req.file ? req.file.path : '',
    });
    
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if updated name already exists (if name is being changed)
    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }
    
    // Update category fields
    category.name = name || category.name;
    category.description = description || category.description;
    
    // Handle parent category update
    if (parentCategory === '') {
      // If parentCategory is empty string, set to null (remove parent)
      category.parentCategory = null;
    } else if (parentCategory) {
      // If parentCategory is provided, check if it exists and is not the same as this category
      if (parentCategory === req.params.id) {
        return res.status(400).json({ message: 'Category cannot be its own parent' });
      }
      category.parentCategory = parentCategory;
    }
    
    // Update image if provided
    if (req.file) {
      category.image = req.file.path;
    }
    
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has sub-categories
    const subCategories = await Category.countDocuments({ parentCategory: req.params.id });
    if (subCategories > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with sub-categories. Remove or reassign sub-categories first.' 
      });
    }
    
    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${productsCount} products. Remove or reassign products first.` 
      });
    }
    
    await category.remove();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top level categories
// @route   GET /api/categories/top
// @access  Public
const getTopCategories = async (req, res) => {
  try {
    const categories = await Category.find({ parentCategory: null }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get subcategories of a category
// @route   GET /api/categories/:id/subcategories
// @access  Public
const getSubcategories = async (req, res) => {
  try {
    const subcategories = await Category.find({ parentCategory: req.params.id }).sort({ name: 1 });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products in a category
// @route   GET /api/categories/:id/products
// @access  Public
const getCategoryProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    // Get all subcategory IDs for this category
    const getAllSubcategoryIds = async (categoryId) => {
      const subcategories = await Category.find({ parentCategory: categoryId });
      let ids = [categoryId];
      
      for (const subcategory of subcategories) {
        const subIds = await getAllSubcategoryIds(subcategory._id);
        ids = [...ids, ...subIds];
      }
      
      return ids;
    };
    
    // Get this category and all its subcategories
    const categoryIds = await getAllSubcategoryIds(req.params.id);
    
    // Find products in this category and its subcategories
    const count = await Product.countDocuments({ category: { $in: categoryIds } });
    const products = await Product.find({ category: { $in: categoryIds } })
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('seller', 'username sellerProfile.storeName')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));
    
    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getTopCategories,
  getSubcategories,
  getCategoryProducts,
  getFeaturedCategories,
}; 