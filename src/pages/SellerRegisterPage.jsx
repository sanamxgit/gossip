import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./AuthPages.css";
import "./SellerRegisterPage.css";
import { FaUpload, FaFilePdf, FaFileWord } from "react-icons/fa";

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
    acceptTerms: false,
    documents: []
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

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

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      alert('You can only upload up to 3 documents');
      return;
    }

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setDocumentPreviews(previews);

    setFormData(prev => ({
      ...prev,
      documents: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setUploadingDocuments(true);
    
    try {
      // Create FormData object to handle file uploads
      const formDataToSend = new FormData();
      
      // Add basic user data
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', 'seller');
      
      // Add seller profile data
      const sellerProfile = {
        storeName: formData.storeName,
        storeDescription: formData.storeDescription,
        address: formData.address,
        phoneNumber: formData.phoneNumber
      };
      formDataToSend.append('sellerProfile', JSON.stringify(sellerProfile));
      
      // Add verification documents
      formData.documents.forEach((doc, index) => {
        formDataToSend.append('documents', doc);
      });
      
      await register(formDataToSend);
      
      // Navigate to seller dashboard upon successful registration
      navigate("/seller/dashboard");
    } catch (error) {
      setErrors({ submit: error.message || "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
      setUploadingDocuments(false);
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

            <div className="form-section">
              <h2>Verification Documents</h2>
              
              <div className="form-group">
                <label>Business Documents</label>
                <div className="document-upload">
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleDocumentUpload}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="documents" className="upload-btn">
                    <FaUpload /> Upload Documents
                  </label>
                  <p className="help-text">
                    Please upload up to 3 documents for verification (Business registration, ID proof, address proof, etc.)
                    <br />
                    Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                  </p>
                  
                  {uploadingDocuments && (
                    <div className="upload-loading">
                      <div className="loading-spinner"></div>
                      <span>Uploading documents...</span>
                    </div>
                  )}
                  
                  {documentPreviews.length > 0 && (
                    <div className="document-previews">
                      {documentPreviews.map((preview, index) => (
                        <div key={index} className="document-preview">
                          {preview.endsWith('.pdf') ? (
                            <FaFilePdf className="document-icon" />
                          ) : preview.endsWith('.doc') || preview.endsWith('.docx') ? (
                            <FaFileWord className="document-icon" />
                          ) : (
                            <img src={preview} alt={`Document ${index + 1}`} />
                          )}
                          <span>Document {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
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