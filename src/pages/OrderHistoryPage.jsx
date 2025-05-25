import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import orderService from '../services/api/orderService';
import productService from '../services/api/productService';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config';
import './OrderHistoryPage.css';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedOrderForCancellation, setSelectedOrderForCancellation] = useState(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    photos: []
  });

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const response = await orderService.getUserOrders();
      if (response && response.orders) {
        setOrders(response.orders);
      }
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

  const submitCancellationRequest = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      await orderService.cancelOrder(selectedOrderForCancellation, cancellationReason);
      setSelectedOrderForCancellation(null);
      setCancellationReason('');
      await loadOrders(); // Reload orders to get updated status
      alert('Cancellation request submitted successfully');
    } catch (error) {
      console.error('Error submitting cancellation request:', error);
      alert('Failed to submit cancellation request');
    }
  };

  const handleReviewSubmit = async (productId) => {
    if (!selectedOrderForReview) {
      alert('No order selected for review');
      return;
    }

    try {
      let uploadedPhotos = [];
      
      if (reviewData.photos.length > 0) {
        // First upload photos if any
        uploadedPhotos = await Promise.all(
          reviewData.photos.map(async (photo) => {
            const formData = new FormData();
            formData.append('file', photo);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              throw new Error('Failed to upload image');
            }
            
            const data = await response.json();
            return {
              url: data.secure_url,
              public_id: data.public_id
            };
          })
        );
      }

      const reviewPayload = {
        rating: reviewData.rating,
        comment: reviewData.comment,
        photos: uploadedPhotos,
        orderId: selectedOrderForReview.orderId
      };
      
      await productService.addProductReview(productId, reviewPayload);
      setSelectedOrderForReview(null);
      setReviewData({ rating: 5, comment: '', photos: [] });
      alert('Review submitted successfully');
      await loadOrders(); // Reload orders to update review status
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setReviewData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getOrderStatus = (order) => {
    // Return the current order status
    if (order.status === 'Cancelled') {
      return 'Cancelled';
    }
    
    // If not cancelled, show the current status
    return order.status || 'Pending';
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Pending': 'pending',
      'Confirmed': 'confirmed',
      'Processing': 'processing',
      'Shipped': 'shipped',
      'Delivered': 'delivered',
      'Cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
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
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.toString().slice(-8)}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                    {getOrderStatus(order)}
                  </span>
                  {order.isPaid && (
                    <span className="payment-badge paid">Paid</span>
                  )}
                  {!order.isPaid && order.paymentMethod === 'cod' && (
                    <span className="payment-badge cod">Cash on Delivery</span>
                  )}
                </div>
              </div>
              
              <div className="order-items">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <img 
                      src={item.image} 
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
                      {order.status === 'Delivered' && !item.reviewed && (
                        <button 
                          className="review-btn"
                          onClick={() => setSelectedOrderForReview({
                            orderId: order._id,
                            productId: item.product,
                            name: item.name,
                            image: item.image
                          })}
                        >
                          Write a Review
                        </button>
                      )}
                      {item.reviewed && (
                        <div className="review-badge">
                          <span>✓ Reviewed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total:</span>
                  <span>{formatPrice(order.totalPrice)}</span>
                </div>
                {!order.isPaid && order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                  <button 
                    className="cancel-order-btn"
                    onClick={() => handleCancellationRequest(order._id)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal */}
      {selectedOrderForReview && (
        <div className="review-modal">
          <div className="modal-content">
            <h2>Review {selectedOrderForReview.name}</h2>
            <div className="rating-input">
              <p>Rating:</p>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${star <= reviewData.rating ? 'filled' : ''}`}
                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Write your review here..."
              rows={4}
            />
            <div className="photo-upload">
              <label>
                Add Photos:
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </label>
              <div className="photo-preview">
                {reviewData.photos.map((photo, index) => (
                  <div key={index} className="photo-thumbnail">
                    <img src={URL.createObjectURL(photo)} alt={`Upload ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => setReviewData(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== index)
                      }))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="submit-btn"
                onClick={() => handleReviewSubmit(selectedOrderForReview.productId)}
                disabled={!reviewData.comment.trim()}
              >
                Submit Review
              </button>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setSelectedOrderForReview(null);
                  setReviewData({ rating: 5, comment: '', photos: [] });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrderForCancellation && (
        <div className="cancellation-modal">
          <div className="modal-content">
            <h2>Cancel Order</h2>
            <p>Please provide a reason for cancellation:</p>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter cancellation reason..."
            />
            <div className="modal-actions">
              <button 
                className="submit-btn"
                onClick={submitCancellationRequest}
              >
                Submit
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setSelectedOrderForCancellation(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
