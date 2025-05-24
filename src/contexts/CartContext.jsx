"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"

const CartContext = createContext()

export const useCart = () => useContext(CartContext)

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load cart from localStorage based on user
  useEffect(() => {
    setLoading(true)
    const storedCart = user 
      ? localStorage.getItem(`cart_${user._id}`)
      : localStorage.getItem("cart_guest")
    
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart))
      } catch (error) {
        console.error("Error parsing stored cart:", error)
        // Clear invalid cart data
        if (user) {
          localStorage.removeItem(`cart_${user._id}`)
        } else {
          localStorage.removeItem("cart_guest")
        }
      }
    } else {
      // Clear cart if no stored cart found
      setCartItems([])
    }
    setLoading(false)
  }, [user]) // Re-run when user changes (login/logout)

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      if (user) {
        localStorage.setItem(`cart_${user._id}`, JSON.stringify(cartItems))
      } else {
        localStorage.setItem("cart_guest", JSON.stringify(cartItems))
      }
    }
  }, [cartItems, loading, user])

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id)

      // Helper function to get the correct image URL
      const getImageUrl = (product) => {
        if (product.images && product.images.length > 0) {
          return typeof product.images[0] === 'string' 
            ? product.images[0] 
            : product.images[0].url || product.images[0].secure_url;
        }
        return product.image || '/placeholder.svg';
      };

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        // Add new item with all necessary details
        return [...prevItems, {
          _id: product._id,
          name: product.title || product.name,
          price: product.price,
          quantity,
          image: getImageUrl(product),
          sellerId: product.seller || product.sellerId,
          sellerName: product.sellerName,
        }]
      }
    })
  }

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems((prevItems) => prevItems.map((item) => (item._id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
    // Clear the appropriate cart in localStorage
    if (user) {
      localStorage.removeItem(`cart_${user._id}`)
    } else {
      localStorage.removeItem("cart_guest")
    }
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
  }

  return <CartContext.Provider value={value}>{!loading && children}</CartContext.Provider>
}
