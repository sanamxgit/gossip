"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import ProductCard from "../components/products/ProductCard"
import "./CategoryPage.css"

const CategoryPage = () => {
  const { category } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    sortBy: "popularity",
  })

  useEffect(() => {
    // In a real app, fetch products from API based on category
    const fetchProducts = async () => {
      setLoading(true)
      try {
        // Simulate API call
        setTimeout(() => {
          // Mock products
          const mockProducts = Array(12)
            .fill()
            .map((_, index) => ({
              id: index + 1,
              name: `${category} Product ${index + 1}`,
              price: Math.floor(Math.random() * 9000) + 1000, // Random price between 1000 and 10000 cents
              originalPrice: Math.floor(Math.random() * 12000) + 10000, // Random original price
              image: "/placeholder.svg?height=200&width=200",
              sold: Math.floor(Math.random() * 50) + 1,
              arIosUrl: "https://example.com/ar/ios/product.usdz",
              arAndroidUrl: "https://example.com/ar/android/product.glb",
            }))

          setProducts(mockProducts)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching products:", error)
        setLoading(false)
      }
    }

    fetchProducts()
  }, [category])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePriceRangeChange = (e, index) => {
    const value = Number.parseInt(e.target.value)
    setFilters((prev) => {
      const newPriceRange = [...prev.priceRange]
      newPriceRange[index] = value
      return {
        ...prev,
        priceRange: newPriceRange,
      }
    })
  }

  const filteredProducts = () => {
    let result = [...products]

    // Filter by price range
    result = result.filter(
      (product) => product.price >= filters.priceRange[0] * 100 && product.price <= filters.priceRange[1] * 100,
    )

    // Sort products
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "newest":
        // In a real app, would sort by date
        result.sort((a, b) => b.id - a.id)
        break
      case "popularity":
      default:
        result.sort((a, b) => b.sold - a.sold)
        break
    }

    return result
  }

  if (loading) {
    return (
      <div className="category-page loading">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="category-page">
      <div className="container">
        <div className="category-header">
          <h1>{category}</h1>
          <p>{products.length} products found</p>
        </div>

        <div className="category-content">
          <div className="filters-sidebar">
            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-range">
                <div className="price-inputs">
                  <div className="price-input">
                    <label>Min</label>
                    <div className="input-with-prefix">
                      <span>$</span>
                      <input
                        type="number"
                        value={filters.priceRange[0]}
                        onChange={(e) => handlePriceRangeChange(e, 0)}
                        min="0"
                        max={filters.priceRange[1]}
                      />
                    </div>
                  </div>
                  <div className="price-input">
                    <label>Max</label>
                    <div className="input-with-prefix">
                      <span>$</span>
                      <input
                        type="number"
                        value={filters.priceRange[1]}
                        onChange={(e) => handlePriceRangeChange(e, 1)}
                        min={filters.priceRange[0]}
                      />
                    </div>
                  </div>
                </div>
                <div className="price-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.priceRange[0] / 100}
                    onChange={(e) => handlePriceRangeChange(e, 0)}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.priceRange[1] / 100}
                    onChange={(e) => handlePriceRangeChange(e, 1)}
                  />
                </div>
              </div>
            </div>

            <div className="filter-section">
              <h3>AR Features</h3>
              <div className="checkbox-filter">
                <label>
                  <input type="checkbox" defaultChecked />
                  AR Compatible
                </label>
              </div>
            </div>
          </div>

          <div className="products-container">
            <div className="products-header">
              <div className="sort-by">
                <label>Sort by:</label>
                <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="products-grid">
              {filteredProducts().map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryPage
