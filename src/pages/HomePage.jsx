"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import ProductCard from "../components/products/ProductCard"
import CategoryCard from "../components/categories/CategoryCard"
import productService from "../services/api/productService"
import categoryService from "../services/api/categoryService"
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
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0)
  const bannerIntervalRef = useRef(null)

  useEffect(() => {
    // Fetch real data from API
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Try to fetch sections from the API
        let sections = [];
        
        try {
          // Add timestamp to prevent caching
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/homepage/sections?_=${timestamp}`);
          if (response.ok) {
            const data = await response.json();
            sections = data;
            console.log('HomePage: Loaded sections from API:', sections);
            
            // Update localStorage with new data
            localStorage.setItem('homePageSections', JSON.stringify(sections));
          } else {
            // Fallback to localStorage if API fails
            const savedSections = localStorage.getItem('homePageSections');
            if (savedSections) {
              try {
                sections = JSON.parse(savedSections);
                console.log('HomePage: Loaded sections from localStorage:', sections);
              } catch (error) {
                console.error('Error parsing saved sections:', error);
                // Use default sections if parsing fails
                sections = getDefaultSections();
              }
            } else {
              // Use default sections if nothing in localStorage
              sections = getDefaultSections();
            }
          }
        } catch (error) {
          console.error('Error fetching sections from API:', error);
          // Fallback to localStorage
          const savedSections = localStorage.getItem('homePageSections');
          if (savedSections) {
            try {
              sections = JSON.parse(savedSections);
              console.log('HomePage: Loaded sections from localStorage:', sections);
            } catch (error) {
              console.error('Error parsing saved sections:', error);
              // Use default sections if parsing fails
              sections = getDefaultSections();
            }
          } else {
            // Use default sections if nothing in localStorage
            sections = getDefaultSections();
          }
        }
        
        // Set sections and process them
        setHomePageSections(sections)

        // Fetch real products from API with cache-busting
        try {
          const productsResponse = await productService.getAllProducts({ 
            limit: 10,
            _: new Date().getTime() // Add timestamp to prevent caching
          });
          console.log("Products from API:", productsResponse)
          setBrowseProducts(productsResponse.products || [])
        } catch (apiError) {
          console.error("Error fetching all products:", apiError)
          setBrowseProducts([])
        }
          
        // Featured products for flash sale with cache-busting
        try {
          const featuredProductsResponse = await productService.getFeaturedProducts(8, {
            _: new Date().getTime() // Add timestamp to prevent caching
          });
          console.log("Featured products from API:", featuredProductsResponse)
          setFlashSaleProducts(featuredProductsResponse.products || [])
        } catch (apiError) {
          console.error("Error fetching featured products:", apiError)
          if (sections.some(s => s.type === "products" && s.active)) {
            processHomepageSections(sections.filter(s => s.type === "products"))
          }
        }
          
        // New arrivals with cache-busting
        try {
          const newArrivalsResponse = await productService.getNewArrivals(4, {
            _: new Date().getTime() // Add timestamp to prevent caching
          });
          console.log("New arrivals from API:", newArrivalsResponse)
          setTrendingProducts(newArrivalsResponse.products || [])
        } catch (apiError) {
          console.error("Error fetching new arrivals:", apiError)
          setTrendingProducts([])
        }
          
        // Categories with cache-busting
        try {
          const categoriesResponse = await categoryService.getFeaturedCategories(4, {
            _: new Date().getTime() // Add timestamp to prevent caching
          });
          console.log("Categories from API:", categoriesResponse)
          if (categoriesResponse.categories && categoriesResponse.categories.length > 0) {
            setCategories(categoriesResponse.categories || [])
          } else if (sections.some(s => s.type === "categories" && s.active)) {
            processHomepageSections(sections.filter(s => s.type === "categories"))
          }
        } catch (apiError) {
          console.error("Error fetching categories:", apiError)
          if (sections.some(s => s.type === "categories" && s.active)) {
            processHomepageSections(sections.filter(s => s.type === "categories"))
          }
        }
          
        // Icon categories with cache-busting
        try {
          const topCategoriesResponse = await categoryService.getTopLevelCategories({
            _: new Date().getTime() // Add timestamp to prevent caching
          });
          console.log("Top categories from API:", topCategoriesResponse)
          
          if (topCategoriesResponse.categories && topCategoriesResponse.categories.length > 0) {
            const transformedIconCategories = topCategoriesResponse.categories.map(cat => ({
              name: cat.name,
              imageUrl: cat.image || '/placeholder.svg',
              link: `/category/${cat.slug || cat._id}`
            }))
            
            setIconCategories(transformedIconCategories)
          } else if (sections.some(s => s.type === "icon-categories" && s.active)) {
            processHomepageSections(sections.filter(s => s.type === "icon-categories"))
          }
        } catch (apiError) {
          console.error("Error fetching top categories:", apiError)
          if (sections.some(s => s.type === "icon-categories" && s.active)) {
            processHomepageSections(sections.filter(s => s.type === "icon-categories"))
          }
        }
          
        // Process banner data
        if (sections.some(s => s.type === "banner" && s.active)) {
          processHomepageSections(sections.filter(s => s.type === "banner"))
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        processHomepageSections(getDefaultSections())
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Cleanup function
    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    }
  }, [])
  
  // Set up banner auto-rotation when bannerData changes
  useEffect(() => {
    if (bannerData && Array.isArray(bannerData.slides) && bannerData.slides.length > 1) {
      // Clear any existing interval
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
      
      // Set up auto-rotation every 5 seconds
      bannerIntervalRef.current = setInterval(() => {
        setCurrentBannerSlide(prevSlide => (prevSlide + 1) % bannerData.slides.length);
      }, 5000);
      
      // Clear interval on unmount
      return () => {
        if (bannerIntervalRef.current) {
          clearInterval(bannerIntervalRef.current);
        }
      };
    }
  }, [bannerData]);
  
  // Helper function to get default sections if nothing in localStorage
  const getDefaultSections = () => {
    return [
      {
        id: 1,
        title: "Main Banner",
        type: "banner",
        content: {
          slides: [
            {
              imageUrl: "/placeholder.svg?height=400&width=800",
              title: "Season Sale",
              subtitle: "Special Offer",
              buttonText: "Shop Now",
              buttonLink: "/sale",
            },
            {
              imageUrl: "/placeholder.svg?height=400&width=800",
              title: "New Arrivals",
              subtitle: "Check out our latest products",
              buttonText: "Shop Now",
              buttonLink: "/new",
            }
          ]
        },
        order: 1,
        active: true,
      },
      {
        id: 2,
        title: "Trending Categories",
        type: "categories",
        content: {
          categories: [
            { name: "Furniture", description: "in your style", imageUrl: "/placeholder.svg?height=200&width=200" },
            { name: "Lamp", description: "in your environment", imageUrl: "/placeholder.svg?height=200&width=200" },
            { name: "Your skincare", description: "experts", imageUrl: "/placeholder.svg?height=200&width=200" },
            { name: "Humidifier", description: "relief your skin", imageUrl: "/placeholder.svg?height=200&width=200" },
          ]
        },
        order: 2,
        active: true,
      },
      {
        id: 3,
        title: "Flash Sale",
        type: "products",
        content: {
          productIds: [1, 2, 3, 4, 5, 6, 7, 8],
        },
        order: 3,
        active: true,
      },
      {
        id: 4,
        title: "Category Icons", 
        type: "icon-categories",
        content: {
          categories: [
            { name: "Mobile & Devices", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/mobile-devices" },
            { name: "Watch", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/watch" },
            { name: "Accessories", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/accessories" },
            { name: "Home & Decor", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/home-decor" },
            { name: "Fashion", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/fashion" },
            { name: "Beauty", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/beauty" },
            { name: "Skin care product", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/skincare" },
            { name: "Skin care", imageUrl: "/placeholder.svg?height=50&width=50", link: "/category/skincare-2" },
          ]
        },
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
        // Handle both string content (from localStorage) and object content (from API)
        const contentObj = typeof section.content === 'string' 
          ? JSON.parse(section.content) 
          : section.content;
          
        console.log(`Processing section ${section.id} (${section.type}):`, contentObj)
        
        if (section.type === "banner") {
          // Convert old format to new format if needed
          if (!contentObj.slides && contentObj.image) {
            setBannerData({
              slides: [{
                imageUrl: contentObj.image,
                title: contentObj.title,
                subtitle: contentObj.subtitle,
                buttonText: contentObj.buttonText,
                buttonLink: contentObj.buttonLink
              }]
            })
          } else {
            setBannerData(contentObj)
          }
          console.log("Banner data set:", contentObj)
        } else if (section.type === "categories") {
          if (contentObj.categories) {
            // Transform categories data to match expected format
            const transformedCategories = contentObj.categories.map((cat, index) => ({
              id: cat.id || index + 1,
              name: cat.name,
              description: cat.description,
              image: cat.imageUrl || cat.image
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
            // Update to use images instead of icons/emoji
            const transformedIconCategories = contentObj.categories.map(cat => ({
              name: cat.name,
              imageUrl: cat.imageUrl || cat.image || '/placeholder.svg',
              link: cat.link
            }))
            setIconCategories(transformedIconCategories)
            console.log("Icon categories set:", transformedIconCategories)
          }
        }
      } catch (error) {
        console.error(`Error processing section ${section.id}:`, error)
      }
    })
  }

  // Function to handle slider nav dots click
  const handleSliderDotClick = (index) => {
    setCurrentBannerSlide(index);
  };

  // Helper function to render slider dots
  const renderSliderDots = (count, activeIndex = 0) => {
    return (
      <div className="slider-dots">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`slider-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => handleSliderDotClick(index)}
          ></div>
        ))}
      </div>
    );
  };

  // Function to handle banner slider navigation
  const handleBannerNavigation = (direction) => {
    if (bannerData && Array.isArray(bannerData.slides)) {
      const slideCount = bannerData.slides.length;
      
      if (direction === 'prev') {
        setCurrentBannerSlide(prevSlide => (prevSlide - 1 + slideCount) % slideCount);
      } else {
        setCurrentBannerSlide(prevSlide => (prevSlide + 1) % slideCount);
      }
    }
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
        if (!bannerData.slides || bannerData.slides.length === 0) return null;
        
        // Get slides with circular indexing
        const slideCount = bannerData.slides.length;
        const prevIndex = (currentBannerSlide - 1 + slideCount) % slideCount;
        const nextIndex = (currentBannerSlide + 1) % slideCount;
        
        const prevSlide = bannerData.slides[prevIndex];
        const currentSlide = bannerData.slides[currentBannerSlide];
        const nextSlide = bannerData.slides[nextIndex];
        
        console.log("Rendering circular banner carousel");
        
        return (
          <section key={section.id} className="banner-section">
            <div className="circular-banner-container">
              <div className="circular-slides-wrapper">
                {/* Previous slide (left side, partially visible) */}
                <div className="circular-slide prev-slide" onClick={() => handleBannerNavigation('prev')}>
                  <img src={prevSlide.imageUrl} alt="Previous" />
                </div>
                
                {/* Current slide (center, fully visible) */}
                <div className="circular-slide current-slide">
                  <img src={currentSlide.imageUrl} alt={currentSlide.title} />
                  <div className="banner-content">
                    <h1>{currentSlide.title}</h1>
                    <p>{currentSlide.subtitle}</p>
                    {currentSlide.buttonText && (
                      <Link to={currentSlide.buttonLink || "#"} className="banner-btn">
                        {currentSlide.buttonText}
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* Next slide (right side, partially visible) */}
                <div className="circular-slide next-slide" onClick={() => handleBannerNavigation('next')}>
                  <img src={nextSlide.imageUrl} alt="Next" />
                </div>
              </div>
              
              {/* Navigation controls */}
              {bannerData.slides && bannerData.slides.length > 1 && (
                <>
                  <button 
                    className="banner-nav prev" 
                    onClick={() => handleBannerNavigation('prev')}
                    aria-label="Previous slide"
                  >
                    ‹
                  </button>
                  <button 
                    className="banner-nav next" 
                    onClick={() => handleBannerNavigation('next')}
                    aria-label="Next slide"
                  >
                    ›
                  </button>
                  
                  {/* Add slider dots for navigation */}
                  {renderSliderDots(bannerData.slides.length, currentBannerSlide)}
                </>
              )}
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
                  <CategoryCard key={category.id || category._id} category={category} />
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
                <button 
                  className="slider-arrow prev" 
                  onClick={() => handleSliderScroll('left', 'products')}
                  aria-label="Previous products"
                >‹</button>
                <div className="products-grid">
                  {flashSaleProducts.map((product) => (
                    <ProductCard key={product.id || product._id} product={product} />
                  ))}
                </div>
                <button 
                  className="slider-arrow next" 
                  onClick={() => handleSliderScroll('right', 'products')}
                  aria-label="Next products"
                >›</button>
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
                <button 
                  className="slider-arrow prev" 
                  onClick={() => handleSliderScroll('left', 'categories')}
                  aria-label="Previous categories"
                >‹</button>
                <div className="category-grid">
                  {iconCategories.map((category, index) => (
                    <Link to={category.link} className="category-item" key={index}>
                      <div className="category-icon">
                        <img src={category.imageUrl} alt={category.name} />
                      </div>
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
                <button 
                  className="slider-arrow next" 
                  onClick={() => handleSliderScroll('right', 'categories')}
                  aria-label="Next categories"
                >›</button>
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
                <ProductCard key={product.id || product._id} product={product} />
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
              
              <h3>Current Banner Slide:</h3>
              <pre>{currentBannerSlide}</pre>
              
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
