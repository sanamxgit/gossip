import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Get order details from location state or localStorage
  const getOrderDetails = () => {
    if (location.state?.order) {
      return location.state.order;
    }
    
    // Get the most recent order from localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const userOrders = orders.filter(order => order.userId === user?._id);
    return userOrders[userOrders.length - 1];
  };

  const order = getOrderDetails();

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
          <div className="success-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              />
            </svg>
          </div>
          <h1>Order Placed Successfully!</h1>
          <p className="success-message">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>

          <div className="order-details">
            <h2>Order Details</h2>
            <div className="detail-row">
              <span>Order ID:</span>
              <span>{order.id}</span>
            </div>
            <div className="detail-row">
              <span>Order Date:</span>
              <span>{new Date(order.orderDate).toLocaleDateString('en-NP')}</span>
            </div>
            <div className="detail-row">
              <span>Payment Method:</span>
              <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'eSewa'}</span>
            </div>
            <div className="detail-row">
              <span>Payment Status:</span>
              <span className={`status ${order.paymentStatus}`}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
            <div className="detail-row">
              <span>Shipping Address:</span>
              <span className="address">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.phoneNumber}
              </span>
            </div>
          </div>

          <div className="order-items">
            <h2>Order Items</h2>
            {order.items.map((item, index) => (
              <div key={index} className="order-item">
                <img 
                  src={item.image || "/placeholder.svg"} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/placeholder.svg";
                  }}
                />
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: NPR {item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-total">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>NPR {order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax (10%):</span>
              <span>NPR {(order.totalAmount * 0.1).toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>NPR {(order.totalAmount * 1.1).toFixed(2)}</span>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/orders" className="view-orders-btn">View All Orders</Link>
            <Link to="/" className="continue-shopping-btn">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage; 