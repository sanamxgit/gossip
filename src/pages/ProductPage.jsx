"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useCart } from "../contexts/CartContext"
import ARButton from "../components/ar/ARButton"
import ModelPreview from "../components/ar/ModelPreview"
import ProductCard from "../components/products/ProductCard"
import ErrorBoundary from "../components/common/ErrorBoundary"
import productService from "../services/api/productService"
import orderService from "../services/api/orderService"
import { useAuth } from "../contexts/AuthContext"
import "./ProductPage.css"

const ProductPage = () => {
  const { id } = useParams()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [error, setError] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [relatedLoading, setRelatedLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    // Reset state when product ID changes
    setLoading(true)
    setError(null)
    setProduct(null)
    setRelatedProducts([])
    
    const fetchData = async () => {
      try {
        // First get the product data
        const productData = await productService.getProductById(id);
        setProduct(productData);
        
        // Set default selected color if colors are available
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0])
        }
        
        // Set reviews from product data
        setReviews(productData.reviews || []);
        setReviewsLoading(false);
        
        // Fetch related products from same brand
        if (productData.brand) {
          try {
            const relatedData = await productService.getProducts({
              brand: productData.brand._id,
              limit: 4,
              exclude: id
            });
            setRelatedProducts(relatedData.products || []);
          } catch (relatedErr) {
            console.log("Could not fetch related products:", relatedErr);
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load product data");
      } finally {
        setLoading(false);
        setReviewsLoading(false);
        setRelatedLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id])

  const handleQuantityChange = (e) => {
    const value = Number.parseInt(e.target.value)
    if (value > 0 && value <= (product?.stock || 100)) {
      setQuantity(value)
    }
  }

  const incrementQuantity = () => {
    if (quantity < (product?.stock || 100)) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        ...product,
        selectedColor: selectedColor
      }, quantity)
    }
  }

  const handleBuyNow = () => {
    if (product) {
      // Add to cart first
      addToCart({
        ...product,
        selectedColor: selectedColor
      }, quantity);
      
      // Navigate to checkout
      navigate('/checkout');
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'NRs. 0.00';
    
    try {
      return new Intl.NumberFormat('ne-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } catch (error) {
      console.error('Error formatting price:', error);
      return `NRs. ${parseFloat(price).toFixed(2)}`;
    }
  };
  
  // This is a placeholder function for demo colors if product doesn't have them
  const getProductColors = () => {
    if (product && product.colors && product.colors.length > 0) {
      return product.colors;
    }
    return ["#9A8A78", "#333333", "#D9D9D9"]; // Default beige, black, light grey
  }

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

  // Make sure image paths are fully qualified URLs
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
    
    // If it's an absolute path to the server
    if (path.startsWith('/uploads/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
    }
    
    // Otherwise, return as is with API URL
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  // Helper function to extract model URL from model object or string
  const getModelUrl = (model) => {
    if (!model) return '';
    return typeof model === 'object' && model.url ? model.url : model;
  };

  // Safely render ARButton component
  const renderARButton = () => {
    if (product.arModels?.ios || product.arModels?.android) {
      return (
        <ErrorBoundary silent={true}>
          <div className="ar-button-container">
            <ARButton 
              iosUrl={getModelUrl(product.arModels?.ios)} 
              androidUrl={getModelUrl(product.arModels?.android)} 
              productName={product.title} 
            />
          </div>
        </ErrorBoundary>
      );
    }
    return null;
  };

  const handleReplySubmit = async (reviewId) => {
    try {
      await productService.addReviewReply(product._id, reviewId, {
        comment: replyText
      });
      
      // Refresh product data to get updated reviews
      const updatedProduct = await productService.getProductById(id);
      setProduct(updatedProduct);
      setReviews(updatedProduct.reviews || []);
      
      // Reset reply state
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply');
    }
  };

  const isProductSeller = user && product && user._id === product.seller._id;

  if (loading) {
    return (
      <div className="product-page loading">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="product-page error">
        <div className="container">
          <h2>Error Loading Product</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-page not-found">
        <div className="container">
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="product-page">
      <div className="container">
        <div className="product-details">
          <div className="product-gallery">
            <div className="main-image-container">
              {currentImageIndex === product.images.length && (product.arModels?.ios || product.arModels?.android) ? (
                <ModelPreview 
                  modelUrl={getModelUrl(product.arModels?.android)}
                  iosUrl={getModelUrl(product.arModels?.ios)}
                  androidUrl={getModelUrl(product.arModels?.android)}
                />
              ) : (
                <>
                  {product.images.length > 1 && (
                    <button className="nav-button prev" onClick={handlePrevImage}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  )}
                  <img 
                    src={getImageUrl(product.images[currentImageIndex])} 
                    alt={product.title} 
                    className="main-image"
                  />
                  {product.images.length > 1 && (
                    <button className="nav-button next" onClick={handleNextImage}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  )}
                </>
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
                    src={getImageUrl(image)} 
                    alt={`${product.title} thumbnail ${index + 1}`}
                  />
                </div>
              ))}
              {(product.arModels?.ios || product.arModels?.android) && (
                <div 
                  className={`thumbnail model-thumbnail ${currentImageIndex === product.images.length ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(product.images.length)}
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
                        modelUrl={getModelUrl(product.arModels.ios)}
                        modelType="usdz"
                        showQRCode={true}
                      />
                    </div>
                  )}
                  {product.arModels?.android && (
                    <div className="model-preview">
                      <h4>Android</h4>
                      <ModelPreview 
                        modelUrl={getModelUrl(product.arModels.android)}
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
            <h1 className="product-title">{product.title}</h1>
            <div className="product-meta">
              <div className="product-sold">{product.sold || 0} sold</div>
              {product.category && (
                <div className="product-category">Category: {product.category.name || "Uncategorized"}</div>
              )}
            </div>

            <div className="product-price">
              <span className="current-price">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="original-price">{formatPrice(product.originalPrice)}</span>
                  <span className="discount-percentage">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="product-description">
              <p>{product.description}</p>
            </div>
            
            {/* Stock Display */}
            <div className="product-stock">
              <h4>Stock</h4>
              <p className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
              </p>
            </div>
            
            {/* Color Options */}
            <div className="product-colors">
              <h4>Colors</h4>
              <div className="color-options">
                {getProductColors().map((color, index) => (
                  <button 
                    key={index}
                    className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button className="quantity-btn" onClick={decrementQuantity} type="button">
                  -
                </button>
                <input type="number" value={quantity} onChange={handleQuantityChange} min="1" max={product.stock} />
                <button className="quantity-btn" onClick={incrementQuantity} type="button">
                  +
                </button>
              </div>

              <button className="add-to-cart-btn" onClick={handleAddToCart} type="button">
                Add to Cart
              </button>

              <button className="buy-now-btn" onClick={handleBuyNow} type="button">
                Buy Now
              </button>

              {renderARButton()}
            </div>
          </div>
        </div>
        
        {/* Additional Product Information Sections */}
        <div className="product-additional-info">
          <div className="product-feature-text">
            <p>"{product.title} makes room for silence and sitting relaxed in a chair and enjoying yourself."</p>
          </div>
          
          <div className="product-lifestyle-images">
            <div className="lifestyle-grid">
              {(product.images || []).slice(0, Math.min(product.images.length, 4)).map((image, index) => (
                <div key={`lifestyle-${index}`} className={`lifestyle-image lifestyle-image-${index + 1}`}>
                  <img src={getImageUrl(image)} alt={`${product.title} lifestyle image ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="product-reviews-section">
          <h2>Customer Reviews</h2>
          <div className="reviews-summary">
            <div className="average-rating">
              <div className="rating-number">{product?.rating?.toFixed(1) || 0}</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (product?.rating || 0) ? 'filled' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className="total-reviews">Based on {product?.numReviews || 0} reviews</div>
            </div>
          </div>

          <div className="reviews-list">
            {reviewsLoading ? (
              <div className="loading-spinner"></div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <h4>{review.name}</h4>
                      <div className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="review-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= review.rating ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="review-content">
                    <p>{review.comment}</p>
                  </div>
                  {review.photos && review.photos.length > 0 && (
                    <div className="review-photos">
                      {review.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo.url}
                          alt={`Review photo ${index + 1}`}
                          className="review-photo"
                        />
                      ))}
                    </div>
                  )}
                  {review.verified && (
                    <div className="verified-purchase">
                      <span className="verified-badge">✓ Verified Purchase</span>
                    </div>
                  )}
                  
                  {/* Seller Reply Section */}
                  {review.sellerReply && (
                    <div className="seller-reply">
                      <div className="seller-reply-header">
                        <h5>Seller's Response</h5>
                        <div className="reply-date">
                          {new Date(review.sellerReply.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p>{review.sellerReply.comment}</p>
                    </div>
                  )}
                  
                  {/* Reply Button for Seller */}
                  {isProductSeller && !review.sellerReply && (
                    <div className="seller-actions">
                      {replyingTo === review._id ? (
                        <div className="reply-form">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            rows={3}
                          />
                          <div className="reply-actions">
                            <button 
                              className="submit-reply"
                              onClick={() => handleReplySubmit(review._id)}
                              disabled={!replyText.trim()}
                            >
                              Submit Reply
                            </button>
                            <button 
                              className="cancel-reply"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="reply-button"
                          onClick={() => setReplyingTo(review._id)}
                        >
                          Reply to Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-reviews">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="related-products-section">
          <h2>More from {product?.brand?.name}</h2>
          {relatedLoading ? (
            <div className="loading-spinner"></div>
          ) : relatedProducts.length > 0 ? (
            <div className="related-products-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          ) : (
            <div className="no-related-products">No related products found</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductPage