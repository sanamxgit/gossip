"use client"

import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import productService from '../services/api/productService'
import { API_URL } from '../config'
import "./SellerDashboard.css"
import { FaBox, FaShoppingBag, FaChartBar, FaCog, FaPowerOff, FaEdit, FaTrash, FaEye, FaUpload } from 'react-icons/fa'
import orderService from '../services/api/orderService'
import authService from '../services/api/authService'
import modelUploadService from '../services/api/modelUploadService'
import ModelPreview from '../components/ar/ModelPreview'
import axios from 'axios'

const SellerDashboard = () => {
  const { user, isAuthenticated, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUser] = useState([])
  const [statistics, setStatistics] = useState({
    totalSales: 0,
    totalProducts: 0,
    pendingOrders: 0,
    revenue: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productFormData, setProductFormData] = useState({
    id: null,
    title: "",
    price: "",
    originalPrice: "",
    description: "",
    category: "",
    stock: "",
    images: [],
    arModels: {
      ios: {},
      android: {}
    },
    brand: "",
    colors: []
  })
  const [previewImages, setPreviewImages] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Handle 3D model upload
  const [modelFiles, setModelFiles] = useState({
    ios: null,
    android: null
  })
  const [modelPreviews, setModelPreviews] = useState({
    ios: null,
    android: null
  })
  const [modelUploading, setModelUploading] = useState({
    ios: false,
    android: false
  })
  const [modelErrors, setModelErrors] = useState({
    ios: null,
    android: null
  })

  // Add this with other state declarations at the top
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is a seller
    if (!loading && !isAuthenticated) {
      navigate("/login")
      return
    }

    if (!loading && isAuthenticated && user && user.role !== "seller") {
      navigate("/")
      return
    }

    // Load seller data
    if (isAuthenticated && user && user.role === "seller") {
      fetchSellerData()
    }
  }, [isAuthenticated, loading, user, navigate])

  const fetchSellerData = async () => {
    setIsLoading(true)
    try {
      // Debug: Log authentication state
      console.log("Auth status:", { isAuthenticated, user })
      console.log("Token:", localStorage.getItem('token'))
      
      // Check if user is authenticated and is a seller
      const userData = await authService.getCurrentUser()
      if (!userData || userData.role !== 'seller') {
        throw new Error('Not authenticated as a seller')
      }
      setUser(userData)

      // Debug: Log user data from API
      console.log("Authenticated user data:", userData)
      
      // Fetch products - passing the user ID if available
      const productsData = await productService.getSellerProducts({ 
        sellerId: userData._id 
      })
      setProducts(productsData.products || [])

      // Fetch orders
      let ordersData;
      try {
        ordersData = await orderService.getSellerOrders()
        setOrders(ordersData.orders || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
        // Fallback to mock data if API is not available
        setOrders(getMockOrders())
      }

      // Set statistics
      setStatistics({
        totalSales: productsData.products ? productsData.products.reduce((total, product) => total + (product.salesCount || 0), 0) : 0,
        totalProducts: productsData.products ? productsData.products.length : 0,
        pendingOrders: ordersData && ordersData.orders ? ordersData.orders.filter(order => order.status === 'PENDING').length : 0,
        revenue: ordersData && ordersData.orders ? ordersData.orders.reduce((total, order) => total + (order.total || 0), 0) : 0
      })
    } catch (error) {
      console.error("Error fetching seller data:", error)
      // Use mock data if API fails
      setUser({ name: "Seller Demo", email: "seller@example.com", sellerProfile: { storeName: "Demo Store" } })
      setProducts([
        { _id: "1", title: "Sample Product 1", price: 2999, stock: 10, images: ["/placeholder.svg"], category: { name: "Sample Category" } },
        { _id: "2", title: "Sample Product 2", price: 4999, stock: 5, images: ["/placeholder.svg"], category: { name: "Sample Category" } }
      ])
      setOrders(getMockOrders())
      setStatistics({
        totalSales: 12,
        totalProducts: 2,
        pendingOrders: 3,
        revenue: 125075
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMockOrders = () => {
    return Array(5).fill().map((_, index) => ({
      id: `order-${index + 1}`,
      customer: `Customer ${index + 1}`,
      date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      total: Math.floor(Math.random() * 10000) + 1000,
      status: ['Pending', 'Processing', 'Shipped', 'Delivered'][Math.floor(Math.random() * 4)]
    }))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleAddProduct = () => {
    setProductFormData({
      title: "",
      price: "",
      originalPrice: "",
      description: "",
      category: "",
      stock: "",
      images: [],
      arModels: {
        ios: {},
        android: {}
      },
      brand: "",
      colors: []
    })
    setPreviewImages([])
    setShowProductForm(true)
  }

  const handleEditProduct = async (productId) => {
    try {
      const product = await productService.getProductById(productId)
      setProductFormData({
        id: product._id,
        title: product.title || "",
        price: product.price || "",
        originalPrice: product.originalPrice || "",
        description: product.description || "",
        category: product.category?._id || product.category || "",
        stock: product.stock || "",
        images: product.images || [],
        arModels: {
          ios: product.arModels?.ios || {},
          android: product.arModels?.android || {}
        },
        brand: product.brand || "",
        colors: product.colors || []
      })
      setPreviewImages(product.images || [])
      setModelPreviews({
        ios: product.arModels?.ios?.url || null,
        android: product.arModels?.android?.url || null
      })
      setShowProductForm(true)
    } catch (error) {
      console.error("Error fetching product:", error)
      alert("Error loading product data. Please try again.")
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        // Delete the product (image deletion is now handled in the service)
        await productService.deleteProduct(productId);
        
        // Remove product from state
        setProducts(products.filter(product => product._id !== productId));
        
        // Update statistics
        setStatistics(prev => ({
          ...prev,
          totalProducts: prev.totalProducts - 1
        }));

        alert("Product deleted successfully!");
      } catch (error) {
        console.error("Error deleting product:", error);
        const errorMessage = error.message || "Error deleting product. Please try again.";
        setErrorMessage(errorMessage);
        alert(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target
    if (name === 'arIosUrl') {
      setProductFormData(prev => ({
        ...prev,
        arModels: {
          ...prev.arModels,
          ios: {
            url: value,
            public_id: value.split('/').pop() || ''
          }
        }
      }))
    } else if (name === 'arAndroidUrl') {
      setProductFormData(prev => ({
        ...prev,
        arModels: {
          ...prev.arModels,
          android: {
            url: value,
            public_id: value.split('/').pop() || ''
          }
        }
      }))
    } else {
    setProductFormData(prev => ({
      ...prev,
      [name]: value
    }))
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check total number of images (existing + new)
    const totalImages = previewImages.length + files.length;
    if (totalImages > 5) {
      alert("You can upload a maximum of 5 images.");
      return;
    }

    try {
      // Show loading state for image upload only
      setImageUploading(true);

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/api/products/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        return {
          url: response.data.secure_url,
          public_id: response.data.public_id
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Update preview images and form data
      const newPreviewImages = [...previewImages];
      const newImages = [...productFormData.images || []];

      uploadedImages.forEach(image => {
        if (image && image.url) {
          // Check if image URL already exists
          if (!newPreviewImages.some(preview => 
            (typeof preview === 'string' && preview === image.url) || 
            (preview.url === image.url)
          )) {
            newPreviewImages.push(image.url);
            newImages.push({
              url: image.url,
              public_id: image.public_id
            });
          }
        }
      });

      setPreviewImages(newPreviewImages);
      setProductFormData(prev => ({
        ...prev,
        images: newImages
      }));

      console.log('Updated product form data:', productFormData);

    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async (index) => {
    try {
      const imageToRemove = productFormData.images[index];
      
      // If the image has a public_id (Cloudinary image), try to delete it from Cloudinary
      if (imageToRemove && imageToRemove.public_id) {
        try {
          console.log('Attempting to delete image with public_id:', imageToRemove.public_id);
          
          // Only try to delete from server if this is an edit of an existing product
          if (productFormData.id) {
            await productService.uploadProductImage({
              method: 'DELETE',
              public_id: imageToRemove.public_id
            });
          } else {
            // This is a new product draft, just log that we're skipping server deletion
            console.log('Skipping server deletion for new product draft');
          }
        } catch (deleteError) {
          // Just log the error but continue with removing from state
          console.error('Error deleting image from server:', deleteError);
          console.log('Continuing with local removal...');
        }
      }

      // Always remove image from preview and form data (local state)
      const newPreviewImages = previewImages.filter((_, i) => i !== index);
      const newImages = productFormData.images.filter((_, i) => i !== index);

      setPreviewImages(newPreviewImages);
      setProductFormData(prev => ({
        ...prev,
        images: newImages
      }));
      
      console.log('Image removed from local state successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image from local state. Please try again.');
    }
  };

  const handleModelUpload = async (e, platform) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = {
      ios: ['.usdz', 'model/vnd.usdz+zip', 'application/octet-stream'],
      android: ['.glb', '.gltf', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
    };

    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = platform === 'ios' 
      ? validTypes.ios.some(type => fileExtension.includes(type) || file.type.includes(type))
      : validTypes.android.some(type => fileExtension.includes(type) || file.type.includes(type));

    if (!isValidType) {
      setModelErrors(prev => ({
        ...prev,
        [platform]: platform === 'ios' 
          ? 'Invalid file type. Please upload a USDZ file for iOS.'
          : 'Invalid file type. Please upload a GLB or GLTF file for Android.'
      }));
      return;
    }

    try {
      setModelUploading(prev => ({ ...prev, [platform]: true }));

      // Create FormData and explicitly add the platform
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', platform);

      // Upload model using the service
      const result = await productService.uploadModel(formData);
      
      console.log(`${platform} model upload result:`, result);
      
      // Update the form data with the model URL and public_id
      setProductFormData(prev => {
        // Make sure arModels object exists
        const currentArModels = prev.arModels || {};
        
        // Create the updated arModels object with proper structure
        const updatedArModels = {
          ...currentArModels,
          [platform]: {
            url: result.url,
            public_id: result.public_id
          }
        };
        
        console.log('Updated arModels object:', updatedArModels);
        
        return {
          ...prev,
          arModels: updatedArModels
        };
      });

      // Clear any previous errors
      setModelErrors(prev => ({ ...prev, [platform]: null }));

      // Set preview URL
      setModelPreviews(prev => ({
        ...prev,
        [platform]: result.url
      }));
    } catch (error) {
      console.error(`Error uploading ${platform} model:`, error);
      setModelErrors(prev => ({
        ...prev,
        [platform]: `Failed to upload model: ${error.message}`
      }));
    } finally {
      setModelUploading(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Handle model deletion
  const handleModelDelete = async (platform) => {
    try {
      const arModels = productFormData.arModels || {};
      const publicId = arModels[platform]?.public_id;
      
      if (!publicId) {
        console.log(`No ${platform} model to delete`);
        return;
      }

      console.log(`Deleting ${platform} model with public_id:`, publicId);
      await productService.deleteModel(publicId);

      // Clear the model URL and public_id from form data
      setProductFormData(prev => {
        // Create a copy of the current arModels
        const updatedArModels = { ...prev.arModels };
        
        // Remove this platform's model data
        updatedArModels[platform] = {};
        
        return {
          ...prev,
          arModels: updatedArModels
        };
      });

      // Clear preview
      setModelPreviews(prev => ({
        ...prev,
        [platform]: null
      }));
    } catch (error) {
      console.error(`Error deleting ${platform} model:`, error);
      alert(`Failed to delete ${platform} model: ${error.message}`);
    }
  };

  const handleProductFormSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Prepare the arModels data with proper structure
      const arModels = productFormData.arModels || {};
      
      // Format arModels to make sure it has the correct structure
      const formattedArModels = {
        ios: arModels.ios || {},
        android: arModels.android || {}
      };
      
      console.log("AR Models being submitted:", formattedArModels);

      // Prepare the form data
      const formData = new FormData();
      
      // Add basic product information
      formData.append('title', productFormData.title);
      formData.append('price', productFormData.price);
      formData.append('originalPrice', productFormData.originalPrice);
      formData.append('description', productFormData.description);
      formData.append('category', productFormData.category);
      formData.append('brand', productFormData.brand || "651d72f84b14d81584889191");
      formData.append('stock', productFormData.stock);
      formData.append('arModels', JSON.stringify(formattedArModels));
      formData.append('colors', JSON.stringify(productFormData.colors));

      // Handle images
      if (productFormData.images && Array.isArray(productFormData.images)) {
        // Add image count
        formData.append('imagesCount', productFormData.images.length.toString());
        
        // Add each image's data
        productFormData.images.forEach((img, index) => {
          if (img && img.url && img.public_id) {
            formData.append(`images[${index}][url]`, img.url);
            formData.append(`images[${index}][public_id]`, img.public_id);
          }
        });
      }

      console.log("Submitting form data:", Object.fromEntries(formData));

      let response;
      if (productFormData.id) {
        // Update existing product
        response = await productService.updateProduct(productFormData.id, formData);

        // Update product in state
        setProducts(products.map(product =>
          product._id === productFormData.id ? response : product
        ));

        alert("Product updated successfully!");
      } else {
        // Create new product
        response = await productService.createProduct(formData);

        // Add new product to state
        setProducts([...products, response]);

        // Update statistics
        setStatistics(prev => ({
          ...prev,
          totalProducts: prev.totalProducts + 1
        }));

        alert("Product created successfully!");
      }

      // Close form
      setShowProductForm(false);
    } catch (error) {
      console.error("Error submitting product:", error);
      setErrorMessage(error.response?.data?.message || "Error saving product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NRs",
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleAddColor = () => {
    const newColors = [...productFormData.colors, { name: "", code: "#000000" }];
    setProductFormData(prev => ({
      ...prev,
      colors: newColors
    }));
  }

  const handleColorChange = (index, field, value) => {
    const newColors = [...productFormData.colors];
    newColors[index][field] = value;
    setProductFormData(prev => ({
      ...prev,
      colors: newColors
    }));
  }

  const handleRemoveColor = (index) => {
    const newColors = [...productFormData.colors];
    newColors.splice(index, 1);
    setProductFormData(prev => ({
      ...prev,
      colors: newColors
    }));
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.svg";
    
    // If imagePath is an object with url property (from Cloudinary)
    if (typeof imagePath === 'object' && imagePath.url) {
      return imagePath.url;
    }
    
    // If imagePath is an object with secure_url property (from Cloudinary)
    if (typeof imagePath === 'object' && imagePath.secure_url) {
      return imagePath.secure_url;
    }
    
    // Convert to string to handle any non-string inputs
    const path = String(imagePath);
    
    // If already a fully qualified URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's just a filename (not a path), prepend the uploads directory
    if (!path.startsWith('/')) {
      return `${process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/uploads'}/${path}`;
    }
    
    // If it's an absolute path without domain
    if (path.startsWith('/uploads/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
    }
    
    // Fall back to API URL + path
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  if (loading || isLoading) {
    return (
      <div className="seller-dashboard loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="store-info">
            <h2>{user?.sellerProfile?.storeName || "Your Store"}</h2>
            <p className="seller-name">{user?.username}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "dashboard" ? "active" : ""}>
              <button onClick={() => setActiveTab("dashboard")}>
                <span className="icon"><FaChartBar /></span>
                Dashboard
              </button>
            </li>
            <li className={activeTab === "products" ? "active" : ""}>
              <button onClick={() => setActiveTab("products")}>
                <span className="icon"><FaBox /></span>
                Products
              </button>
            </li>
            <li className={activeTab === "orders" ? "active" : ""}>
              <button onClick={() => setActiveTab("orders")}>
                <span className="icon"><FaShoppingBag /></span>
                Orders
              </button>
            </li>
            <li className={activeTab === "settings" ? "active" : ""}>
              <button onClick={() => setActiveTab("settings")}>
                <span className="icon"><FaCog /></span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn-secondary"
            onClick={() => {
              logout()
              navigate("/login")
            }}
          >
            <FaPowerOff /> Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === "dashboard" && (
          <div className="dashboard-overview">
            <h1>Dashboard Overview</h1>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{statistics.totalSales}</div>
                <div className="stat-label">Total Sales</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistics.totalProducts}</div>
                <div className="stat-label">Products</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{statistics.pendingOrders}</div>
                <div className="stat-label">Pending Orders</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatPrice(statistics.revenue)}</div>
                <div className="stat-label">Revenue</div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="section">
                <div className="section-header">
                  <h2>Recent Orders</h2>
                  <button className="btn-text" onClick={() => setActiveTab("orders")}>View All</button>
                </div>
                <div className="recent-orders">
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="order-item">
                      <div className="order-info">
                        <div className="order-id">{order.id}</div>
                        <div className="order-customer">{order.customer}</div>
                      </div>
                      <div className="order-details">
                        <div className="order-date">{formatDate(order.date)}</div>
                        <div className="order-amount">{formatPrice(order.total)}</div>
                        <div className={`order-status ${order.status.toLowerCase()}`}>{order.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <h2>Recent Products</h2>
                  <button className="btn-text" onClick={() => setActiveTab("products")}>View All</button>
                </div>
                <div className="recent-products">
                  {products.slice(0, 3).map(product => (
                    <div key={product._id} className="product-item">
                      <img 
                        src={getImageUrl(product.images?.[0])} 
                        alt={product.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                      <div className="product-info">
                        <div className="product-title">{product.title}</div>
                        <div className="product-price">{formatPrice(product.price)}</div>
                      </div>
                      <div className="product-stock">
                        Stock: {product.stock || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="dashboard-products">
            <div className="section-header">
              <h1>Products</h1>
              <button className="btn-primary" onClick={handleAddProduct}>Add New Product</button>
            </div>

            {products.length === 0 ? (
              <div className="empty-state">
                <h2>No products yet</h2>
                <p>Start adding products to your store.</p>
                <button className="btn-primary" onClick={handleAddProduct}>Add First Product</button>
              </div>
            ) : (
              <div className="products-table">
                <div className="table-header">
                  <div className="col-image">Image</div>
                  <div className="col-title">Title</div>
                  <div className="col-price">Price</div>
                  <div className="col-stock">Stock</div>
                  <div className="col-category">Category</div>
                  <div className="col-actions">Actions</div>
                </div>

                {products.map(product => (
                  <div key={product._id} className="table-row">
                    <div className="col-image">
                      <img 
                        src={getImageUrl(product.images?.[0])} 
                        alt={product.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className="col-title">{product.title}</div>
                    <div className="col-price">{formatPrice(product.price)}</div>
                    <div className="col-stock">{product.stock || 0}</div>
                    <div className="col-category">{product.category?.name || "Uncategorized"}</div>
                    <div className="col-actions">
                      <button
                        className="btn-icon"
                        onClick={() => handleEditProduct(product._id)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDeleteProduct(product._id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      <Link
                        to={`/product/${product._id}`}
                        className="btn-icon"
                        title="View Product"
                      >
                        <FaEye />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="dashboard-orders">
            <h1>Orders</h1>

            {orders.length === 0 ? (
              <div className="empty-state">
                <h2>No orders yet</h2>
                <p>Orders will appear here when customers make purchases.</p>
              </div>
            ) : (
              <div className="orders-table">
                <div className="table-header">
                  <div className="col-id">Order ID</div>
                  <div className="col-customer">Customer</div>
                  <div className="col-date">Date</div>
                  <div className="col-total">Total</div>
                  <div className="col-status">Status</div>
                  <div className="col-actions">Actions</div>
                </div>

                {orders.map(order => (
                  <div key={order.id} className="table-row">
                    <div className="col-id">{order.id}</div>
                    <div className="col-customer">{order.customer}</div>
                    <div className="col-date">{formatDate(order.date)}</div>
                    <div className="col-total">{formatPrice(order.total)}</div>
                    <div className="col-status">
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="col-actions">
                      <Link
                        to={`/seller/orders/${order.id}`}
                        className="btn-icon"
                        title="View Order"
                      >
                        <FaEye />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="dashboard-settings">
            <h1>Store Settings</h1>
            <div className="settings-form">
              <div className="form-section">
                <h2>Store Information</h2>
                <div className="form-group">
                  <label>Store Name</label>
                  <input type="text" value={user?.sellerProfile?.storeName || ""} readOnly />
                </div>
                <div className="form-group">
                  <label>Store Description</label>
                  <textarea
                    value={user?.sellerProfile?.storeDescription || ""}
                    readOnly
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="form-section">
                <h2>Contact Information</h2>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={user?.email || ""} readOnly />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={user?.sellerProfile?.phoneNumber || ""} readOnly />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-primary">Edit Profile</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showProductForm && (
        <div className="product-form-modal">
          <div className="product-form-content">
            <button className="close-form-btn" onClick={() => setShowProductForm(false)}>
              ×
            </button>

            <h2>{productFormData.id ? "Edit Product" : "Add New Product"}</h2>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <form onSubmit={handleProductFormSubmit}>
              <div className="form-group">
                <label>Product Title*</label>
                <input
                  type="text"
                  name="title"
                  value={productFormData.title}
                  onChange={handleProductFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Price (Rs.)*</label>
                <input
                  type="number"
                  name="price"
                  value={productFormData.price}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Original Price (Rs.)</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={productFormData.originalPrice}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  placeholder="Original price (for discount)"
                />
                <small>Leave blank if there's no discount</small>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productFormData.description}
                  onChange={handleProductFormChange}
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={productFormData.category} onChange={handleProductFormChange}>
                  <option value="">Select Category</option>
                  <option value="Mobile & Devices">Mobile & Devices</option>
                  <option value="Watch">Watch</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Home & Decor">Home & Decor</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Skin care">Skin care</option>
                </select>
              </div>

              <div className="form-group">
                <label>Brand</label>
                <select name="brand" value={productFormData.brand} onChange={handleProductFormChange}>
                  <option value="">Select Brand</option>
                  <option value="651d72f84b14d81584889191">Apple</option>
                  <option value="651d72f84b14d81584889192">Samsung</option>
                  <option value="651d72f84b14d81584889193">Nike</option>
                  <option value="651d72f84b14d81584889194">Adidas</option>
                  <option value="651d72f84b14d81584889195">Sony</option>
                  <option value="651d72f84b14d81584889196">IKEA</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stock Quantity*</label>
                <input
                  type="number"
                  name="stock"
                  value={productFormData.stock}
                  onChange={handleProductFormChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Product Images</label>
                <div className="image-upload">
                  <input
                    type="file"
                    id="product-images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="product-images" className="upload-btn">
                    <FaUpload /> Upload Images
                  </label>
                  <p className="help-text">
                    You can upload up to 5 images. First image will be the main product image.
                  </p>
                  
                  {imageUploading && (
                    <div className="upload-loading">
                      <div className="loading-spinner"></div>
                      <span>Uploading images...</span>
                    </div>
                  )}

                  {previewImages.length > 0 && (
                    <div className="image-previews">
                      {previewImages.map((src, index) => (
                        <div key={index} className="image-preview-item">
                          <img 
                            src={typeof src === 'string' ? src : src.url} 
                            alt={`Preview ${index + 1}`} 
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Product Colors</h3>
                <div className="color-container">
                  {productFormData.colors.map((color, index) => (
                    <div key={index} className="color-item">
                      <div className="form-group">
                        <label>Color Name</label>
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                          placeholder="e.g. Red, Blue, Green"
                        />
                      </div>
                      <div className="form-group">
                        <label>Color Code</label>
                        <div className="color-picker-wrapper">
                          <input
                            type="color"
                            value={color.code}
                            onChange={(e) => handleColorChange(index, 'code', e.target.value)}
                          />
                          <input
                            type="text"
                            value={color.code}
                            onChange={(e) => handleColorChange(index, 'code', e.target.value)}
                            placeholder="#RRGGBB"
                          />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="remove-color-btn"
                        onClick={() => handleRemoveColor(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  className="add-color-btn"
                  onClick={handleAddColor}
                >
                  Add Color
                </button>
              </div>

              <div className="form-section">
                <h3>AR Models</h3>
                
                <div className="form-group">
                  <label>AR Model for iOS (USDZ)</label>
                  <div className="ar-model-upload">
                    <input
                      type="file"
                      name="arIosModel"
                      accept=".usdz,model/vnd.usdz+zip,application/octet-stream"
                      onChange={(e) => handleModelUpload(e, 'ios')}
                    />
                    <p className="help-text">Upload a USDZ file for iOS AR Quick Look</p>
                    {modelUploading.ios && <div className="loading-spinner model-upload-spinner"></div>}
                    {modelErrors.ios && <p className="error-text">{modelErrors.ios}</p>}
                  </div>
                  
                  {(modelPreviews.ios || productFormData.arModels.ios.url) && (
                    <ModelPreview 
                      modelUrl={productFormData.arModels.ios.url || modelPreviews.ios} 
                      modelType="usdz" 
                      showQRCode={true}
                    />
                  )}
                  
                  <input
                    type="text"
                    name="arIosUrl"
                    value={productFormData.arModels.ios.url || ''}
                    onChange={handleProductFormChange}
                    placeholder="https://github.com/sanamxgit/models/model.usdz"
                  />
                  <p className="help-text">
                    Or provide a direct URL to a USDZ file already hosted on GitHub
                  </p>
                </div>
                
                <div className="form-group">
                  <label>AR Model for Android (GLB/GLTF)</label>
                  <div className="ar-model-upload">
                    <input
                      type="file"
                      name="arAndroidModel"
                      accept=".glb,.gltf,model/gltf-binary,model/gltf+json,application/octet-stream"
                      onChange={(e) => handleModelUpload(e, 'android')}
                    />
                    <p className="help-text">Upload a GLB or GLTF file for Android Scene Viewer</p>
                    {modelUploading.android && <div className="loading-spinner model-upload-spinner"></div>}
                    {modelErrors.android && <p className="error-text">{modelErrors.android}</p>}
                  </div>
                  
                  {(modelPreviews.android || productFormData.arModels.android.url) && (
                    <ModelPreview 
                      modelUrl={productFormData.arModels.android.url || modelPreviews.android} 
                      modelType="glb" 
                      showQRCode={true}
                    />
                  )}
                  
                  <input
                    type="text"
                    name="arAndroidUrl"
                    value={productFormData.arModels.android.url || ''}
                    onChange={handleProductFormChange}
                    placeholder="https://github.com/sanamxgit/models/model.glb"
                  />
                  <p className="help-text">
                    Or provide a direct URL to a GLB/GLTF file already hosted on GitHub
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowProductForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : (productFormData.id ? "Update Product" : "Add Product")
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerDashboard
