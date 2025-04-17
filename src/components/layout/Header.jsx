"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import "./Header.css"

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const { user, logout } = useAuth()
  const { cartItems } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    // In a real app, fetch categories from API
    setCategories([
      "All Categories",
      "Mobile & Devices",
      "Watch",
      "Accessories",
      "Home & Decor",
      "Fashion",
      "Beauty",
      "Skin care product",
    ])
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    // Implement search functionality
    navigate(`/search?q=${searchQuery}&category=${selectedCategory !== "All Categories" ? selectedCategory : ""}`)
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="header">
      <div className="top-bar">
        <div className="container flex justify-between items-center">
          <div className="top-links">
            <Link to="/become-seller">Become a seller</Link>
            <Link to="/help">Help & Support</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>

      <div className="main-header">
        <div className="container flex justify-between items-center">
          <div className="logo-search flex items-center gap-3">
            <Link to="/" className="logo">
              LOGO
            </Link>

            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form">
                <div className="category-select">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  <i className="search-icon">🔍</i>
                </button>
              </form>
            </div>
          </div>

          <div className="header-actions flex items-center gap-3">
            <div className="user-menu">
              {user ? (
                <div className="dropdown">
                  <button className="dropdown-toggle">
                    {user.username} <span className="arrow-down">▼</span>
                  </button>
                  <div className="dropdown-menu">
                    <Link to="/profile">My Profile</Link>
                    <Link to="/orders">My Orders</Link>
                    {user.role === "seller" && <Link to="/seller/dashboard">Seller Dashboard</Link>}
                    {user.role === "admin" && <Link to="/admin/dashboard">Admin Dashboard</Link>}
                    <button onClick={logout}>Logout</button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="login-btn">
                  Get Started
                </Link>
              )}
            </div>

            <div className="language-selector">
              <button className="lang-btn">
                EN <span className="arrow-down">▼</span>
              </button>
            </div>

            <Link to="/cart" className="cart-icon">
              <span className="cart-icon-svg">🛒</span>
              {cartItems.length > 0 && <span className="cart-count">{cartItems.length}</span>}
            </Link>
          </div>
        </div>
      </div>

      <nav className="main-nav">
        <div className="container">
          <div className="nav-container">
            <button className="mobile-menu-btn" onClick={toggleMenu}>
              ☰ Menu
            </button>

            <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
              {categories.map((category, index) => (
                <li key={index}>
                  <Link
                    to={category === "All Categories" ? "/" : `/category/${category}`}
                    className={category === "All Categories" ? "active" : ""}
                  >
                    {category}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/3d-try-on">3D Try on</Link>
              </li>
              <li>
                <Link to="/super-deals">SuperDeals</Link>
              </li>
              <li>
                <Link to="/new">New</Link>
              </li>
              <li className="more-dropdown">
                <button className="more-btn">
                  More <span className="arrow-down">▼</span>
                </button>
                <div className="more-menu">
                  <Link to="/brands">Brands</Link>
                  <Link to="/gift-cards">Gift Cards</Link>
                  <Link to="/sale">Sale</Link>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
