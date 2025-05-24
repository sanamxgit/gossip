import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/api/productService';
import categoryService from '../services/api/categoryService';
import './SellerAddProduct.css';

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [success, setSuccess] = useState(false);
  
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    brand: '',
    features: [''],
    specifications: [{ key: '', value: '' }],
    arModels: {
      ios: '',
      android: ''
    }
  });

  useEffect(() => {
    // Fetch categories when component mounts
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAllCategories();
        setCategories(data.categories || []);
      } catch (err) {
        setError('Failed to load categories. Please try again later.');
        console.error(err);
      }
    };
    
    loadCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like arModels.ios
      const [parent, child] = name.split('.');
      setProductData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProductData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...productData.features];
    updatedFeatures[index] = value;
    setProductData({ ...productData, features: updatedFeatures });
  };

  const addFeature = () => {
    setProductData({
      ...productData,
      features: [...productData.features, '']
    });
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...productData.features];
    updatedFeatures.splice(index, 1);
    setProductData({ ...productData, features: updatedFeatures });
  };

  const handleSpecificationChange = (index, key, value) => {
    const updatedSpecs = [...productData.specifications];
    updatedSpecs[index] = { key, value };
    setProductData({ ...productData, specifications: updatedSpecs });
  };

  const addSpecification = () => {
    setProductData({
      ...productData, 
      specifications: [...productData.specifications, { key: '', value: '' }]
    });
  };

  const removeSpecification = (index) => {
    const updatedSpecs = [...productData.specifications];
    updatedSpecs.splice(index, 1);
    setProductData({ ...productData, specifications: updatedSpecs });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }
    
    setImageFiles(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare the product data
      const productDataToSubmit = {
        ...productData,
        images: imageFiles.map(file => {
          if (file instanceof File) {
            return file;
          } else if (typeof file === 'object' && file.url && file.public_id) {
            return {
              url: file.url,
              public_id: file.public_id
            };
          }
          return null;
        }).filter(img => img !== null)
      };

      // Submit the product data
      await productService.createProduct(productDataToSubmit);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product. Please try again.');
      console.error('Error creating product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-add-product">
      <div className="product-form-header">
        <h1>Add New Product</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/seller/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
      
      {success && (
        <div className="success-message">
          Product created successfully! Redirecting to dashboard...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Product Title*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={productData.title}
              onChange={handleChange}
              required
              placeholder="Enter product title"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description*</label>
            <textarea
              id="description"
              name="description"
              value={productData.description}
              onChange={handleChange}
              rows="5"
              required
              placeholder="Detailed product description"
            ></textarea>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (Rs)*</label>
              <input
                type="number"
                id="price"
                name="price"
                value={productData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="discountPrice">Discount Price (Rs)</label>
              <input
                type="number"
                id="discountPrice"
                name="discountPrice"
                value={productData.discountPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock">Stock Quantity*</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={productData.stock}
                onChange={handleChange}
                min="1"
                required
                placeholder="1"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category*</label>
              <select
                id="category"
                name="category"
                value={productData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="brand">Brand</label>
            <input
              type="text"
              id="brand"
              name="brand"
              value={productData.brand}
              onChange={handleChange}
              placeholder="Brand name"
            />
          </div>
        </div>
        
        <div className="form-section">
          <h2>Product Images</h2>
          <div className="form-group">
            <label htmlFor="images">Upload Images (Max 5)*</label>
            <input
              type="file"
              id="images"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              required
            />
            <p className="help-text">First image will be used as the main product image</p>
          </div>
          
          {previewImages.length > 0 && (
            <div className="image-previews">
              {previewImages.map((src, index) => (
                <div key={index} className="image-preview">
                  <img src={src} alt={`Preview ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-section">
          <h2>Product Features</h2>
          {productData.features.map((feature, index) => (
            <div key={index} className="form-row feature-row">
              <div className="form-group feature-input">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder="Add a feature"
                />
              </div>
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeFeature(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-btn"
            onClick={addFeature}
          >
            Add Feature
          </button>
        </div>
        
        <div className="form-section">
          <h2>Product Specifications</h2>
          {productData.specifications.map((spec, index) => (
            <div key={index} className="form-row spec-row">
              <div className="form-group">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleSpecificationChange(index, e.target.value, spec.value)}
                  placeholder="Specification name"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleSpecificationChange(index, spec.key, e.target.value)}
                  placeholder="Specification value"
                />
              </div>
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeSpecification(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-btn"
            onClick={addSpecification}
          >
            Add Specification
          </button>
        </div>
        
        <div className="form-section">
          <h2>AR Models (Optional)</h2>
          <div className="form-group">
            <label htmlFor="arIos">AR Model for iOS (USDZ URL)</label>
            <input
              type="text"
              id="arIos"
              name="arModels.ios"
              value={productData.arModels.ios}
              onChange={handleChange}
              placeholder="https://example.com/model.usdz"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="arAndroid">AR Model for Android (GLB URL)</label>
            <input
              type="text"
              id="arAndroid"
              name="arModels.android"
              value={productData.arModels.android}
              onChange={handleChange}
              placeholder="https://example.com/model.glb"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/seller/dashboard')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerAddProduct; 