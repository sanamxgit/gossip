const Product = require('../models/Product');
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
    
    let {
      title,
      description,
      price,
      originalPrice,
      stock,
      category,
      brand,
      specifications,
      arModels,
      colors,
      imagesCount
    } = req.body;

    // Parse JSON strings if needed - this handles FormData's string conversion
    try {
      // Handle arModels with explicit structure validation
      if (arModels && typeof arModels === 'string') {
        try {
          arModels = JSON.parse(arModels);
          console.log('Parsed arModels:', arModels);
          
          // Validate structure
          if (!arModels.ios) arModels.ios = {};
          if (!arModels.android) arModels.android = {};
          
          // Ensure ios has url and public_id as objects
          if (typeof arModels.ios === 'string') {
            const url = arModels.ios;
            arModels.ios = {
              url: url,
              public_id: url.split('/').pop() || ''
            };
          }
          
          // Ensure android has url and public_id as objects
          if (typeof arModels.android === 'string') {
            const url = arModels.android;
            arModels.android = {
              url: url,
              public_id: url.split('/').pop() || ''
            };
          }
          
          console.log('Structured arModels:', arModels);
        } catch (e) {
          console.error('Failed to parse arModels string:', e);
          arModels = { ios: {}, android: {} };
        }
      } else if (!arModels) {
        arModels = { ios: {}, android: {} };
      }
      
      if (colors && typeof colors === 'string') {
        colors = JSON.parse(colors);
        console.log('Parsed colors:', colors);
      }
      
      // NEW APPROACH: Process images from indexed FormData fields
      // First, check if we have an imagesCount field which indicates the new approach
      let images = [];
      if (imagesCount !== undefined) {
        const count = parseInt(imagesCount);
        console.log(`Using new approach with ${count} images`);
        
        // Build images array from indexed fields
        for (let i = 0; i < count; i++) {
          const url = req.body[`images[${i}][url]`];
          const public_id = req.body[`images[${i}][public_id]`];
          
          if (url && public_id) {
            images.push({ url, public_id });
          } else {
            console.warn(`Missing url or public_id for image at index ${i}`);
          }
        }
        
        console.log('Constructed images array from indexed fields:', images);
      } else {
        // FALLBACK: Try the old approach if imagesCount is not provided
        const images_str = req.body.images;
        if (images_str && typeof images_str === 'string') {
          try {
            images = JSON.parse(images_str);
            console.log('Parsed images from JSON string:', images);
            
            // Validate that images is an array
            if (!Array.isArray(images)) {
              console.error('Parsed images is not an array, forcing to empty array');
              images = [];
            }
          } catch (e) {
            console.error('Failed to parse images string:', e);
            images = [];
          }
        }
        
        // If still no images, check for separate image fields
        if (!images || !Array.isArray(images) || images.length === 0) {
          // Check if images are submitted as separate fields (from FormData)
          const imageKeys = Object.keys(req.body).filter(key => key.startsWith('images[') && key.endsWith(']'));
          
          if (imageKeys.length > 0) {
            console.log('Found image keys in FormData:', imageKeys);
            
            // Sort keys to ensure order is maintained
            imageKeys.sort((a, b) => {
              const aIndex = parseInt(a.match(/\[(\d+)\]/)[1]);
              const bIndex = parseInt(b.match(/\[(\d+)\]/)[1]);
              return aIndex - bIndex;
            });
            
            // Parse each image
            images = imageKeys.map(key => {
              try {
                const imgData = JSON.parse(req.body[key]);
                console.log(`Parsed image data for ${key}:`, imgData);
                return imgData;
              } catch (e) {
                console.error(`Failed to parse image data for ${key}:`, e);
                return null;
              }
            }).filter(img => img !== null);
            
            console.log('Parsed images from FormData fields:', images);
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      return res.status(400).json({ message: 'Invalid data format', error: parseError.message });
    }

    // Log the processed images
    console.log('Final processed images array:', images);
    console.log('Final processed arModels:', arModels);
    
    // Validate images array structure
    if (!Array.isArray(images)) {
      console.error('Images is not an array:', typeof images, images);
      return res.status(400).json({ message: 'Images must be an array' });
    }

    // Ensure each image has url and public_id - with detailed logging
    const invalidImages = images.filter(img => !img || !img.url || !img.public_id);
    if (invalidImages.length > 0) {
      console.error('Invalid images found:', invalidImages);
      console.error('All images array:', images);
      return res.status(400).json({ 
        message: 'Each image must have url and public_id',
        invalidImages
      });
    }

    const product = new Product({
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock),
      images: images,
      category,
      brand,
      seller: req.user._id,
      specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : {},
      arModels: arModels,
      colors: colors || []
    });

    console.log('Creating product with data:', {
      title,
      price,
      images: images.length,
      arModels: JSON.stringify(arModels),
      seller: req.user._id
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message });
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

    let {
      title,
      description,
      price,
      originalPrice,
      stock,
      category,
      brand,
      specifications,
      arModels,
      colors,
      imagesCount
    } = req.body;

    // Parse JSON strings if needed - this handles FormData's string conversion
    try {
      // Handle arModels with explicit structure validation
      if (arModels && typeof arModels === 'string') {
        try {
          arModels = JSON.parse(arModels);
          console.log('Parsed arModels:', arModels);
          
          // Validate structure
          if (!arModels.ios) arModels.ios = {};
          if (!arModels.android) arModels.android = {};
          
          // Ensure ios has url and public_id as objects
          if (typeof arModels.ios === 'string') {
            const url = arModels.ios;
            arModels.ios = {
              url: url,
              public_id: url.split('/').pop() || ''
            };
          }
          
          // Ensure android has url and public_id as objects
          if (typeof arModels.android === 'string') {
            const url = arModels.android;
            arModels.android = {
              url: url,
              public_id: url.split('/').pop() || ''
            };
          }
          
          console.log('Structured arModels:', arModels);
        } catch (e) {
          console.error('Failed to parse arModels string:', e);
          arModels = product.arModels; // Keep existing arModels if parsing fails
        }
      } else if (!arModels) {
        arModels = product.arModels; // Keep existing if not provided
      }
      
      if (colors && typeof colors === 'string') {
        colors = JSON.parse(colors);
        console.log('Parsed colors:', colors);
      }
      
      if (specifications && typeof specifications === 'string') {
        specifications = JSON.parse(specifications);
        console.log('Parsed specifications:', specifications);
      }
      
      // NEW APPROACH: Process images from indexed FormData fields
      // First, check if we have an imagesCount field which indicates the new approach
      let images = [];
      if (imagesCount !== undefined) {
        const count = parseInt(imagesCount);
        console.log(`Using new approach with ${count} images`);
        
        // Build images array from indexed fields
        for (let i = 0; i < count; i++) {
          const url = req.body[`images[${i}][url]`];
          const public_id = req.body[`images[${i}][public_id]`];
          
          if (url && public_id) {
            images.push({ url, public_id });
          } else {
            console.warn(`Missing url or public_id for image at index ${i}`);
          }
        }
        
        console.log('Constructed images array from indexed fields:', images);
      } else {
        // FALLBACK: Try the old approach if imagesCount is not provided
        const images_str = req.body.images;
        if (images_str && typeof images_str === 'string') {
          try {
            images = JSON.parse(images_str);
            console.log('Parsed images from JSON string:', images);
            
            // Validate that images is an array
            if (!Array.isArray(images)) {
              console.error('Parsed images is not an array, keeping existing images');
              images = product.images;
            }
          } catch (e) {
            console.error('Failed to parse images string:', e);
            images = product.images; // Keep existing images if parsing fails
          }
        } else if (!images_str) {
          // Check if images are submitted as separate fields (from FormData)
          const imageKeys = Object.keys(req.body).filter(key => key.startsWith('images[') && key.endsWith(']'));
          
          if (imageKeys.length > 0) {
            console.log('Found image keys in FormData:', imageKeys);
            
            // Sort keys to ensure order is maintained
            imageKeys.sort((a, b) => {
              const aIndex = parseInt(a.match(/\[(\d+)\]/)[1]);
              const bIndex = parseInt(b.match(/\[(\d+)\]/)[1]);
              return aIndex - bIndex;
            });
            
            // Parse each image
            images = imageKeys.map(key => {
              try {
                const imgData = JSON.parse(req.body[key]);
                console.log(`Parsed image data for ${key}:`, imgData);
                return imgData;
              } catch (e) {
                console.error(`Failed to parse image data for ${key}:`, e);
                return null;
              }
            }).filter(img => img !== null);
            
            console.log('Parsed images from FormData fields:', images);
          } else {
            // If no images provided in the update, keep existing images
            images = product.images;
            console.log('No new images provided, keeping existing images');
          }
        }
      }
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      return res.status(400).json({ message: 'Invalid data format', error: parseError.message });
    }

    // Log the processed images and arModels
    console.log('Final processed images array:', images);
    console.log('Final processed arModels:', arModels);
    
    // Validate images array structure
    if (images && !Array.isArray(images)) {
      console.error('Images is not an array:', typeof images, images);
      return res.status(400).json({ message: 'Images must be an array' });
    }

    // Ensure each image has url and public_id
    if (images && images.length > 0) {
      const invalidImages = images.filter(img => !img || !img.url || !img.public_id);
      if (invalidImages.length > 0) {
        console.error('Invalid images found:', invalidImages);
        console.error('All images array:', images);
        return res.status(400).json({ 
          message: 'Each image must have url and public_id',
          invalidImages
        });
      }
    }

    // Update product fields
    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.originalPrice = originalPrice ? Number(originalPrice) : product.originalPrice;
    product.stock = stock ? Number(stock) : product.stock;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    
    // Only update images if they are provided
    if (images && images.length > 0) {
      product.images = images;
    }
    
    // Update specifications if provided
    if (specifications) {
      product.specifications = specifications;
    }
    
    // Update AR models if provided
    if (arModels) {
      product.arModels = arModels;
    }
    
    // Update colors if provided
    if (colors) {
      product.colors = colors;
    }

    console.log('Updating product with data:', {
      title: product.title,
      price: product.price,
      images: product.images.length,
      arModels: JSON.stringify(product.arModels)
    });

    const updatedProduct = await product.save();
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