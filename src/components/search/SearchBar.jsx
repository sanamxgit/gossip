import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../../services/api/productService';
import './SearchBar.css';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsLoading(true);
        try {
          const response = await productService.searchProducts(searchTerm);
          setSearchResults(response.products || []);
        } catch (error) {
          console.error('Error searching products:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products/search?q=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
      setSearchTerm('');
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search products..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          <i className="fas fa-search"></i>
        </button>
      </form>

      {showResults && (searchResults.length > 0 || isLoading) && (
        <div className="search-results">
          {isLoading ? (
            <div className="search-loading">Loading...</div>
          ) : (
            <>
              {searchResults.map((product) => (
                <div
                  key={product._id}
                  className="search-result-item"
                  onClick={() => handleProductClick(product._id)}
                >
                  <img
                    src={product.images[0] || '/placeholder.svg'}
                    alt={product.title}
                    className="result-image"
                  />
                  <div className="result-info">
                    <h4>{product.title}</h4>
                    <p className="result-price">NPR {product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div
                  className="view-all-results"
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                    setShowResults(false);
                  }}
                >
                  View all results
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 