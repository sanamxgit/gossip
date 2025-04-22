"use client"

import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import "./AdminDashboard.css"

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [homePageSections, setHomePageSections] = useState([])
  const [activeTab, setActiveTab] = useState("homepage")
  const [isLoading, setIsLoading] = useState(true)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const fileInputRef = useRef(null)
  const [sectionFormData, setSectionFormData] = useState({
    id: null,
    title: "",
    type: "banner",
    content: "",
    order: 0,
    active: true,
  })
  
  // State for parsed content based on section type
  const [bannerData, setBannerData] = useState({
    image: "",
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "",
  })
  
  const [categoriesData, setCategoriesData] = useState({
    categories: [],
  })
  
  const [productsData, setProductsData] = useState({
    productIds: [],
  })
  
  const [iconCategoriesData, setIconCategoriesData] = useState({
    categories: [],
  })

  // Create refs for each category file input
  const categoryFileInputRefs = useRef([])

  useEffect(() => {
    // Check if user is an admin
    if (!user || user.role !== "admin") {
      navigate("/login")
      return
    }

    // Fetch admin data
    fetchAdminData()
  }, [user, navigate])

  // Save to localStorage whenever homePageSections changes
  useEffect(() => {
    if (homePageSections.length > 0) {
      localStorage.setItem('homePageSections', JSON.stringify(homePageSections))
      console.log('Saved homepage sections to localStorage:', homePageSections)
    }
  }, [homePageSections])

  useEffect(() => {
    // Parse content based on section type when sectionFormData changes
    if (sectionFormData.content && sectionFormData.type) {
      try {
        const contentObj = JSON.parse(sectionFormData.content)
        
        if (sectionFormData.type === "banner") {
          setBannerData(contentObj)
        } else if (sectionFormData.type === "categories") {
          setCategoriesData(contentObj)
        } else if (sectionFormData.type === "products") {
          setProductsData(contentObj)
        } else if (sectionFormData.type === "icon-categories") {
          setIconCategoriesData(contentObj)
        }
      } catch (error) {
        console.error("Error parsing content:", error)
      }
    }
  }, [sectionFormData.content, sectionFormData.type])

  const fetchAdminData = async () => {
    setIsLoading(true)
    try {
      // In a real app, fetch data from API
      // Simulate API calls
      setTimeout(() => {
        // Mock users
        const mockUsers = [
          {
            id: 1,
            email: "user@example.com",
            username: "User",
            role: "user",
            createdAt: new Date(Date.now() - 5000000000).toISOString(),
          },
          {
            id: 2,
            email: "seller@example.com",
            username: "Seller",
            role: "seller",
            storeName: "My Store",
            createdAt: new Date(Date.now() - 8000000000).toISOString(),
          },
          {
            id: 3,
            email: "admin@example.com",
            username: "Admin",
            role: "admin",
            createdAt: new Date(Date.now() - 10000000000).toISOString(),
          },
        ]
        setUsers(mockUsers)

        // Mock products
        const mockProducts = Array(5)
          .fill()
          .map((_, index) => ({
            id: index + 1,
            title: `Product ${index + 1}`,
            price: 9999,
            seller: "Seller",
            category: "Home & Decor",
            createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          }))
        setProducts(mockProducts)

        // Try to get homepage sections from localStorage first
        const savedSections = localStorage.getItem('homePageSections')
        
        if (savedSections) {
          try {
            const parsedSections = JSON.parse(savedSections)
            console.log('Loaded homepage sections from localStorage:', parsedSections)
            setHomePageSections(parsedSections)
            setIsLoading(false)
            return
          } catch (error) {
            console.error('Error parsing saved sections:', error)
          }
        }

        // Mock homepage sections (fallback if nothing in localStorage)
        const mockSections = [
          {
            id: 1,
            title: "Main Banner",
            type: "banner",
            content: JSON.stringify({
              image: "/placeholder.svg?height=400&width=800",
              title: "Season Sale",
              subtitle: "Special Offer",
              buttonText: "Shop Now",
              buttonLink: "/sale",
            }),
            order: 1,
            active: true,
          },
          {
            id: 2,
            title: "Trending Categories",
            type: "categories",
            content: JSON.stringify({
              categories: [
                { name: "Furniture", description: "in your style", image: "/placeholder.svg?height=200&width=200" },
                { name: "Lamp", description: "in your environment", image: "/placeholder.svg?height=200&width=200" },
                { name: "Your skincare", description: "experts", image: "/placeholder.svg?height=200&width=200" },
                { name: "Humidifier", description: "relief your skin", image: "/placeholder.svg?height=200&width=200" },
              ],
            }),
            order: 2,
            active: true,
          },
          {
            id: 3,
            title: "Flash Sale",
            type: "products",
            content: JSON.stringify({
              productIds: [1, 2, 3, 4, 5],
            }),
            order: 3,
            active: true,
          },
          {
            id: 4,
            title: "Category Icons", 
            type: "icon-categories",
            content: JSON.stringify({
              categories: [
                { name: "Mobile & Devices", icon: "📱", link: "/category/mobile-devices" },
                { name: "Watch", icon: "⌚", link: "/category/watch" },
                { name: "Accessories", icon: "��", link: "/category/accessories" },
                { name: "Home & Decor", icon: "🏠", link: "/category/home-decor" },
                { name: "Fashion", icon: "👕", link: "/category/fashion" },
                { name: "Beauty", icon: "💄", link: "/category/beauty" },
                { name: "Skin care product", icon: "✨", link: "/category/skincare" },
                { name: "Skin care", icon: "🧴", link: "/category/skincare-2" },
              ]
            }),
            order: 4,
            active: true,
          }
        ]
        setHomePageSections(mockSections)

        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching admin data:", error)
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleAddSection = () => {
    setSectionFormData({
      id: null,
      title: "",
      type: "banner",
      content: "",
      order: homePageSections.length + 1,
      active: true,
    })
    
    // Reset form data for each type
    setBannerData({
      image: "",
      title: "",
      subtitle: "",
      buttonText: "",
      buttonLink: "",
    })
    
    setCategoriesData({
      categories: [],
    })
    
    setProductsData({
      productIds: [],
    })
    
    setIconCategoriesData({
      categories: [],
    })
    
    setShowSectionForm(true)
  }

  const handleEditSection = (section) => {
    setSectionFormData({
      id: section.id,
      title: section.title,
      type: section.type,
      content: section.content,
      order: section.order,
      active: section.active,
    })
    
    // Parse content based on section type
    try {
      const contentObj = JSON.parse(section.content)
      
      if (section.type === "banner") {
        setBannerData({
          image: contentObj.image || "",
          title: contentObj.title || "",
          subtitle: contentObj.subtitle || "",
          buttonText: contentObj.buttonText || "",
          buttonLink: contentObj.buttonLink || "",
        })
      } else if (section.type === "categories") {
        setCategoriesData({
          categories: contentObj.categories || [],
        })
      } else if (section.type === "products") {
        setProductsData({
          productIds: contentObj.productIds || [],
        })
      } else if (section.type === "icon-categories") {
        setIconCategoriesData({
          categories: contentObj.categories || [],
        })
      }
    } catch (error) {
      console.error("Error parsing section content:", error)
      
      // Reset form data for each type in case of error
      if (section.type === "banner") {
        setBannerData({
          image: "",
          title: "",
          subtitle: "",
          buttonText: "",
          buttonLink: "",
        })
      } else if (section.type === "categories") {
        setCategoriesData({
          categories: [],
        })
      } else if (section.type === "products") {
        setProductsData({
          productIds: [],
        })
      } else if (section.type === "icon-categories") {
        setIconCategoriesData({
          categories: [],
        })
      }
    }
    
    setShowSectionForm(true)
  }

  const handleDeleteSection = (sectionId) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      // In a real app, make API call to delete section
      setHomePageSections((prevSections) => prevSections.filter((s) => s.id !== sectionId))
    }
  }

  const handleToggleSection = (sectionId) => {
    setHomePageSections((prevSections) =>
      prevSections.map((section) => (section.id === sectionId ? { ...section, active: !section.active } : section)),
    )
  }

  const handleSectionFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setSectionFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
    
    // If section type changes, reset the appropriate form data
    if (name === "type") {
      if (value === "banner") {
        setBannerData({
          image: "",
          title: "",
          subtitle: "",
          buttonText: "",
          buttonLink: "",
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            image: "",
            title: "",
            subtitle: "",
            buttonText: "",
            buttonLink: "",
          })
        }))
      } else if (value === "categories") {
        setCategoriesData({
          categories: [],
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            categories: [],
          })
        }))
      } else if (value === "products") {
        setProductsData({
          productIds: [],
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            productIds: [],
          })
        }))
      } else if (value === "icon-categories") {
        setIconCategoriesData({
          categories: [],
        })
        setSectionFormData(prev => ({
          ...prev,
          content: JSON.stringify({
            categories: [],
          })
        }))
      } else {
        // For custom type, just reset content
        setSectionFormData(prev => ({
          ...prev,
          content: ""
        }))
      }
    }
  }
  
  // Handle banner data changes
  const handleBannerChange = (e) => {
    const { name, value } = e.target
    const updatedBanner = { ...bannerData, [name]: value }
    setBannerData(updatedBanner)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedBanner)
    }))
  }
  
  // Handle image upload for banner
  const handleBannerImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, upload the file to a server and get a permanent URL
      // For now, use a placeholder URL that can be recognized
      const fileName = file.name.replace(/\s+/g, '-').toLowerCase()
      const imageUrl = `/uploads/${fileName}` // This simulates a server-side stored image
      
      // For testing, we'll use a public placeholder that actually loads
      const demoUrl = `https://picsum.photos/800/400?random=${Date.now()}`
      
      const updatedBanner = { ...bannerData, image: demoUrl }
      setBannerData(updatedBanner)
      setSectionFormData(prev => ({
        ...prev,
        content: JSON.stringify(updatedBanner)
      }))
    }
  }
  
  // Handle category data changes
  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...categoriesData.categories]
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    }
    
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories }
    setCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Add new category
  const handleAddCategory = () => {
    const newCategory = {
      name: "New Category",
      description: "Description",
      image: "/placeholder.svg?height=200&width=200"
    }
    
    const updatedCategories = [...categoriesData.categories, newCategory]
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories }
    setCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Remove category
  const handleRemoveCategory = (index) => {
    const updatedCategories = [...categoriesData.categories]
    updatedCategories.splice(index, 1)
    
    const updatedCategoriesData = { ...categoriesData, categories: updatedCategories }
    setCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Handle image upload for category
  const handleCategoryImageUpload = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, upload the file to a server and get a permanent URL
      // For now, use a placeholder URL that can be recognized
      const fileName = file.name.replace(/\s+/g, '-').toLowerCase()
      const imageUrl = `/uploads/${fileName}` // This simulates a server-side stored image
      
      // For testing, we'll use a public placeholder that actually loads
      const demoUrl = `https://picsum.photos/200/200?random=${Date.now() + index}`
      
      handleCategoryChange(index, 'image', demoUrl)
    }
  }
  
  // Handle product selection for flash sale
  const handleProductSelectionChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value))
    const updatedProductsData = { ...productsData, productIds: selectedOptions }
    setProductsData(updatedProductsData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedProductsData)
    }))
  }

  const handleSectionFormSubmit = (e) => {
    e.preventDefault()

    // Validate form
    if (!sectionFormData.title || !sectionFormData.type) {
      alert("Please fill in all required fields")
      return
    }
    
    // Make sure content is properly set
    let updatedSectionFormData = { ...sectionFormData }
    
    // Set the content based on the current section type
    if (sectionFormData.type === "banner") {
      updatedSectionFormData.content = JSON.stringify(bannerData)
    } else if (sectionFormData.type === "categories") {
      updatedSectionFormData.content = JSON.stringify(categoriesData)
    } else if (sectionFormData.type === "products") {
      updatedSectionFormData.content = JSON.stringify(productsData)
    } else if (sectionFormData.type === "icon-categories") {
      updatedSectionFormData.content = JSON.stringify(iconCategoriesData)
    }

    if (sectionFormData.id) {
      // Update existing section
      setHomePageSections((prevSections) =>
        prevSections.map((s) => (s.id === sectionFormData.id ? updatedSectionFormData : s)),
      )
    } else {
      // Add new section
      const newSection = {
        ...updatedSectionFormData,
        id: Date.now(),
      }

      setHomePageSections((prevSections) => [...prevSections, newSection])
    }

    setShowSectionForm(false)
  }

  // Helper function to safely parse JSON
  const safeJsonParse = (jsonString, defaultValue = {}) => {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      console.error("Error parsing JSON:", error)
      return defaultValue
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Update refs when categories change
  useEffect(() => {
    // Initialize refs array with the correct length
    categoryFileInputRefs.current = Array(categoriesData.categories.length)
      .fill()
      .map((_, i) => categoryFileInputRefs.current[i] || React.createRef())
  }, [categoriesData.categories.length])

  // Handle category data changes for icon categories
  const handleIconCategoryChange = (index, field, value) => {
    const updatedCategories = [...iconCategoriesData.categories]
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    }
    
    const updatedCategoriesData = { ...iconCategoriesData, categories: updatedCategories }
    setIconCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Add new icon category
  const handleAddIconCategory = () => {
    const newCategory = {
      name: "New Category",
      icon: "🏷️",
      link: "/category/new"
    }
    
    const updatedCategories = [...iconCategoriesData.categories, newCategory]
    const updatedCategoriesData = { ...iconCategoriesData, categories: updatedCategories }
    setIconCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }
  
  // Remove icon category
  const handleRemoveIconCategory = (index) => {
    const updatedCategories = [...iconCategoriesData.categories]
    updatedCategories.splice(index, 1)
    
    const updatedCategoriesData = { ...iconCategoriesData, categories: updatedCategories }
    setIconCategoriesData(updatedCategoriesData)
    setSectionFormData(prev => ({
      ...prev,
      content: JSON.stringify(updatedCategoriesData)
    }))
  }

  if (isLoading) {
    return (
      <div className="admin-dashboard loading">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {user?.username || "Admin"}</p>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === "homepage" ? "active" : ""}`}
            onClick={() => handleTabChange("homepage")}
          >
            Homepage Editor
          </button>
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => handleTabChange("products")}
          >
            Products
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "homepage" && (
            <div className="homepage-tab">
              <div className="tab-header">
                <h2>Homepage Sections</h2>
                <div className="tab-actions">
                  <button className="reset-btn" onClick={() => {
                    if (window.confirm("Are you sure you want to reset all homepage sections to defaults? This cannot be undone.")) {
                      localStorage.removeItem('homePageSections');
                      fetchAdminData();
                    }
                  }}>
                    Reset to Defaults
                  </button>
                  <button className="add-btn" onClick={handleAddSection}>
                    Add New Section
                  </button>
                </div>
              </div>

              <div className="sections-list">
                {homePageSections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <div key={section.id} className={`section-item ${!section.active ? "inactive" : ""}`}>
                      <div className="section-info">
                        <h3>{section.title}</h3>
                        <div className="section-meta">
                          <span className="section-type">{section.type}</span>
                          <span className="section-order">Order: {section.order}</span>
                        </div>
                        
                        {/* Preview based on section type */}
                        <div className="section-preview">
                          {section.type === "banner" && section.content && (
                            <div className="banner-preview">
                              <img 
                                src={safeJsonParse(section.content).image || "/placeholder.svg"} 
                                alt="Banner preview" 
                                className="preview-image"
                              />
                              <div className="banner-text-preview">
                                <h4>{safeJsonParse(section.content).title || "Banner Title"}</h4>
                                <p>{safeJsonParse(section.content).subtitle || "Banner Subtitle"}</p>
                              </div>
                            </div>
                          )}
                          
                          {section.type === "categories" && section.content && (
                            <div className="categories-preview">
                              {safeJsonParse(section.content).categories?.slice(0, 3).map((cat, idx) => (
                                <div key={idx} className="category-item-preview">
                                  <img src={cat.image || "/placeholder.svg"} alt={cat.name} className="preview-image-small" />
                                  <span>{cat.name || "Category"}</span>
                                </div>
                              ))}
                              {safeJsonParse(section.content).categories?.length > 3 && 
                                <span>+{safeJsonParse(section.content).categories.length - 3} more</span>
                              }
                              {(!safeJsonParse(section.content).categories || safeJsonParse(section.content).categories.length === 0) && 
                                <span>No categories added</span>
                              }
                            </div>
                          )}
                          
                          {section.type === "products" && section.content && (
                            <div className="products-preview">
                              <span>{safeJsonParse(section.content).productIds?.length || 0} products selected</span>
                            </div>
                          )}
                          
                          {section.type === "icon-categories" && section.content && (
                            <div className="icon-categories-preview">
                              {safeJsonParse(section.content).categories?.slice(0, 4).map((cat, idx) => (
                                <div key={idx} className="icon-category-item-preview">
                                  <div className="preview-icon">{cat.icon || "🏷️"}</div>
                                  <span>{cat.name || "Category"}</span>
                                </div>
                              ))}
                              {safeJsonParse(section.content).categories?.length > 4 && 
                                <span>+{safeJsonParse(section.content).categories.length - 4} more</span>
                              }
                              {(!safeJsonParse(section.content).categories || safeJsonParse(section.content).categories.length === 0) && 
                                <span>No categories added</span>
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="section-actions">
                        <button
                          className={`toggle-btn ${section.active ? "active" : "inactive"}`}
                          onClick={() => handleToggleSection(section.id)}
                        >
                          {section.active ? "Active" : "Inactive"}
                        </button>
                        <button className="edit-btn" onClick={() => handleEditSection(section)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteSection(section.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-tab">
              <h2>User Management</h2>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>{user.role}</span>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn">Edit</button>
                            <button className="delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="products-tab">
              <h2>Product Management</h2>

              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Seller</th>
                      <th>Category</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.title}</td>
                        <td>Rs. {(product.price).toFixed(2)}</td>
                        <td>{product.seller}</td>
                        <td>{product.category}</td>
                        <td>{formatDate(product.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="edit-btn">Edit</button>
                            <button className="delete-btn">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSectionForm && (
        <div className="section-form-modal">
          <div className="section-form-content">
            <button className="close-form-btn" onClick={() => setShowSectionForm(false)}>
              ×
            </button>

            <h2>{sectionFormData.id ? "Edit Section" : "Add New Section"}</h2>

            <form onSubmit={handleSectionFormSubmit}>
              <div className="form-group">
                <label>Section Title*</label>
                <input
                  type="text"
                  name="title"
                  value={sectionFormData.title}
                  onChange={handleSectionFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Section Type*</label>
                <select name="type" value={sectionFormData.type} onChange={handleSectionFormChange} required>
                  <option value="banner">Banner</option>
                  <option value="categories">Categories</option>
                  <option value="products">Products</option>
                  <option value="icon-categories">Icon Categories</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  name="order"
                  value={sectionFormData.order}
                  onChange={handleSectionFormChange}
                  min="1"
                />
              </div>
              
              {/* Dynamic form fields based on section type */}
              {sectionFormData.type === "banner" && (
                <div className="banner-form">
                  <h3>Banner Content</h3>
                  
                  <div className="form-group image-upload-group">
                    <label>Banner Image*</label>
                    <div className="image-preview-container">
                      {bannerData.image && (
                        <img src={bannerData.image} alt="Banner preview" className="image-preview" />
                      )}
                    </div>
                    <div className="image-upload-controls">
                      <input
                        type="text"
                        name="image"
                        value={bannerData.image}
                        onChange={handleBannerChange}
                        placeholder="Image URL"
                      />
                      <div className="upload-btn-wrapper">
                        <button type="button" className="upload-btn" onClick={() => fileInputRef.current.click()}>
                          Upload Image
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleBannerImageUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Banner Title*</label>
                    <input
                      type="text"
                      name="title"
                      value={bannerData.title}
                      onChange={handleBannerChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Banner Subtitle</label>
                    <input
                      type="text"
                      name="subtitle"
                      value={bannerData.subtitle}
                      onChange={handleBannerChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Button Text</label>
                    <input
                      type="text"
                      name="buttonText"
                      value={bannerData.buttonText}
                      onChange={handleBannerChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Button Link (URL)</label>
                    <input
                      type="text"
                      name="buttonLink"
                      value={bannerData.buttonLink}
                      onChange={handleBannerChange}
                    />
                  </div>
                </div>
              )}
              
              {sectionFormData.type === "categories" && (
                <div className="categories-form">
                  <h3>Categories Content</h3>
                  
                  <div className="categories-list">
                    {categoriesData.categories.map((category, index) => (
                      <div key={index} className="category-form-item">
                        <h4>Category {index + 1}</h4>
                        
                        <div className="form-group image-upload-group">
                          <label>Category Image*</label>
                          <div className="image-preview-container">
                            {category.image && (
                              <img src={category.image} alt="Category preview" className="image-preview-small" />
                            )}
                          </div>
                          <div className="image-upload-controls">
                            <input
                              type="text"
                              value={category.image}
                              onChange={(e) => handleCategoryChange(index, 'image', e.target.value)}
                              placeholder="Image URL"
                            />
                            <div className="upload-btn-wrapper">
                              <button 
                                type="button" 
                                className="upload-btn"
                                onClick={() => categoryFileInputRefs.current[index]?.click()}
                              >
                                Upload Image
                              </button>
                              <input
                                type="file"
                                ref={el => categoryFileInputRefs.current[index] = el}
                                onChange={(e) => handleCategoryImageUpload(index, e)}
                                accept="image/*"
                                style={{ display: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>Category Name*</label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Category Description</label>
                          <input
                            type="text"
                            value={category.description}
                            onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                          />
                        </div>
                        
                        <button 
                          type="button" 
                          className="remove-btn"
                          onClick={() => handleRemoveCategory(index)}
                        >
                          Remove Category
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="add-btn"
                      onClick={handleAddCategory}
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}
              
              {sectionFormData.type === "products" && (
                <div className="products-form">
                  <h3>Products Content</h3>
                  
                  <div className="form-group">
                    <label>Select Products for Flash Sale*</label>
                    <select 
                      multiple 
                      value={productsData.productIds}
                      onChange={handleProductSelectionChange}
                      className="product-multi-select"
                    >
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.title} - Rs. {(product.price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <p className="help-text">Hold Ctrl (or Cmd) to select multiple products</p>
                  </div>
                  
                  <div className="selected-products">
                    <h4>Selected Products ({productsData.productIds.length})</h4>
                    <ul className="selected-products-list">
                      {productsData.productIds.map(id => {
                        const product = products.find(p => p.id === id)
                        return product ? (
                          <li key={id}>{product.title} - Rs. {(product.price).toFixed(2)}</li>
                        ) : null
                      })}
                    </ul>
                  </div>
                </div>
              )}
              
              {sectionFormData.type === "icon-categories" && (
                <div className="icon-categories-form">
                  <h3>Icon Categories Content</h3>
                  
                  <div className="icon-categories-list">
                    {iconCategoriesData.categories.map((category, index) => (
                      <div key={index} className="icon-category-form-item">
                        <h4>Category {index + 1}</h4>
                        
                        <div className="form-group">
                          <label>Category Name*</label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => handleIconCategoryChange(index, 'name', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Icon (Emoji)*</label>
                          <input
                            type="text"
                            value={category.icon}
                            onChange={(e) => handleIconCategoryChange(index, 'icon', e.target.value)}
                            placeholder="Use emoji like 📱 or 🏠"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Link URL*</label>
                          <input
                            type="text"
                            value={category.link}
                            onChange={(e) => handleIconCategoryChange(index, 'link', e.target.value)}
                            placeholder="/category/name"
                            required
                          />
                        </div>
                        
                        <button 
                          type="button" 
                          className="remove-btn"
                          onClick={() => handleRemoveIconCategory(index)}
                        >
                          Remove Category
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="add-btn"
                      onClick={handleAddIconCategory}
                    >
                      Add Icon Category
                    </button>
                  </div>
                </div>
              )}
              
              {sectionFormData.type === "custom" && (
                <div className="form-group">
                  <label>Content (JSON)</label>
                  <textarea
                    name="content"
                    value={sectionFormData.content}
                    onChange={handleSectionFormChange}
                    rows="6"
                    placeholder={`Enter custom JSON content`}
                  ></textarea>
                  <p className="help-text">Enter content in JSON format for custom section</p>
                </div>
              )}

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={sectionFormData.active}
                    onChange={handleSectionFormChange}
                  />
                  Active
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowSectionForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {sectionFormData.id ? "Update Section" : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
