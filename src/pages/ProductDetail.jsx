import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaQrcode } from 'react-icons/fa';
import productService from '../services/api/productService';
import ModelPreview from '../components/ar/ModelPreview';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-detail">
      <div className="product-images-container">
        <div className="main-image-container">
          {product.images.length > 1 && (
            <button className="nav-button prev" onClick={handlePrevImage}>
              <FaArrowLeft />
            </button>
          )}
          <img 
            src={product.images[currentImageIndex]?.url || product.images[currentImageIndex]} 
            alt={product.title} 
            className="main-image"
          />
          {product.images.length > 1 && (
            <button className="nav-button next" onClick={handleNextImage}>
              <FaArrowRight />
            </button>
          )}
        </div>

        <div className="thumbnails-container">
          {product.images.map((image, index) => (
            <div 
              key={index}
              className={`thumbnail ${currentImageIndex === index ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img 
                src={image.url || image} 
                alt={`${product.title} thumbnail ${index + 1}`}
              />
            </div>
          ))}
          {(product.arModels?.ios || product.arModels?.android) && (
            <div 
              className={`thumbnail model-thumbnail ${currentImageIndex === product.images.length ? 'active' : ''}`}
              onClick={() => setShowQR(!showQR)}
            >
              <div className="model-icon">3D</div>
            </div>
          )}
        </div>

        {(product.arModels?.ios || product.arModels?.android) && showQR && (
          <div className="ar-model-section">
            <h3>View in Your Space</h3>
            <div className="model-previews">
              {product.arModels?.ios && (
                <div className="model-preview">
                  <h4>iOS (iPhone/iPad)</h4>
                  <ModelPreview 
                    modelUrl={product.arModels.ios}
                    modelType="usdz"
                    showQRCode={true}
                  />
                </div>
              )}
              {product.arModels?.android && (
                <div className="model-preview">
                  <h4>Android</h4>
                  <ModelPreview 
                    modelUrl={product.arModels.android}
                    modelType="glb"
                    showQRCode={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="product-info">
        <h1>{product.title}</h1>
        <p className="price">
          NRs. {product.price.toLocaleString()}
          {product.originalPrice && (
            <span className="original-price">
              NRs. {product.originalPrice.toLocaleString()}
            </span>
          )}
        </p>
        <p className="description">{product.description}</p>
        
        {/* Add other product details as needed */}
      </div>
    </div>
  );
};

export default ProductDetail; 