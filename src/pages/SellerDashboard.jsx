"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "./SellerDashboard.css"

const SellerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
  })
  const [activeTab, setActiveTab] = useState("products")
  const [isLoading, setIsLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [productFormData, setProductFormData] = useState({
    id: null,
    title: "",
    price: "",
    description: "",
    category: "",
    stock: "",
    arIosUrl: "",
    arAndroidUrl: "",
  })

  useEffect(() => {
    // Check if user is a seller
    if (!user || user.role !== "seller") {
      navigate("/login")
      return
    }

    // Fetch seller data
    fetchSellerData()
  }, [user, navigate])

  const fetchSellerData = async () => {
    setIsLoading(true)
    try {
      // In a real app, fetch data from API
      // Simulate API calls
      setTimeout(() => {
        // Mock products
        const mockProducts = Array(5)
          .fill()
          .map((_, index) => ({
            id: index + 1,
            title: `Product ${index + 1}`,
            price: 9999,
            description: "Product description goes here.",
            category: "Home & Decor",
            stock: 20,
            sold: 10,
            image: "/placeholder.svg?height=100&width=100",
            arIosUrl: "https://example.com/ar/ios/product.usdz",
            arAndroidUrl: "https://example.com/ar/android/product.glb",
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          }))
        setProducts(mockProducts)

        // Mock orders
        const mockOrders = Array(3)
          .fill()
          .map((_, index) => ({
            id: index + 1,
            customer: `Customer ${index + 1}`,
            products: mockProducts.slice(0, Math.floor(Math.random() * 3) + 1),
            total: (Math.floor(Math.random() * 5) + 1) * 9999,
            status: ["Pending", "Shipped", "Delivered"][Math.floor(Math.random() * 3)],
            date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          }))
        setOrders(mockOrders)

        // Mock stats
        setStats({
          totalSales: mockOrders.reduce((sum, order) => sum + order.total, 0),
          totalOrders: mockOrders.length,
          pendingOrders: mockOrders.filter((order) => order.status === "Pending").length,
          totalProducts: mockProducts.length,
        })

        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching seller data:", error)
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleAddProduct = () => {
    setProductFormData({
      id: null,
      title: "",
      price: "",
      description: "",
      category: "",
      stock: "",
      arIosUrl: "",
      arAndroidUrl: "",
    })
    setShowProductForm(true)
  }

  const handleEditProduct = (product) => {
    setProductFormData({
      id: product.id,
      title: product.title,
      price: product.price / 100, // Convert cents to dollars for form
      description: product.description,
      category: product.category,
      stock: product.stock,
      arIosUrl: product.arIosUrl,
      arAndroidUrl: product.arAndroidUrl,
    })
    setShowProductForm(true)
  }

  const handleDeleteProduct = (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      // In a real app, make API call to delete product
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== productId))
    }
  }

  const handleProductFormChange = (e) => {
    const { name, value } = e.target
    setProductFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProductFormSubmit = (e) => {
    e.preventDefault()

    // Validate form
    if (!productFormData.title || !productFormData.price || !productFormData.stock) {
      alert("Please fill in all required fields")
      return
    }

    // Convert price to cents
    const priceInCents = Math.round(Number.parseFloat(productFormData.price) * 100)

    if (productFormData.id) {
      // Update existing product
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === productFormData.id
            ? {
                ...p,
                title: productFormData.title,
                price: priceInCents,
                description: productFormData.description,
                category: productFormData.category,
                stock: Number.parseInt(productFormData.stock),
                arIosUrl: productFormData.arIosUrl,
                arAndroidUrl: productFormData.arAndroidUrl,
              }
            : p,
        ),
      )
    } else {
      // Add new product
      const newProduct = {
        id: Date.now(),
        title: productFormData.title,
        price: priceInCents,
        description: productFormData.description,
        category: productFormData.category,
        stock: Number.parseInt(productFormData.stock),
        sold: 0,
        image: "/placeholder.svg?height=100&width=100",
        arIosUrl: productFormData.arIosUrl,
        arAndroidUrl: productFormData.arAndroidUrl,
        createdAt: new Date().toISOString(),
      }

      setProducts((prevProducts) => [...prevProducts, newProduct])
    }

    setShowProductForm(false)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price / 100)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="seller-dashboard loading">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="seller-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Seller Dashboard</h1>
          <p>Welcome back, {user?.username || "Seller"}</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{formatPrice(stats.totalSales)}</div>
            <div className="stat-label">Total Sales</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingOrders}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            Products
          </button>
          <button
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => handleTabChange("orders")}
          >
            Orders
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleTabChange("settings")}
          >
            Store Settings
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "products" && (
            <div className="products-tab">
              <div className="tab-header">
                <h2>Your Products</h2>
                <button className="add-btn" onClick={handleAddProduct}>
                  Add New Product
                </button>
              </div>

              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Sold</th>
                      <th>Category</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.title}
                            className="product-thumbnail"
                          />
                        </td>
                        <td>{product.title}</td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>{product.sold}</td>
                        <td>{product.category}</td>
                        <td>{formatDate(product.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => handleEditProduct(product)}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="orders-tab">
              <h2>Recent Orders</h2>

              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Products</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{order.products.map((p) => p.title).join(", ")}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                        </td>
                        <td>{formatDate(order.date)}</td>
                        <td>
                          <button className="view-btn">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-tab">
              <h2>Store Settings</h2>

              <form className="settings-form">
                <div className="form-group">
                  <label>Store Name</label>
                  <input type="text" defaultValue={user?.storeName || "My Store"} />
                </div>

                <div className="form-group">
                  <label>Store Description</label>
                  <textarea
                    rows="4"
                    defaultValue="Welcome to my store! We sell high-quality products at affordable prices."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Store Logo</label>
                  <div className="logo-upload">
                    <img src="/placeholder.svg?height=100&width=100" alt="Store Logo" />
                    <button type="button">Upload New Logo</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Contact Email</label>
                  <input type="email" defaultValue={user?.email || "seller@example.com"} />
                </div>

                <div className="form-group">
                  <label>Business Address</label>
                  <input type="text" defaultValue="123 Main St, City, Country" />
                </div>

                <div className="form-group">
                  <label>Payment Methods</label>
                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" defaultChecked /> Credit Card
                    </label>
                    <label>
                      <input type="checkbox" defaultChecked /> PayPal
                    </label>
                    <label>
                      <input type="checkbox" /> Bank Transfer
                    </label>
                  </div>
                </div>

                <button type="submit" className="save-btn">
                  Save Settings
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showProductForm && (
        <div className="product-form-modal">
          <div className="product-form-content">
            <button className="close-form-btn" onClick={() => setShowProductForm(false)}>
              ×
            </button>

            <h2>{productFormData.id ? "Edit Product" : "Add New Product"}</h2>

            <form onSubmit={handleProductFormSubmit}>
              <div className="form-group">
                <label>Product Title*</label>
                <input
                  type="text"
                  name="title"
                  value={productFormData.title}
                  onChange={handleProductFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Price (USD)*</label>
                <input
                  type="number"
                  name="price"
                  value={productFormData.price}
                  onChange={handleProductFormChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productFormData.description}
                  onChange={handleProductFormChange}
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select name="category" value={productFormData.category} onChange={handleProductFormChange}>
                  <option value="">Select Category</option>
                  <option value="Mobile & Devices">Mobile & Devices</option>
                  <option value="Watch">Watch</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Home & Decor">Home & Decor</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Skin care">Skin care</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stock Quantity*</label>
                <input
                  type="number"
                  name="stock"
                  value={productFormData.stock}
                  onChange={handleProductFormChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Product Images</label>
                <div className="image-upload">
                  <button type="button">Upload Images</button>
                  <p className="help-text">
                    You can upload up to 5 images. First image will be the main product image.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>AR Model for iOS (USDZ URL)</label>
                <input
                  type="text"
                  name="arIosUrl"
                  value={productFormData.arIosUrl}
                  onChange={handleProductFormChange}
                  placeholder="https://example.com/model.usdz"
                />
                <p className="help-text">URL to USDZ file for iOS AR Quick Look</p>
              </div>

              <div className="form-group">
                <label>AR Model for Android (GLB URL)</label>
                <input
                  type="text"
                  name="arAndroidUrl"
                  value={productFormData.arAndroidUrl}
                  onChange={handleProductFormChange}
                  placeholder="https://example.com/model.glb"
                />
                <p className="help-text">URL to GLB file for Android Scene Viewer</p>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowProductForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {productFormData.id ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerDashboard
