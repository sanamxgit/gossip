import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import categoryService from '../services/api/categoryService';
import axios from 'axios';
import { API_URL } from '../config';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchData()
    // Initialize default categories
    categoryService.initializeDefaultCategories()
      .then(response => {
        setCategories(response.data.categories || []);
      })
      .catch(error => {
        console.error('Error initializing categories:', error);
        setError('Failed to load categories');
      });
  }, [isAuthenticated, user, navigate])

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/users/sellers`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSellers(response.data.sellers || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setError('Failed to load sellers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySeller = async (sellerId, isVerified) => {
    try {
      await axios.patch(`${API_URL}/api/users/sellers/${sellerId}/verify`, 
        { isVerified },
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      // Refresh seller data after verification
      fetchData();
    } catch (error) {
      console.error('Error updating seller verification:', error);
      setError('Failed to update seller verification');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Seller Management</h2>
      
      <h3>Verified Sellers</h3>
      <div className="sellers-grid">
        {sellers.filter(seller => seller?.sellerProfile?.isVerified).map(seller => (
          <div key={seller._id} className="seller-item">
            <div className="seller-info">
              <h4>{seller?.sellerProfile?.storeName || 'Unnamed Store'}</h4>
              <p><strong>Username:</strong> {seller.username}</p>
              <p><strong>Email:</strong> {seller.email}</p>
              <p><strong>Total Sales:</strong> {seller?.sellerProfile?.totalSales || 0}</p>
              <p><strong>Rating:</strong> {seller?.sellerProfile?.rating || 'No ratings yet'}</p>
            </div>
            <div className="seller-actions">
              <button 
                className="unverify-btn"
                onClick={() => handleVerifySeller(seller._id, false)}
              >
                Unverify Seller
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3>Pending Verification</h3>
      <div className="sellers-grid">
        {sellers.filter(seller => !seller?.sellerProfile?.isVerified).map(seller => (
          <div key={seller._id} className="seller-item">
            <div className="seller-info">
              <h4>{seller?.sellerProfile?.storeName || 'Unnamed Store'}</h4>
              <p><strong>Username:</strong> {seller.username}</p>
              <p><strong>Email:</strong> {seller.email}</p>
              <p><strong>Joined:</strong> {new Date(seller.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="seller-actions">
              <button 
                className="verify-btn"
                onClick={() => handleVerifySeller(seller._id, true)}
              >
                Verify Seller
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard; 