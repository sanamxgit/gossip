import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sellerStatus, setSellerStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (user.role === 'seller') {
          // Check if seller is verified
          const sellerData = await authService.getSellerProfile();
          setSellerStatus({
            status: 'seller',
            isVerified: sellerData.sellerProfile.isVerified
          });
        } else {
          // Check application status for non-sellers
          const status = await authService.checkApplicationStatus();
          setSellerStatus(status);
        }
      } catch (error) {
        console.error('Error checking seller status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSellerSection = () => {
    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (user.role === 'seller') {
      if (!sellerStatus?.isVerified) {
        return (
          <div className="dashboard-section">
            <h3>Seller Verification Required</h3>
            <div className="application-status pending">
              <p>Your seller account is pending verification.</p>
              <p>Please wait for admin approval to start selling.</p>
            </div>
          </div>
        );
      }
      return (
        <div className="dashboard-section">
          <h3>Seller Dashboard</h3>
          <Link to="/seller/dashboard" className="dashboard-button">
            Go to Seller Dashboard
          </Link>
        </div>
      );
    }

    if (sellerStatus?.status === 'pending') {
      return (
        <div className="dashboard-section">
          <h3>Seller Application</h3>
          <div className="application-status pending">
            <p>Your seller application is under review.</p>
            <p>We'll notify you once it's approved.</p>
          </div>
        </div>
      );
    }

    if (sellerStatus?.status === 'rejected') {
      return (
        <div className="dashboard-section">
          <h3>Seller Application</h3>
          <div className="application-status rejected">
            <p>Your previous application was not approved.</p>
            <p>Reason: {sellerStatus.reason || 'No reason provided'}</p>
            <Link to="/become-seller" className="dashboard-button">
              Apply Again
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-section">
        <h3>Become a Seller</h3>
        <p>Start selling your products on our platform!</p>
        <Link to="/become-seller" className="dashboard-button">
          Apply Now
        </Link>
      </div>
    );
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.username}!</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h3>My Orders</h3>
          <Link to="/orders" className="dashboard-button">
            View Orders
          </Link>
        </div>

        <div className="dashboard-section">
          <h3>My Profile</h3>
          <Link to="/profile" className="dashboard-button">
            Edit Profile
          </Link>
        </div>

        {renderSellerSection()}
      </div>
    </div>
  );
};

export default UserDashboard; 