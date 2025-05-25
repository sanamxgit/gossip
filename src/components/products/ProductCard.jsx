import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import ARButton from '../ar/ARButton';
import ErrorBoundary from '../common/ErrorBoundary';
import { UPLOAD_URL, API_URL } from '../../config';
import './ProductCard.css';
import { formatPrice } from '../../utils/formatters';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [arButtonError, setArButtonError] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };
  
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
      return `${UPLOAD_URL}/${path}`;
    }
    
    // If it's an absolute path without domain
    if (path.startsWith('/uploads/')) {
      return `${API_URL}${path}`;
    }
    
    // Fall back to API URL + path
    return `${API_URL}${path}`;
  };
  
  const calculateDiscount = () => {
    if (product.originalPrice && product.price) {
      const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  // Safely render ARButton to handle potential errors
  const renderARButton = () => {
    if (arButtonError) return null;
    
    return (
      <ErrorBoundary 
        silent={true} 
        onError={() => setArButtonError(true)}
      >
        <ARButton 
          iosUrl={product.arModels?.ios || product.arIosUrl} 
          androidUrl={product.arModels?.android || product.arAndroidUrl} 
          productName={product.title || product.name}
        />
      </ErrorBoundary>
    );
  };

  return (
    <Link 
      to={`/product/${product._id}`} 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card-image">
        <img 
          src={imageError ? "/placeholder.svg" : getImageUrl(product.images?.[0])} 
          alt={product.title} 
          onError={(e) => {
            e.target.onerror = null;
            setImageError(true);
            e.target.src = "/placeholder.svg";
          }}
        />
        
        {calculateDiscount() > 0 && (
          <div className="discount-label">-{calculateDiscount()}%</div>
        )}
        
        {product.arModels && (Object.keys(product.arModels).length > 0) && (
          <div className="ar-available">AR</div>
        )}
        
        {/* Shop Now button at bottom right */}
        <div className="product-cta">
          <button className="shop-now-btn">Shop Now</button>
        </div>
        
        {/* Quick action buttons (optional) */}
        {isHovered && (
          <div className="product-quick-actions">
            <button className="quick-add-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
            
            {!arButtonError && renderARButton()}
          </div>
        )}
      </div>
      
      <div className="product-card-content">
        <h3 className="product-card-title">{product.title || product.name}</h3>
        <div className="product-card-meta">
          {product.rating > 0 && (
            <div className="product-rating">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= product.rating ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="rating-count">({product.numReviews})</span>
            </div>
          )}
          {product.sold > 0 && (
            <div className="product-sold">{product.sold} sold</div>
          )}
          {product.category && (
            <div className="product-category">{typeof product.category === 'object' ? product.category.name : product.category}</div>
          )}
        </div>
        
        {product.colors && product.colors.length > 0 && (
          <div className="product-colors">
            {product.colors.map((color, index) => (
              <div 
                key={index} 
                className="color-option" 
                style={{ backgroundColor: typeof color === 'object' ? color.code : color }}
                title={typeof color === 'object' ? color.name : color}
              />
            ))}
          </div>
        )}
        
        <div className="product-price">
          {formatPrice(product.price)}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="original-price">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
