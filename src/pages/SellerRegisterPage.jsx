import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./AuthPages.css";
import "./SellerRegisterPage.css";

const SellerRegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    storeName: "",
    storeDescription: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    },
    phoneNumber: "",
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes(".")) {
      // Handle nested objects (address fields)
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.storeName.trim()) newErrors.storeName = "Store name is required";
    if (!formData.storeDescription.trim()) newErrors.storeDescription = "Store description is required";
    if (!formData.address.street.trim()) newErrors.street = "Street address is required";
    if (!formData.address.city.trim()) newErrors.city = "City is required";
    if (!formData.address.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    if (!formData.address.country.trim()) newErrors.country = "Country is required";
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // First register as a user with role set to "seller"
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: "seller", // Request seller role directly
        sellerProfile: {
          storeName: formData.storeName,
          storeDescription: formData.storeDescription,
          address: formData.address,
          phoneNumber: formData.phoneNumber
        }
      };
      
      await register(userData);
      
      // Navigate to seller dashboard upon successful registration
      navigate("/seller/dashboard");
    } catch (error) {
      setErrors({ submit: error.message || "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page seller-register-page">
      <div className="container">
        <div className="auth-card seller-register-card">
          <h1>Register as a Seller</h1>
          <p className="subtitle">Create your seller account and start selling today</p>

          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Account Information</h2>
              
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input 
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && <span className="error">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <span className="error">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className="form-section">
              <h2>Store Information</h2>
              
              <div className="form-group">
                <label htmlFor="storeName">Store Name</label>
                <input 
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                />
                {errors.storeName && <span className="error">{errors.storeName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="storeDescription">Store Description</label>
                <textarea 
                  id="storeDescription"
                  name="storeDescription"
                  value={formData.storeDescription}
                  onChange={handleChange}
                  rows="3"
                />
                {errors.storeDescription && <span className="error">{errors.storeDescription}</span>}
              </div>
            </div>

            <div className="form-section">
              <h2>Contact Information</h2>
              
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input 
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input 
                  type="text"
                  id="street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                />
                {errors.street && <span className="error">{errors.street}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input 
                    type="text"
                    id="city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                  {errors.city && <span className="error">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="state">State/Province</label>
                  <input 
                    type="text"
                    id="state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="postalCode">Postal Code</label>
                  <input 
                    type="text"
                    id="postalCode"
                    name="address.postalCode"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                  />
                  {errors.postalCode && <span className="error">{errors.postalCode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input 
                    type="text"
                    id="country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                  />
                  {errors.country && <span className="error">{errors.country}</span>}
                </div>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                I agree to the Terms and Conditions
              </label>
              {errors.acceptTerms && <span className="error">{errors.acceptTerms}</span>}
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Seller Account"}
              </button>
            </div>
          </form>

          <div className="auth-links">
            <p>
              Already have a seller account? <Link to="/seller/login">Login</Link>
            </p>
            <p>
              Want to register as a regular user? <Link to="/register">Register as User</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage; 