import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [esewaPhone, setEsewaPhone] = useState('');
  const [showEsewaVerification, setShowEsewaVerification] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load saved addresses
    const loadSavedAddresses = async () => {
      try {
        const addresses = JSON.parse(localStorage.getItem(`addresses_${user._id}`)) || [];
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          setSelectedAddress(addresses[0]);
        } else {
          setShowNewAddressForm(true);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };

    loadSavedAddresses();
  }, [user, navigate]);

  const handleNewAddressSubmit = (e) => {
    e.preventDefault();
    const address = { ...newAddress, id: Date.now() };
    const updatedAddresses = [...savedAddresses, address];
    setSavedAddresses(updatedAddresses);
    setSelectedAddress(address);
    setShowNewAddressForm(false);
    localStorage.setItem(`addresses_${user._id}`, JSON.stringify(updatedAddresses));
    setNewAddress({
      fullName: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const initiateEsewaPayment = () => {
    if (!esewaPhone || !/^\d{10}$/.test(esewaPhone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    // Generate a random 4-digit OTP
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setShowOtp(true);
    alert(`Demo OTP for eSewa payment: ${randomOtp}`);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      handlePayment();
    } else {
      alert('Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  const handlePayment = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setIsProcessing(true);

    try {
      // Group items by seller
      const itemsBySeller = cartItems.reduce((acc, item) => {
        const sellerId = item.sellerId;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {});

      // Create separate orders for each seller
      const orders = Object.entries(itemsBySeller).map(([sellerId, items]) => ({
        items,
        shippingAddress: selectedAddress,
        paymentMethod,
        totalAmount: items.reduce((total, item) => total + item.price * item.quantity, 0) * 1.1,
        status: 'pending',
        userId: user._id,
        sellerId,
        orderDate: new Date().toISOString(),
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      }));

      // Save orders to localStorage for demo
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const newOrders = orders.map(order => ({ ...order, id: Date.now() + Math.random() }));
      localStorage.setItem('orders', JSON.stringify([...existingOrders, ...newOrders]));

      // Save seller-specific orders
      orders.forEach(order => {
        const sellerOrders = JSON.parse(localStorage.getItem(`orders_${order.sellerId}`) || '[]');
        sellerOrders.push({ ...order, id: Date.now() + Math.random() });
        localStorage.setItem(`orders_${order.sellerId}`, JSON.stringify(sellerOrders));
      });

      clearCart();
      navigate('/order-success');
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>

        <div className="checkout-content">
          <div className="checkout-form">
            <section className="delivery-address">
              <h2>Delivery Address</h2>
              
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <div className="saved-addresses">
                  {savedAddresses.map(address => (
                    <div 
                      key={address.id} 
                      className={`address-card ${selectedAddress?.id === address.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <h3>{address.fullName}</h3>
                      <p>{address.address}</p>
                      <p>{address.city}, {address.state} {address.postalCode}</p>
                      <p>{address.phoneNumber}</p>
                    </div>
                  ))}
                  <button 
                    className="new-address-btn"
                    onClick={() => setShowNewAddressForm(true)}
                  >
                    Add New Address
                  </button>
                </div>
              )}

              {showNewAddressForm && (
                <form onSubmit={handleNewAddressSubmit} className="address-form">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newAddress.phoneNumber}
                      onChange={(e) => setNewAddress({ ...newAddress, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      placeholder="Address"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={newAddress.postalCode}
                        onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-address-btn">Save Address</button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setShowNewAddressForm(false);
                        if (savedAddresses.length > 0) {
                          setSelectedAddress(savedAddresses[0]);
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="payment-method">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setShowEsewaVerification(false);
                      setShowOtp(false);
                    }}
                  />
                  <span className="radio-custom"></span>
                  <span className="label-text">Cash on Delivery</span>
                </label>
                <label className={`payment-option ${paymentMethod === 'esewa' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="esewa"
                    checked={paymentMethod === 'esewa'}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setShowEsewaVerification(true);
                      setShowOtp(false);
                    }}
                  />
                  <span className="radio-custom"></span>
                  <span className="label-text">eSewa</span>
                  <img src="/esewa-logo.png" alt="eSewa" className="payment-logo" />
                </label>
              </div>

              {showEsewaVerification && (
                <div className="esewa-verification">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={esewaPhone}
                      onChange={(e) => setEsewaPhone(e.target.value)}
                      placeholder="Enter eSewa registered phone"
                      maxLength="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount to Pay</label>
                    <input
                      type="text"
                      value={formatPrice(getCartTotal() * 1.1)}
                      disabled
                      className="amount-display"
                    />
                  </div>
                  <button 
                    className="verify-btn"
                    onClick={initiateEsewaPayment}
                    disabled={!esewaPhone || !/^\d{10}$/.test(esewaPhone)}
                  >
                    Verify & Pay
                  </button>
                </div>
              )}
            </section>
          </div>

          {showOtp && paymentMethod === 'esewa' && (
            <div className="otp-form">
              <p>Please enter the OTP sent to {esewaPhone}</p>
              <input
                type="text"
                maxLength="4"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
              <button onClick={verifyOtp} disabled={otp.length !== 4}>
                Verify OTP
              </button>
            </div>
          )}

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item._id} className="summary-item">
                  <div className="item-info">
                    <img 
                      src={item.image || "/placeholder.svg"} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <div>
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="item-price">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(getCartTotal())}</span>
              </div>
              <div className="summary-row">
                <span>Tax (10%)</span>
                <span>{formatPrice(getCartTotal() * 0.1)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(getCartTotal() * 1.1)}</span>
              </div>
            </div>

            <button 
              className="place-order-btn" 
              onClick={() => {
                if (paymentMethod === 'esewa' && !showOtp) {
                  initiateEsewaPayment();
                } else if (paymentMethod === 'cod') {
                  handlePayment();
                }
              }}
              disabled={isProcessing || !selectedAddress || (paymentMethod === 'esewa' && showOtp)}
            >
              {isProcessing ? 'Processing...' : `Place Order (${formatPrice(getCartTotal() * 1.1)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage; 