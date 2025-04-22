const Brand = require('../models/Brand');
const Product = require('../models/Product');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (brand) {
      res.json(brand);
    } else {
      res.status(404).json({ message: 'Brand not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = async (req, res) => {
  try {
    const { name, description, website, isOfficialStore } = req.body;
    
    // Check if brand name already exists
    const brandExists = await Brand.findOne({ name });
    if (brandExists) {
      return res.status(400).json({ message: 'Brand with this name already exists' });
    }
    
    // Create new brand
    const brand = new Brand({
      name,
      description,
      website,
      isOfficialStore: isOfficialStore === 'true',
      logo: req.file ? req.file.path : '',
    });
    
    const createdBrand = await brand.save();
    res.status(201).json(createdBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = async (req, res) => {
  try {
    const { name, description, website, isOfficialStore } = req.body;
    
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    // Check if updated name already exists (if name is being changed)
    if (name && name !== brand.name) {
      const nameExists = await Brand.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: 'Brand with this name already exists' });
      }
    }
    
    // Update brand fields
    brand.name = name || brand.name;
    brand.description = description || brand.description;
    brand.website = website || brand.website;
    
    // Only update if the value is explicitly provided
    if (isOfficialStore !== undefined) {
      brand.isOfficialStore = isOfficialStore === 'true';
    }
    
    // Update logo if provided
    if (req.file) {
      brand.logo = req.file.path;
    }
    
    const updatedBrand = await brand.save();
    res.json(updatedBrand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    // Check if brand has products
    const productsCount = await Product.countDocuments({ brand: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete brand with ${productsCount} products. Remove or reassign products first.` 
      });
    }
    
    await brand.remove();
    res.json({ message: 'Brand removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products of a brand
// @route   GET /api/brands/:id/products
// @access  Public
const getBrandProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    // Set up filters
    const filters = { brand: req.params.id };
    
    // Add category filter if provided
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    // Price range filter
    if (req.query.minPrice) {
      filters.price = { ...filters.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      filters.price = { ...filters.price, $lte: Number(req.query.maxPrice) };
    }
    
    // Set up sort
    let sortOption = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      // Default sort by newest
      sortOption = { createdAt: -1 };
    }
    
    // Find products for this brand
    const count = await Product.countDocuments(filters);
    const products = await Product.find(filters)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('seller', 'username sellerProfile.storeName')
      .sort(sortOption)
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

// @desc    Get featured brands
// @route   GET /api/brands/featured
// @access  Public
const getFeaturedBrands = async (req, res) => {
  try {
    // Get official store brands first
    const officialBrands = await Brand.find({ isOfficialStore: true }).sort({ name: 1 }).limit(5);
    
    // Get the most popular brands based on product count
    const brandProductCounts = await Product.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get the actual brand documents
    const popularBrandIds = brandProductCounts.map(item => item._id);
    const popularBrands = await Brand.find({ 
      _id: { $in: popularBrandIds },
      isOfficialStore: { $ne: true } // Exclude official stores already included
    });
    
    // Combine the lists
    const featuredBrands = [...officialBrands];
    
    // Add popular brands not already included
    for (const brand of popularBrands) {
      if (!featuredBrands.some(fb => fb._id.toString() === brand._id.toString())) {
        featuredBrands.push(brand);
      }
      
      if (featuredBrands.length >= 10) {
        break;
      }
    }
    
    res.json(featuredBrands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandProducts,
  getFeaturedBrands,
}; 