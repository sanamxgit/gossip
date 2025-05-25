import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/api/orderService';
import './OrderSuccessPage.css';
import { formatPrice, formatDate } from '../utils/formatters';

const OrderSuccessPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        // If order ID is passed through location state
        if (location.state?.orderId) {
          const orderData = await orderService.getOrderById(location.state.orderId);
          setOrder(orderData);
        } else {
          // Get user's most recent order
          const ordersData = await orderService.getUserOrders({ limit: 1 });
          if (ordersData.orders && ordersData.orders.length > 0) {
            setOrder(ordersData.orders[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [user, navigate, location.state]);

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="container">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-success-page">
        <div className="container">
          <div className="success-content error">
            <h1>Order Not Found</h1>
            <p>We couldn't find your order details. Please check your orders page.</p>
            <div className="action-buttons">
              <Link to="/orders" className="view-orders-btn">View Orders</Link>
              <Link to="/" className="continue-shopping-btn">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <div className="container">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your purchase. Your order has been received.</p>
          
          <div className="order-details">
            <h2>Order Details</h2>
            <div className="detail-row">
              <span>Order ID:</span>
              <span>{order._id}</span>
            </div>
            <div className="order-info">
              <div className="info-item">
                <label>Order Date:</label>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Order Total:</label>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="info-item">
                <label>Payment Method:</label>
                <span>{order.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/orders" className="view-orders-btn">View Orders</Link>
            <Link to="/" className="continue-shopping-btn">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage; 