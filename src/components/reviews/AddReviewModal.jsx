import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/api/productService';
import './AddReviewModal.css';

const AddReviewModal = ({ product, orderId, onClose, onReviewAdded }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Preview photos
    const previews = files.map(file => URL.createObjectURL(file));
    setPreviewPhotos([...previewPhotos, ...previews]);
    
    // Upload photos to Cloudinary
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'product_reviews');
        
        const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        return {
          url: data.secure_url,
          public_id: data.public_id
        };
      });
      
      const uploadedPhotos = await Promise.all(uploadPromises);
      setPhotos([...photos, ...uploadedPhotos]);
    } catch (err) {
      setError('Failed to upload photos. Please try again.');
      console.error('Photo upload error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await productService.addProductReview(product._id, {
        rating,
        comment,
        photos,
        orderId
      });
      
      onReviewAdded();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
      console.error('Review submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-modal-overlay">
      <div className="review-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="review-modal-header">
          <h2>Write a Review</h2>
          <div className="product-info">
            <img src={product.images[0].url} alt={product.title} />
            <div>
              <h3>{product.title}</h3>
              <p>Order ID: {orderId}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rating-input">
            <label>Rating:</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= rating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="comment-input">
            <label htmlFor="comment">Your Review:</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              required
              minLength={10}
              maxLength={1000}
            />
          </div>

          <div className="photo-input">
            <label>Add Photos:</label>
            <div className="photo-preview">
              {previewPhotos.map((url, index) => (
                <div key={index} className="preview-photo">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => {
                      setPreviewPhotos(previewPhotos.filter((_, i) => i !== index));
                      setPhotos(photos.filter((_, i) => i !== index));
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
              {previewPhotos.length < 5 && (
                <label className="add-photo-btn">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    max={5 - previewPhotos.length}
                  />
                  <span>+</span>
                </label>
              )}
            </div>
            <small>You can add up to 5 photos</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !comment.trim() || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReviewModal; 