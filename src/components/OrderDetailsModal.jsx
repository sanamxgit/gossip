import React from 'react';
import './OrderDetailsModal.css';
import { FaTimes } from 'react-icons/fa';
import { formatPrice, formatDate } from '../utils/formatters';

const OrderDetailsModal = ({ order, onClose, onStatusChange }) => {
  const statusOptions = [
    'Pending',
    'Confirmed',
    'Packed',
    'Ready to Dispatch',
    'Dispatched',
    'Delivered',
    'Cancelled'
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Order Details</h2>
          <button onClick={onClose} className="close-button">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          <div className="order-info">
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
            <p><strong>Customer:</strong> {order.user.username}</p>
            <p><strong>Payment Status:</strong> 
              <span className={`payment-status ${order.isPaid ? 'paid' : 'unpaid'}`}>
                {order.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </p>
            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
            <p>
              <strong>Status:</strong>
              <select 
                value={order.status}
                onChange={(e) => onStatusChange(order._id, e.target.value)}
                className={`status-select ${order.status.toLowerCase()}`}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </p>
          </div>

          <div className="order-items">
            <h3>Order Items</h3>
            {order.orderItems.map((item) => (
              <div key={item._id} className="order-item">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="item-image"
                />
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Quantity: {item.quantity}</p>
                  <p>Price: {formatPrice(item.price)}</p>
                  <p>Total: {formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <p><strong>Items Price:</strong> {formatPrice(order.itemsPrice)}</p>
            <p><strong>Tax:</strong> {formatPrice(order.taxPrice)}</p>
            <p><strong>Shipping:</strong> {formatPrice(order.shippingPrice)}</p>
            <p><strong>Total:</strong> {formatPrice(order.totalPrice)}</p>
          </div>

          <div className="shipping-address">
            <h3>Shipping Address</h3>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal; 