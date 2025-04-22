const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const keyword = req.query.keyword
      ? {
          title: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};
    
    const brandFilter = req.query.brand ? { brand: req.query.brand } : {};
    const categoryFilter = req.query.category ? { category: req.query.category } : {};
    const sellerFilter = req.query.seller ? { seller: req.query.seller } : {};
    
    // Price range filter
    const priceFilter = {};
    if (req.query.minPrice) {
      priceFilter.price = { ...priceFilter.price, $gte: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice) {
      priceFilter.price = { ...priceFilter.price, $lte: Number(req.query.maxPrice) };
    }
    
    // Featured products filter
    const featuredFilter = req.query.featured === 'true' ? { isFeatured: true } : {};
    
    // Combine all filters
    const filters = {
      ...keyword,
      ...brandFilter,
      ...categoryFilter,
      ...priceFilter,
      ...featuredFilter,
      ...sellerFilter,
    };
    
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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('seller', 'username sellerProfile.storeName');
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller
const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      stock,
      category,
      brand,
      specifications,
      arModels
    } = req.body;

    // Get image paths from file upload
    const images = req.files ? req.files.map(file => file.path) : [];

    const product = new Product({
      title,
      description,
      price: Number(price),
      stock: Number(stock),
      images,
      category,
      brand,
      seller: req.user._id,
      specifications: specifications ? JSON.parse(specifications) : {},
      arModels: arModels ? JSON.parse(arModels) : {}
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      stock,
      category,
      brand,
      specifications,
      arModels
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update product fields
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    
    // Handle specifications
    if (specifications) {
      product.specifications = JSON.parse(specifications);
    }
    
    // Handle AR models
    if (arModels) {
      product.arModels = JSON.parse(arModels);
    }
    
    // Handle images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(file => file.path);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user already reviewed the product
    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = {
      name: req.user.username,
      rating: Number(rating),
      comment,
      userId: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get seller products
// @route   GET /api/products/seller
// @access  Private/Seller
const getSellerProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const filters = { seller: req.user._id };
    
    // Add keyword search if provided
    if (req.query.keyword) {
      filters.title = {
        $regex: req.query.keyword,
        $options: 'i',
      };
    }
    
    // Add category filter if provided
    if (req.query.category) {
      filters.category = req.query.category;
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
    
    const count = await Product.countDocuments(filters);
    const products = await Product.find(filters)
      .populate('category', 'name')
      .populate('brand', 'name')
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

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 8;
    
    const featuredProducts = await Product.find({ isFeatured: true })
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('seller', 'username sellerProfile.storeName')
      .limit(limit);
    
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const filters = { category: req.params.categoryId };
    
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

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    // Create search filters
    const keyword = req.query.q
      ? {
          $or: [
            { title: { $regex: req.query.q, $options: 'i' } },
            { description: { $regex: req.query.q, $options: 'i' } }
          ]
        }
      : {};
    
    // Set up sort
    let sortOption = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sortOption[sortField] = sortOrder;
    } else {
      // Default sort by relevance (which is implied by the search)
      sortOption = { score: { $meta: "textScore" } };
    }
    
    const count = await Product.countDocuments(keyword);
    const products = await Product.find(keyword)
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

// @desc    Get products by seller
// @route   GET /api/products/seller/:sellerId
// @access  Public
const getProductsBySeller = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const filters = { seller: req.params.sellerId };
    
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
    
    const count = await Product.countDocuments(filters);
    const products = await Product.find(filters)
      .populate('category', 'name')
      .populate('brand', 'name')
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

// @desc    Get current seller's products
// @route   GET /api/products/seller/me
// @access  Private/Seller
const getMyProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
    const filters = { seller: req.user._id };
    
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
    
    const count = await Product.countDocuments(filters);
    const products = await Product.find(filters)
      .populate('category', 'name')
      .populate('brand', 'name')
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

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Seller
const uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Get new image paths and add them to existing product images
    const newImages = req.files ? req.files.map(file => file.path) : [];
    product.images = [...product.images, ...newImages];

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Seller
const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Find the image index
    const imageIndex = product.images.findIndex(img => img.includes(req.params.imageId));

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Remove the image from the array
    product.images.splice(imageIndex, 1);
    await product.save();

    res.json({ message: 'Image removed', product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Seller
const updateProductStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Update stock
    product.stock = Number(req.body.stock);
    await product.save();

    res.json({ message: 'Stock updated', product });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all products (admin)
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    
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
    
    const count = await Product.countDocuments({});
    const products = await Product.find({})
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

// @desc    Update a product (admin)
// @route   PUT /api/products/admin/:id
// @access  Private/Admin
const updateProductAdmin = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      stock,
      category,
      brand,
      isFeatured,
      specifications,
      arModels
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update product fields
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;
    
    // Handle specifications
    if (specifications) {
      product.specifications = JSON.parse(specifications);
    }
    
    // Handle AR models
    if (arModels) {
      product.arModels = JSON.parse(arModels);
    }
    
    // Handle images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(file => file.path);
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product (admin)
// @route   DELETE /api/products/admin/:id
// @access  Private/Admin
const deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getSellerProducts,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
  getProductsBySeller,
  getMyProducts,
  uploadProductImages,
  deleteProductImage,
  updateProductStock,
  getAllProductsAdmin,
  updateProductAdmin,
  deleteProductAdmin,
}; 