import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaHeart, FaRegHeart, FaShoppingCart } from 'react-icons/fa';
import PriceDisplay from './PriceDisplay';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  onAddToWishlist, 
  isInWishlist,
  size = 'md' 
}) => {
  const handleAddToCart = (e) => {
    e.preventDefault();
    onAddToCart(product);
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    onAddToWishlist(product);
  };

  // Determine size-specific classes
  const cardClasses = {
    sm: 'w-40 h-64',
    md: 'w-56 h-80',
    lg: 'w-64 h-96'
  }[size] || 'w-56 h-80';

  const imageClasses = {
    sm: 'h-32',
    md: 'h-40',
    lg: 'h-48'
  }[size] || 'h-40';

  const titleClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[size] || 'text-base';

  // Get the first image or use placeholder
  const productImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder-product.jpg';

  return (
    <Link 
      to={`/product/${product._id}`} 
      className={`product-card ${cardClasses} bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1`}
    >
      <div className={`relative ${imageClasses} overflow-hidden`}>
        <img 
          src={productImage} 
          alt={product.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button 
            onClick={handleAddToWishlist}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isInWishlist ? (
              <FaHeart className="text-red-500" />
            ) : (
              <FaRegHeart className="text-gray-500" />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-3 flex flex-col justify-between h-[calc(100%-10rem)]">
        <div>
          <h3 className={`${titleClasses} font-medium text-gray-800 mb-1 line-clamp-2`}>
            {product.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {product.brand || 'Generic Brand'}
          </p>
        </div>
        
        <div className="flex justify-between items-center">
          <PriceDisplay price={product.price} bold size={size} />
          
          <button
            onClick={handleAddToCart}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
            aria-label="Add to cart"
          >
            <FaShoppingCart />
          </button>
        </div>
      </div>
    </Link>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    brand: PropTypes.string
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onAddToWishlist: PropTypes.func.isRequired,
  isInWishlist: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

ProductCard.defaultProps = {
  isInWishlist: false,
  size: 'md'
};

export default ProductCard; 