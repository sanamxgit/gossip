"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useCart } from "../contexts/CartContext"
import ARButton from "../components/ar/ARButton"
import ProductCard from "../components/products/ProductCard"
import "./ProductPage.css"

const ProductPage = () => {
  const { id } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState([])

  useEffect(() => {
    // In a real app, fetch product from API
    const fetchProduct = async () => {
      setLoading(true)
      try {
        // Simulate API call
        setTimeout(() => {
          // Mock product data
          const mockProduct = {
            id: Number.parseInt(id),
            name: "Product name",
            description:
              "This is a detailed description of the product. It includes information about the materials, dimensions, and features of the product.",
            price: 9999,
            originalPrice: 11000,
            images: [
              "/placeholder.svg?height=500&width=500",
              "/placeholder.svg?height=500&width=500",
              "/placeholder.svg?height=500&width=500",
            ],
            sold: 20,
            stock: 50,
            category: "Home & Decor",
            arIosUrl: "https://example.com/ar/ios/product1.usdz",
            arAndroidUrl: "https://example.com/ar/android/product1.glb",
            specifications: [
              { name: "Material", value: "Wood" },
              { name: "Dimensions", value: "50 x 30 x 20 cm" },
              { name: "Weight", value: "2 kg" },
              { name: "Color", value: "Brown" },
            ],
          }

          setProduct(mockProduct)

          // Mock related products
          const mockRelatedProducts = Array(4)
            .fill()
            .map((_, index) => ({
              id: 100 + index,
              name: `Related Product ${index + 1}`,
              price: 9999,
              originalPrice: 11000,
              image: "/placeholder.svg?height=200&width=200",
              sold: 15,
              arIosUrl: "https://example.com/ar/ios/related.usdz",
              arAndroidUrl: "https://example.com/ar/android/related.glb",
            }))

          setRelatedProducts(mockRelatedProducts)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching product:", error)
        setLoading(false)
      }
    }

    fetchProduct()
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
      addToCart(product, quantity)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(price)
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
            <div className="main-image">
              <img src={product.images[0] || "/placeholder.svg"} alt={product.name} />
            </div>
            <div className="thumbnail-images">
              {product.images.map((image, index) => (
                <div key={index} className="thumbnail">
                  <img src={image || "/placeholder.svg"} alt={`${product.name} - ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-sold">{product.sold} sold</div>

            <div className="product-price">
              <span className="current-price">{formatPrice(product.price)}</span>
              <span className="original-price">{formatPrice(product.originalPrice)}</span>
              <span className="discount-percentage">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            </div>

            <div className="product-description">
              <p>{product.description}</p>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <button className="quantity-btn" onClick={decrementQuantity}>
                  -
                </button>
                <input type="number" value={quantity} onChange={handleQuantityChange} min="1" max={product.stock} />
                <button className="quantity-btn" onClick={incrementQuantity}>
                  +
                </button>
              </div>

              <button className="add-to-cart-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>

              <div className="ar-button-container">
                <ARButton iosUrl={product.arIosUrl} androidUrl={product.arAndroidUrl} productName={product.name} />
              </div>
            </div>

            <div className="product-specifications">
              <h3>Specifications</h3>
              <ul>
                {product.specifications.map((spec, index) => (
                  <li key={index}>
                    <span className="spec-name">{spec.name}:</span>
                    <span className="spec-value">{spec.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="related-products">
          <h2>You may also like</h2>
          <div className="products-grid">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPage
