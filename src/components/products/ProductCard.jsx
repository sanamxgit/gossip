import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import ARButton from '../ar/ARButton';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };
  
  const discountPercentage = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <Link 
      to={`/product/${product.id}`} 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card-image">
        <img src={product.image || "/placeholder.svg"} alt={product.name} />
        
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
            
            <ARButton 
              iosUrl={product.arIosUrl} 
              androidUrl={product.arAndroidUrl} 
              productName={product.name}
            />
          </div>
        )}
      </div>
      
      <div className="product-card-content">
        <h3 className="product-card-title">{product.name}</h3>
        <div className="product-sold">{product.sold} sold</div>
        
        <div className="product-card-price">
          <span className="price">{formatPrice(product.price)}</span>
          <span className="original-price">{formatPrice(product.originalPrice)}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
