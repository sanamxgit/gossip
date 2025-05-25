import React, { useState } from 'react';
import { toast } from 'react-toastify';
import brandVerificationService from '../services/api/brandVerificationService';
import './SellerVerification.css';

const SellerVerification = () => {
  const [brandName, setBrandName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('business_license');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);

    // Create previews for images
    const newPreviews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviews(newPreviews);
  };

  // Cleanup previews when component unmounts
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!brandName.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    if (documents.length === 0) {
      toast.error('Please select at least one document');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('brandName', brandName);
      formData.append('documentType', documentType);
      formData.append('description', description);

      // Append each document to formData
      documents.forEach((doc) => {
        formData.append('documents', doc);
      });

      // Show upload starting
      toast.info('Starting document upload...', { autoClose: 2000 });

      const response = await brandVerificationService.submitVerification(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      
      toast.success('Verification request submitted successfully! We will review your documents shortly.');
      
      // Reset form
      setBrandName('');
      setDocuments([]);
      setDocumentType('business_license');
      setDescription('');
      setPreviews([]);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error(error.response?.data?.message || 'Error submitting verification request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-verification">
      <div className="verification-container">
        <h2>Brand Verification</h2>
        <p className="info-text">
          Submit your brand verification documents to get verified seller status.
          This will give you access to additional features and increase buyer trust.
        </p>

        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-group">
            <label htmlFor="brandName">Brand Name *</label>
            <input
              type="text"
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter your brand name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="documentType">Document Type *</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
            >
              <option value="business_license">Business License</option>
              <option value="trademark">Trademark Registration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your documents or provide additional information"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="documents">Upload Documents *</label>
            <input
              type="file"
              id="documents"
              onChange={handleFileChange}
              multiple
              accept="image/*,.pdf,.doc,.docx"
              required
            />
            <small className="file-info">
              Accepted formats: Images (JPG, PNG), PDF, DOC. Max 5 files.
            </small>
          </div>

          {previews.length > 0 && (
            <div className="document-previews">
              {previews.map((preview, index) => (
                preview && (
                  <div key={index} className="preview-item">
                    <img src={preview} alt={`Document preview ${index + 1}`} />
                  </div>
                )
              ))}
            </div>
          )}

          {loading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span>{uploadProgress}% Uploaded</span>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerVerification; 