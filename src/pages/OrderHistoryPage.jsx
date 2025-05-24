import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedOrderForCancellation, setSelectedOrderForCancellation] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = () => {
    try {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const userOrders = allOrders.filter(order => order.userId === user._id);
      const sortedOrders = userOrders.sort((a, b) => 
        new Date(b.orderDate) - new Date(a.orderDate)
      );
      setOrders(sortedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancellationRequest = (orderId) => {
    setSelectedOrderForCancellation(orderId);
    setCancellationReason('');
  };

  const submitCancellationRequest = () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      // Update order in main orders storage
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.map(order => {
        if (order.id === selectedOrderForCancellation) {
          return {
            ...order,
            status: 'cancellation_requested',
            cancellationReason,
            cancellationRequestDate: new Date().toISOString()
          };
        }
        return order;
      });
      localStorage.setItem('orders', JSON.stringify(updatedOrders));

      // Update order in seller-specific storage
      const order = orders.find(o => o.id === selectedOrderForCancellation);
      if (order) {
        const sellerOrders = JSON.parse(localStorage.getItem(`orders_${order.sellerId}`) || '[]');
        const updatedSellerOrders = sellerOrders.map(o => {
          if (o.id === selectedOrderForCancellation) {
            return {
              ...o,
              status: 'cancellation_requested',
              cancellationReason,
              cancellationRequestDate: new Date().toISOString()
            };
          }
          return o;
        });
        localStorage.setItem(`orders_${order.sellerId}`, JSON.stringify(updatedSellerOrders));
      }

      setSelectedOrderForCancellation(null);
      setCancellationReason('');
      loadOrders();
      alert('Cancellation request submitted successfully');
    } catch (error) {
      console.error('Error submitting cancellation request:', error);
      alert('Failed to submit cancellation request');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getOrderStatus = (order) => {
    if (order.status === 'cancellation_requested') {
      return 'Cancellation Requested';
    }
    if (order.paymentStatus === 'paid') {
      return 'Paid';
    }
    return order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Payment Pending';
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
        <h1>My Orders</h1>
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order.id.toString().slice(-8)}</h3>
                  <p className="order-date">
                    {new Date(order.orderDate).toLocaleDateString('en-NP')}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${order.status || order.paymentStatus}`}>
                    {getOrderStatus(order)}
                  </span>
                </div>
              </div>

              <div className="order-items">
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
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: {formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total:</span>
                  <span className="total-amount">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="shipping-address">
                  <h4>Shipping Address:</h4>
                  <p>
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                </div>
                {order.status !== 'cancellation_requested' && (
                  <div className="order-actions">
                    <button 
                      className="cancel-order-btn"
                      onClick={() => handleCancellationRequest(order.id)}
                    >
                      Request Cancellation
                    </button>
                  </div>
                )}
                {order.status === 'cancellation_requested' && (
                  <div className="cancellation-info">
                    <p>Cancellation requested on: {new Date(order.cancellationRequestDate).toLocaleDateString('en-NP')}</p>
                    <p>Reason: {order.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedOrderForCancellation && (
        <div className="cancellation-modal">
          <div className="modal-content">
            <h2>Request Order Cancellation</h2>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              rows="4"
            />
            <div className="modal-actions">
              <button 
                className="submit-btn"
                onClick={submitCancellationRequest}
                disabled={!cancellationReason.trim()}
              >
                Submit Request
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setSelectedOrderForCancellation(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
