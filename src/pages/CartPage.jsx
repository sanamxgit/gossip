"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import "./CartPage.css"

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const handleQuantityChange = (productId, quantity) => {
    updateQuantity(productId, Number.parseInt(quantity))
  }

  const handleRemoveItem = (productId) => {
    removeFromCart(productId)
  }

  const handleCheckout = () => {
    if (!user) {
      navigate("/login")
      return
    }

    setIsCheckingOut(true)

    // Simulate checkout process
    setTimeout(() => {
      clearCart()
      navigate("/checkout/success")
    }, 2000)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(price)
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="container">
          <div className="empty-cart">
            <h1>Your Cart is Empty</h1>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/" className="continue-shopping-btn">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>

        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-header">
              <div className="cart-product">Product</div>
              <div className="cart-price">Price</div>
              <div className="cart-quantity">Quantity</div>
              <div className="cart-total">Total</div>
              <div className="cart-actions">Actions</div>
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-product">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="cart-product-image" />
                  <div className="cart-product-info">
                    <h3>{item.name}</h3>
                    {item.arIosUrl && <span className="ar-badge">AR Available</span>}
                  </div>
                </div>

                <div className="cart-price">{formatPrice(item.price)}</div>

                <div className="cart-quantity">
                  <div className="quantity-selector">
                    <button className="quantity-btn" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      min="1"
                    />
                    <button className="quantity-btn" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-total">{formatPrice(item.price * item.quantity)}</div>

                <div className="cart-actions">
                  <button className="remove-btn" onClick={() => handleRemoveItem(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(getCartTotal())}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>

            <div className="summary-row">
              <span>Tax</span>
              <span>{formatPrice(getCartTotal() * 0.1)}</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(getCartTotal() * 1.1)}</span>
            </div>

            <button className="checkout-btn" onClick={handleCheckout} disabled={isCheckingOut}>
              {isCheckingOut ? "Processing..." : "Proceed to Checkout"}
            </button>

            <Link to="/" className="continue-shopping-link">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage
