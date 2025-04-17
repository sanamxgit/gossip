import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Fetch order history
    fetchOrders();
  }, [user, navigate]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // In a real app, fetch orders from API
      // Simulate API call
      setTimeout(() => {
        // Mock orders
        const mockOrders = Array(5).fill().map((_, index) => ({
          id: index + 1,
          date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          status: ['Pending', 'Processing', 'Shipped', 'Delivered'][Math.floor(Math.random() * 4)],
          total: Math.floor(Math.random() * 50000) + 10000, // Random total between 100 and 600 dollars (in cents)
          items: Array(Math.floor(Math.random() * 3) + 1).fill().map((_, itemIndex) => ({
            id: itemIndex + 1,
            name: `Product ${itemIndex + 1}`,
            price: Math.floor(Math.random() * 9000) + 1000,
            quantity: Math.floor(Math.random() * 3) + 1,
            image: '/placeholder.svg?height=80&width=80'
          }))
        }));
        
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price / 100);
  };
  
  if (loading) {
    return (
      <div className="order-history-page loading">
        <div className="container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="order-history-page empty">
        <div className="container">
          <div className="empty-orders">
            <h1>No Orders Yet</h1>
            <p>You haven't placed any orders yet.</p>
            <Link to="/" className="shop-now-btn">Shop Now</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="container">
        <h1>Order History</h1>
        
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <div className="order-number">
                    <span>Order #</span>
                    <span>{order.id}</span>
                  </div>
                  <div className="order-date">
                    <span>Placed on</span>
                    <span>{formatDate(order.date)}</span>
                  </div>
                  <div className="order-total">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>
                
                <div className="order-status">
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="order-items">
                {order.items.map(item => (
                  <div key={item.id} className="order-item">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="item-image" />
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <div className="item-meta">
                        <span>Qty: {item.quantity}</span>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="order-actions">
                <Link to={`/order/${order.id}`} className="view-details-btn">
                  View Order Details
                </Link>
                
                {order.status === 'Delivered' && (
                  <button className="buy-again-btn">Buy Again</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
