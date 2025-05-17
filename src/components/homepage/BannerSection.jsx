import React from 'react';
import CircularCarousel from '../CircularCarousel';
import './BannerSection.css';

const BannerSection = ({ section }) => {
  // Check if content is a string and needs parsing
  const content = typeof section.content === 'string' 
    ? JSON.parse(section.content) 
    : section.content;
  
  // Get slides from content
  const slides = content.slides || [];
  
  // If no slides or empty array, show placeholder
  if (slides.length === 0) {
    return (
      <div className="banner-section-placeholder">
        <h3>Banner Section</h3>
        <p>No slides configured for this banner section.</p>
      </div>
    );
  }
  
  return (
    <section className="banner-section">
      <CircularCarousel slides={slides} />
    </section>
  );
};

export default BannerSection; 