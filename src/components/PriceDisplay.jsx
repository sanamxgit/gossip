import React from 'react';
import PropTypes from 'prop-types';
import { formatPrice } from '../utils/formatters';

/**
 * A component to display prices in Indian Rupees (₹)
 * 
 * @param {Object} props
 * @param {number} props.price - The price in rupees
 * @param {boolean} props.showSymbol - Whether to show the ₹ symbol
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} props.bold - Whether to display in bold
 */
const PriceDisplay = ({ 
  price, 
  showSymbol = true, 
  className = '', 
  size = 'md',
  bold = false,
  originalPrice,
  showDiscount = true
}) => {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Format price with Indian locale and rupee symbol
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);

  // Determine CSS classes based on props
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  }[size] || 'text-base';

  const fontWeightClass = bold ? 'font-bold' : 'font-normal';
  
  return (
    <div className={`price-display ${sizeClass} ${fontWeightClass} ${className}`}>
      <span className="current-price">{formatPrice(price)}</span>
      {originalPrice && originalPrice > price && (
        <>
          <span className="original-price">{formatPrice(originalPrice)}</span>
          {showDiscount && <span className="discount">-{discount}%</span>}
        </>
      )}
    </div>
  );
};

PriceDisplay.propTypes = {
  price: PropTypes.number.isRequired,
  showSymbol: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  bold: PropTypes.bool,
  originalPrice: PropTypes.number,
  showDiscount: PropTypes.bool
};

export default PriceDisplay; 