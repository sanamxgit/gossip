const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinaryMiddleware');

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
    console.log('Create product request body:', req.body);
    
    // Extract product data from request body
    const {
      title,
      description,
      price,
      originalPrice,
      category,
      brand,
      stock,
      colors,
      specifications,
      features,
      arModels,
      imagesCount,
      images
    } = req.body;

    // Validate required fields
    if (!title || !description || !price || !category || !brand || stock === undefined) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description', 'price', 'category', 'brand', 'stock']
      });
    }

    // Handle category - check if string name or ObjectId
    let categoryId = category;
    if (!mongoose.Types.ObjectId.isValid(category)) {
      // If category is a name, look up the ID
      const categoryDoc = await Category.findOne({ name: category });
      if (!categoryDoc) {
        return res.status(400).json({
          message: 'Invalid category. Please provide a valid category ID or name.'
        });
      }
      categoryId = categoryDoc._id;
    }

    // Process images
    let processedImages = [];
    
    // Handle images if they're in the request body as an array
    if (Array.isArray(images)) {
      processedImages = images.map(img => ({
        url: img.url,
        public_id: img.public_id
      }));
    } else {
      // Handle individual image fields if array is not present
      const imageCount = parseInt(imagesCount || '0');
      for (let i = 0; i < imageCount; i++) {
        const url = req.body[`images[${i}][url]`];
        const public_id = req.body[`images[${i}][public_id]`];
        
        if (url && public_id) {
          processedImages.push({ url, public_id });
        }
      }
    }

    // Calculate discount percentage
    let discountPercentage = 0;
    if (originalPrice && Number(originalPrice) > Number(price)) {
      discountPercentage = Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100);
    }

    // Create new product with validated data
    const product = new Product({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discountPercentage,
      category: categoryId,
      brand,
      stock: Number(stock),
      colors: colors ? JSON.parse(colors) : [],
      specifications: specifications ? JSON.parse(specifications) : [],
      features: features ? JSON.parse(features) : [],
      arModels: arModels ? JSON.parse(arModels) : {},
      images: processedImages,
      seller: req.user._id
    });

    console.log('Product to be saved:', product);

    // Save product
    const savedProduct = await product.save();
    
    // Populate the saved product with category and brand details
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('seller', 'username sellerProfile.storeName');

    console.log('Saved product:', populatedProduct);

    // Return success response
    res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = async (req, res) => {
  try {
    console.log('Update product request body:', req.body);
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Extract fields from request body
    const {
      title,
      description,
      price,
      originalPrice,
      stock,
      category,
      brand,
      colors,
      imagesCount
    } = req.body;

    // Process images
    let images = [];
    const imageCount = parseInt(imagesCount || '0');
    
    if (imageCount > 0) {
      // If images are sent as an array in req.body.images
      if (Array.isArray(req.body.images)) {
        images = req.body.images;
      } else {
        // If images are sent as individual fields
        for (let i = 0; i < imageCount; i++) {
          const url = req.body[`images[${i}][url]`];
          const public_id = req.body[`images[${i}][public_id]`];
          
          if (url && public_id) {
            images.push({ url, public_id });
          }
        }
      }
    }

    // Parse JSON strings if needed
    const parsedColors = colors ? JSON.parse(colors) : product.colors;
    const parsedArModels = req.body.arModels ? JSON.parse(req.body.arModels) : product.arModels;

    // Update the product with new values
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title: title || product.title,
          description: description || product.description,
          price: price ? Number(price) : product.price,
          originalPrice: originalPrice ? Number(originalPrice) : product.originalPrice,
          stock: stock ? Number(stock) : product.stock,
          category: category || product.category,
          brand: brand || product.brand,
          colors: parsedColors,
          arModels: parsedArModels,
          images: images.length > 0 ? images : product.images,
          updatedAt: Date.now()
        }
      },
      { new: true }
    ).populate('category', 'name')
     .populate('brand', 'name')
     .populate('seller', 'username sellerProfile.storeName');

    console.log('Updated product:', updatedProduct);
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
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

    // Delete images from Cloudinary
    const deletePromises = product.images.map(image => 
      deleteFromCloudinary(image.public_id)
    );
    await Promise.all(deletePromises);

    await product.remove();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment, photos, orderId } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the user already reviewed this product for this order
    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString() && 
             r.orderId.toString() === orderId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order' });
    }

    const review = {
      name: req.user.username,
      rating: Number(rating),
      comment,
      userId: req.user._id,
      orderId,
      photos: photos || [],
      verified: true // Since it's coming from an order
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Add reply to a review
// @route   POST /api/products/:id/reviews/:reviewId/reply
// @access  Private/Seller
const addReviewReply = async (req, res) => {
  try {
    const { comment } = req.body;
    const { id, reviewId } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller of the product
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can reply to reviews' });
    }

    // Find the review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add or update the reply
    review.sellerReply = {
      comment,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await product.save();
    res.status(200).json({ message: 'Reply added successfully', review });
  } catch (error) {
    console.error('Error adding reply:', error);
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
  addReviewReply,
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