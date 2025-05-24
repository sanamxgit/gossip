import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './SellerRegistration.css';

const SellerRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: '',
    phoneNumber: '',
    businessAddress: '',
    businessDescription: '',
    documents: [],
    storeImage: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'documents') {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...files]
      }));
    } else if (name === 'storeImage') {
      setFormData(prev => ({
        ...prev,
        storeImage: files[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('storeName', formData.storeName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('businessAddress', formData.businessAddress);
      formDataToSend.append('businessDescription', formData.businessDescription);
      
      // Add documents
      formData.documents.forEach((doc, index) => {
        formDataToSend.append(`documents[${index}]`, doc);
      });
      
      // Add store image
      if (formData.storeImage) {
        formDataToSend.append('storeImage', formData.storeImage);
      }

      await authService.applyForSeller(formDataToSend);
      alert('Your seller application has been submitted successfully! We will review it and get back to you soon.');
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit seller application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="seller-registration">
      <h2>Become a Seller</h2>
      <p className="description">
        Complete this form to apply for a seller account. We'll review your application and get back to you within 2-3 business days.
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="storeName">Store Name *</label>
          <input
            type="text"
            id="storeName"
            name="storeName"
            value={formData.storeName}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number *</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="businessAddress">Business Address *</label>
          <textarea
            id="businessAddress"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="businessDescription">Business Description *</label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={formData.businessDescription}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="documents">Business Documents *</label>
          <input
            type="file"
            id="documents"
            name="documents"
            onChange={handleFileChange}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            required
          />
          <small>Upload registration certificates, licenses, or any other relevant documents (PDF, DOC, or images)</small>
        </div>

        <div className="form-group">
          <label htmlFor="storeImage">Store Logo/Image</label>
          <input
            type="file"
            id="storeImage"
            name="storeImage"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default SellerRegistration; 