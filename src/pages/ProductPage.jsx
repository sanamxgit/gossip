"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useCart } from "../contexts/CartContext"
import ARButton from "../components/ar/ARButton"
import ProductCard from "../components/products/ProductCard"
import ErrorBoundary from "../components/common/ErrorBoundary"
import productService from "../services/api/productService"
import "./ProductPage.css"

const ProductPage = () => {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [error, setError] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)

  useEffect(() => {
    // Reset state when product ID changes
    setLoading(true)
    setError(null)
    setProduct(null)
    setRelatedProducts([])
    
    const fetchProductData = async () => {
      try {
        console.log("Fetching product with ID:", id)
        const productData = await productService.getProductById(id)
        console.log("Product data received:", productData)
        setProduct(productData)
        
        // Set default selected color if colors are available
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColor(productData.colors[0])
        }
        
        // Fetch related products
        try {
          const relatedData = await productService.getRelatedProducts(id)
          console.log("Related products:", relatedData)
          setRelatedProducts(relatedData.products || relatedData || [])
        } catch (relatedError) {
          console.error("Error fetching related products:", relatedError)
          // Just set empty array for related products and don't block the main product display
          setRelatedProducts([])
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Failed to load product. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProductData()
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NRs",
      minimumFractionDigits: 2,
    }).format(price)
  }
  
  // This is a placeholder function for demo colors if product doesn't have them
  const getProductColors = () => {
    if (product && product.colors && product.colors.length > 0) {
      return product.colors;
    }
    return ["#9A8A78", "#333333", "#D9D9D9"]; // Default beige, black, light grey
  }

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
  
  // Make sure image paths are fully qualified URLs
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder.svg";
    
    // If already a fully qualified URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's just a filename (not a path), prepend the uploads directory
    if (!imagePath.startsWith('/')) {
      return `${process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/uploads'}/${imagePath}`;
    }
    
    // If it's an absolute path to the server
    if (imagePath.startsWith('/uploads/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
    }
    
    // Otherwise, return as is with API URL
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${imagePath}`;
  };

  // Safely render ARButton component
  const renderARButton = () => {
    if (product.arModels?.ios || product.arModels?.android) {
      return (
        <ErrorBoundary silent={true}>
          <div className="ar-button-container">
            <ARButton 
              iosUrl={product.arModels?.ios} 
              androidUrl={product.arModels?.android} 
              productName={product.title} 
            />
          </div>
        </ErrorBoundary>
      );
    }
    return null;
  };

  return (
    <div className="product-page">
      <div className="container">
        <div className="product-details">
          <div className="product-gallery">
            <div className="main-image">
              <img src={getImageUrl(product.images?.[0])} alt={product.title} />
            </div>
            <div className="thumbnail-images">
              {(product.images || []).map((image, index) => (
                <div key={index} className="thumbnail">
                  <img src={getImageUrl(image)} alt={`${product.title} - ${index + 1}`} />
                </div>
              ))}
            </div>
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

              <button className="buy-now-btn" type="button">
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
                  <img src={getImageUrl(image)} alt={`${product.title} lifestyle ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
          
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="product-specifications-section">
              <h3>Technical Details:</h3>
              <div className="specifications-content">
                <ul className="specifications-list">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <li key={index}>
                      <span className="spec-name">{key}:</span>
                      <span className="spec-value">{value}</span>
                    </li>
                  ))}
                </ul>
                
                {product.images && product.images.length > 0 && (
                  <div className="specifications-image">
                    <img src={getImageUrl(product.images[product.images.length - 1])} alt="Product specifications" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {relatedProducts && relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>More {product.category?.name || "Products"}</h2>
            <ErrorBoundary silent={true}>
              <div className="products-grid">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct._id} product={relatedProduct} />
                ))}
              </div>
            </ErrorBoundary>
          </div>
        )}
        
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="style-it-with">
            <h2>Style It With</h2>
            <ErrorBoundary silent={true}>
              <div className="products-grid">
                {relatedProducts.slice(0, Math.min(relatedProducts.length, 4)).map((relatedProduct) => (
                  <ProductCard key={`style-${relatedProduct._id}`} product={relatedProduct} />
                ))}
              </div>
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductPage
