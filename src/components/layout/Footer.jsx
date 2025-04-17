import { Link } from "react-router-dom"
import "./Footer.css"

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Shop</h3>
            <ul>
              <li>
                <Link to="/category/all">All</Link>
              </li>
              <li>
                <Link to="/category/mobile-devices">Mobile & Devices</Link>
              </li>
              <li>
                <Link to="/category/watch">Watch</Link>
              </li>
              <li>
                <Link to="/category/accessories">Accessories</Link>
              </li>
              <li>
                <Link to="/category/home-decor">Home & Decor</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Order & Support</h3>
            <ul>
              <li>
                <Link to="/support">Support</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/shipping-returns">Shipping & Returns</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Info</h3>
            <ul>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/store-locator">Store Locator</Link>
              </li>
              <li>
                <Link to="/news">News</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Account</h3>
            <ul>
              <li>
                <Link to="/login">Log In</Link>
              </li>
              <li>
                <Link to="/register">Create an Account</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Follow Along</h3>
            <div className="social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <i className="social-icon">📷</i>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="social-icon">👍</i>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">
                <i className="social-icon">📌</i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="company-info">
            <p>gossipgoods.com ltd.</p>
            <p>© 2023-2024 All Rights Reserved</p>
          </div>

          <div className="ar-logo">
            <img src="/ar-logo.svg" alt="AR Logo" />
            <p>gossipgoods.com</p>
            <p className="ar-tagline">AUGMENT REALITY</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
