"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import HeroSlider from "../components/home/HeroSlider"
import ProductCard from "../components/products/ProductCard"
import CategoryCard from "../components/categories/CategoryCard"
import "./HomePage.css"

// Constants for UI behavior
const ENABLE_WRAP_AROUND = false; // Set to true to enable circular scrolling

const HomePage = () => {
  const [homePageSections, setHomePageSections] = useState([])
  const [trendingProducts, setTrendingProducts] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [iconCategories, setIconCategories] = useState([])
  const [browseProducts, setBrowseProducts] = useState([])
  const [bannerData, setBannerData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    // In a real app, fetch data from API
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Try to get sections from localStorage first
        const savedSections = localStorage.getItem('homePageSections')
        let sections = [];
        
        if (savedSections) {
          try {
            sections = JSON.parse(savedSections)
            console.log('HomePage: Loaded sections from localStorage:', sections)
          } catch (error) {
            console.error('Error parsing saved sections:', error)
            // Use default sections if parsing fails
            sections = getDefaultSections()
          }
        } else {
          // Use default sections if nothing in localStorage
          sections = getDefaultSections()
        }
        
        // Set sections and process them
        setHomePageSections(sections)
        processHomepageSections(sections)

        // Mock browse products (this won't change as it's not managed by admin)
        const mockBrowseProducts = Array(10)
          .fill()
          .map((_, index) => ({
            id: 100 + index,
            name: `Product name`,
            price: 9999,
            originalPrice: 11000,
            image: "/placeholder.svg?height=200&width=200",
            sold: 20,
            arIosUrl: "https://github.com/sanamxgit/untitled.usdz",
            arAndroidUrl: "https://example.com/ar/android/product1.glb",
          }))
        setBrowseProducts(mockBrowseProducts)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])
  
  // Helper function to get default sections if nothing in localStorage
  const getDefaultSections = () => {
    return [
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
          productIds: [1, 2, 3, 4, 5, 6, 7, 8],
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
            { name: "Accessories", icon: "🎧", link: "/category/accessories" },
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
    ];
  }
  
  // Helper function to process homepage sections data
  const processHomepageSections = (sections) => {
    console.log("Processing homepage sections:", sections)
    
    sections.forEach(section => {
      if (!section.active) return
      
      try {
        const contentObj = JSON.parse(section.content)
        console.log(`Processing section ${section.id} (${section.type}):`, contentObj)
        
        if (section.type === "banner") {
          setBannerData(contentObj)
          console.log("Banner data set:", contentObj)
        } else if (section.type === "categories") {
          if (contentObj.categories) {
            // Transform categories data to match expected format
            const transformedCategories = contentObj.categories.map((cat, index) => ({
              id: index + 1,
              name: cat.name,
              description: cat.description,
              image: cat.image
            }))
            setCategories(transformedCategories)
            console.log("Categories set:", transformedCategories)
          }
        } else if (section.type === "products") {
          // In a real app, you would fetch product details based on productIds
          // For now, generate mock data for products in the flash sale
          if (contentObj.productIds) {
            const mockProducts = contentObj.productIds.map(id => ({
              id,
              name: `Product ${id}`,
              price: 9999,
              originalPrice: 11000,
              image: "/placeholder.svg?height=200&width=200",
              sold: 20,
              arIosUrl: "https://github.com/sanamxgit/models/untitled.usdz",
              arAndroidUrl: "https://example.com/ar/android/untitled.glb",
            }))
            setFlashSaleProducts(mockProducts)
            console.log("Flash sale products set:", mockProducts)
          }
        } else if (section.type === "icon-categories") {
          if (contentObj.categories) {
            setIconCategories(contentObj.categories)
            console.log("Icon categories set:", contentObj.categories)
          }
        }
      } catch (error) {
        console.error(`Error processing section ${section.id}:`, error)
      }
    })
  }

  // Helper function to render slider dots
  const renderSliderDots = (count, activeIndex = 0) => {
    return (
      <div className="slider-dots">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`slider-dot ${index === activeIndex ? 'active' : ''}`}
            // onClick would handle changing the active slide in a real implementation
          ></div>
        ))}
      </div>
    );
  };

  // Function to handle slider arrow clicks for horizontal scrolling
  const handleSliderScroll = (direction, sliderType) => {
    const sliderSelector = sliderType === 'products' ? '.products-grid' : '.category-grid';
    const slider = document.querySelector(sliderSelector);
    
    if (!slider) return;
    
    const cardWidth = sliderType === 'products' 
      ? slider.querySelector('.product-card')?.offsetWidth || 0
      : slider.querySelector('.category-icon')?.offsetWidth || 0;
    
    const gap = 20; // Gap between items
    
    // Number of items to scroll at once
    const itemsToScroll = sliderType === 'products' ? 2 : 4;
    
    // Calculate scroll amount based on card width, gap, and number of items
    const scrollAmount = (cardWidth + gap) * itemsToScroll;
    
    // Check if we're at the end or beginning to enable wrap-around scrolling
    const isAtEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 50;
    const isAtStart = slider.scrollLeft <= 50;
    
    if (direction === 'left') {
      if (isAtStart && ENABLE_WRAP_AROUND) {
        slider.scrollTo({ left: slider.scrollWidth, behavior: 'smooth' });
      } else {
        slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    } else {
      if (isAtEnd && ENABLE_WRAP_AROUND) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
    
    // For debugging
    console.log(`Scrolling ${direction} by ${scrollAmount}px for ${sliderType}`);
  };

  // Helper function to render sections in order
  const renderSections = () => {
    if (!homePageSections.length) return null
    
    console.log("Rendering sections with data:", {
      bannerData,
      categories,
      flashSaleProducts,
      iconCategories
    })
    
    // Sort sections by order
    const sortedSections = [...homePageSections]
      .filter(section => section.active)
      .sort((a, b) => a.order - b.order)
    
    return sortedSections.map(section => {
      if (section.type === "banner" && bannerData) {
        console.log("Rendering banner with image:", bannerData.image)
        return (
          <section key={section.id} className="banner-section">
            <div className="custom-banner" style={{ backgroundImage: `url(${bannerData.image})` }}>
              <div className="container">
                <div className="banner-content">
                  <h1>{bannerData.title}</h1>
                  <p>{bannerData.subtitle}</p>
                  {bannerData.buttonText && (
                    <Link to={bannerData.buttonLink || "#"} className="banner-btn">
                      {bannerData.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )
      } else if (section.type === "categories" && categories.length > 0) {
        return (
          <section key={section.id} className="trending-section">
            <div className="container">
              <h2 className="section-title">{section.title}</h2>
              <div className="trending-categories">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          </section>
        )
      } else if (section.type === "products" && flashSaleProducts.length > 0) {
        // Calculate how many dots we need (assuming 4 items per view)
        const dotsCount = Math.ceil(flashSaleProducts.length / 4);
        
        return (
          <section key={section.id} className="flash-sale-section">
            <div className="container">
              <h2 className="section-title">{section.title}</h2>
              <div className="products-slider">
                <button className="slider-arrow prev" onClick={(e) => handleSliderScroll('left', 'products')}>‹</button>
                <div className="products-grid">
                  {flashSaleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <button className="slider-arrow next" onClick={(e) => handleSliderScroll('right', 'products')}>›</button>
                {/* Add the slider dots */}
                {renderSliderDots(dotsCount)}
              </div>
            </div>
          </section>
        )
      } else if (section.type === "icon-categories" && iconCategories.length > 0) {
        return (
          <section key={section.id} className="categories-section">
            <div className="container">
              <h2 className="section-title">{section.title}</h2>
              <div className="category-icons">
                <button className="slider-arrow prev" onClick={(e) => handleSliderScroll('left', 'categories')}>‹</button>
                <div className="category-grid">
                  {iconCategories.map((category, index) => (
                    <Link to={category.link} className="category-item" key={index}>
                      <div className="category-icon">{category.icon}</div>
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
                <button className="slider-arrow next" onClick={(e) => handleSliderScroll('right', 'categories')}>›</button>
              </div>
            </div>
          </section>
        )
      }
      return null
    })
  }

  return (
    <div className="home-page">
      {/* Render dynamic sections */}
      {renderSections()}

      {/* Static sections that don't change via admin UI */}
      <section className="browse-section">
        <div className="container">
          <h2 className="section-title">Browse</h2>
          <div className="browse-products">
            <div className="products-grid">
              {browseProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="view-more-container">
              <Link to="/products" className="view-more-btn">
                View More
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Debug section - hidden by default */}
      <div className="debug-toggle">
        <button onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      {showDebug && (
        <section className="debug-section">
          <div className="container">
            <h2>Debug Information</h2>
            <div className="debug-actions">
              <button onClick={() => {
                localStorage.removeItem('homePageSections');
                window.location.reload();
              }}>
                Clear localStorage & Reload
              </button>
            </div>
            <div className="debug-data">
              <h3>Banner Data:</h3>
              <pre>{JSON.stringify(bannerData, null, 2)}</pre>
              
              <h3>Categories:</h3>
              <pre>{JSON.stringify(categories, null, 2)}</pre>
              
              <h3>Flash Sale Products:</h3>
              <pre>{JSON.stringify(flashSaleProducts, null, 2)}</pre>
              
              <h3>Icon Categories:</h3>
              <pre>{JSON.stringify(iconCategories, null, 2)}</pre>
              
              <h3>Raw Homepage Sections:</h3>
              <pre>{JSON.stringify(homePageSections, null, 2)}</pre>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage
