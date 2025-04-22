import React, { createContext, useState, useContext, useCallback } from 'react';
import { productService, categoryService, brandService } from '../services/api';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Products state
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch featured products
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch seller's products
  const fetchSellerProducts = useCallback(async () => {
    if (!user || user.role !== 'seller') return [];
    
    try {
      setLoading(true);
      const data = await productService.getSellerProducts();
      setSellerProducts(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch product by ID
  const fetchProductById = useCallback(async (productId) => {
    try {
      setLoading(true);
      const data = await productService.getProductById(productId);
      setCurrentProduct(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products by category
  const fetchProductsByCategory = useCallback(async (categoryId) => {
    try {
      setLoading(true);
      const data = await productService.getProductsByCategory(categoryId);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new product
  const createProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      const newProduct = await productService.createProduct(productData);
      setProducts(prevProducts => [...prevProducts, newProduct]);
      setSellerProducts(prevProducts => [...prevProducts, newProduct]);
      return newProduct;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update product
  const updateProduct = useCallback(async (productId, productData) => {
    try {
      setLoading(true);
      const updatedProduct = await productService.updateProduct(productId, productData);
      
      // Update products state
      setProducts(prevProducts => 
        prevProducts.map(p => p._id === productId ? updatedProduct : p)
      );
      
      // Update seller products state
      setSellerProducts(prevProducts => 
        prevProducts.map(p => p._id === productId ? updatedProduct : p)
      );
      
      // Update current product if it's the one being edited
      if (currentProduct && currentProduct._id === productId) {
        setCurrentProduct(updatedProduct);
      }
      
      return updatedProduct;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProduct]);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    try {
      setLoading(true);
      await productService.deleteProduct(productId);
      
      // Remove from products state
      setProducts(prevProducts => 
        prevProducts.filter(p => p._id !== productId)
      );
      
      // Remove from seller products state
      setSellerProducts(prevProducts => 
        prevProducts.filter(p => p._id !== productId)
      );
      
      // Clear current product if it's the one being deleted
      if (currentProduct && currentProduct._id === productId) {
        setCurrentProduct(null);
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentProduct]);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAllCategories();
      setCategories(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all brands
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const data = await brandService.getAllBrands();
      setBrands(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query) => {
    try {
      setLoading(true);
      const data = await productService.searchProducts(query);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = () => setError(null);

  const value = {
    products,
    featuredProducts,
    sellerProducts,
    categories,
    brands,
    currentProduct,
    loading,
    error,
    fetchProducts,
    fetchFeaturedProducts,
    fetchSellerProducts,
    fetchProductById,
    fetchProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchCategories,
    fetchBrands,
    searchProducts,
    clearError,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext; 