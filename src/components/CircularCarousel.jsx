import React, { useState, useEffect, useRef } from 'react';
import './CircularCarousel.css';

const CircularCarousel = ({ slides = [], autoplaySpeed = 3000, showArrows = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef(null);
  const autoplayTimerRef = useRef(null);

  // Helper to get circular indices
  const getPrevIndex = () => (currentIndex - 1 + slides.length) % slides.length;
  const getNextIndex = () => (currentIndex + 1) % slides.length;

  // Handle next slide
  const nextSlide = () => {
    if (isTransitioning || slides.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  // Handle previous slide
  const prevSlide = () => {
    if (isTransitioning || slides.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  // Reset transition state after animation completes
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
  };

  // Setup autoplay
  useEffect(() => {
    if (autoplaySpeed && slides.length > 1) {
      autoplayTimerRef.current = setInterval(() => {
        nextSlide();
      }, autoplaySpeed);
    }
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [autoplaySpeed, slides.length, isTransitioning]);

  // Stop autoplay on hover
  const pauseAutoplay = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
  };

  // Resume autoplay on mouse leave
  const resumeAutoplay = () => {
    if (autoplaySpeed && slides.length > 1) {
      autoplayTimerRef.current = setInterval(() => {
        nextSlide();
      }, autoplaySpeed);
    }
  };

  if (slides.length === 0) {
    return null;
  }

  // Only render prev, current, and next slides
  const prevIndex = getPrevIndex();
  const nextIndex = getNextIndex();

  // Function to safely render image with error handling
  const renderImage = (imageUrl, altText, className = "") => {
    if (!imageUrl || imageUrl === 'Uploading...') {
      return <div className={`image-placeholder ${className}`}>Loading...</div>;
    }

    return (
      <img 
        src={imageUrl} 
        alt={altText || "Slide"} 
        className={className}
        onError={(e) => {
          // Only apply once to prevent infinite loop
          if (e.target.src !== "/placeholder-image.png") {
            console.log(`Image failed to load: ${imageUrl}`);
            e.target.src = "/placeholder-image.png"; 
            e.target.onerror = null; // Prevent further error handling
          }
        }}
      />
    );
  };

  return (
    <div 
      className="circular-carousel-container"
      onMouseEnter={pauseAutoplay}
      onMouseLeave={resumeAutoplay}
      ref={carouselRef}
    >
      <div 
        className="circular-carousel-track"
        style={{
          transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Previous Slide (left, less visible) */}
        <div className="circular-carousel-slide prev">
          <div className="slide-content">
            {renderImage(slides[prevIndex].imageUrl, slides[prevIndex].title)}
            <div className="slide-text">
              {slides[prevIndex].title && <h2>{slides[prevIndex].title}</h2>}
              {slides[prevIndex].subtitle && <p>{slides[prevIndex].subtitle}</p>}
              {slides[prevIndex].buttonText && slides[prevIndex].buttonLink && (
                <a href={slides[prevIndex].buttonLink} className="slide-button">
                  {slides[prevIndex].buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
        {/* Current Slide (center, fully visible) */}
        <div className="circular-carousel-slide active">
          <div className="slide-content">
            {renderImage(slides[currentIndex].imageUrl, slides[currentIndex].title)}
            <div className="slide-text">
              {slides[currentIndex].title && <h2>{slides[currentIndex].title}</h2>}
              {slides[currentIndex].subtitle && <p>{slides[currentIndex].subtitle}</p>}
              {slides[currentIndex].buttonText && slides[currentIndex].buttonLink && (
                <a href={slides[currentIndex].buttonLink} className="slide-button">
                  {slides[currentIndex].buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
        {/* Next Slide (right, less visible) */}
        <div className="circular-carousel-slide next">
          <div className="slide-content">
            {renderImage(slides[nextIndex].imageUrl, slides[nextIndex].title)}
            <div className="slide-text">
              {slides[nextIndex].title && <h2>{slides[nextIndex].title}</h2>}
              {slides[nextIndex].subtitle && <p>{slides[nextIndex].subtitle}</p>}
              {slides[nextIndex].buttonText && slides[nextIndex].buttonLink && (
                <a href={slides[nextIndex].buttonLink} className="slide-button">
                  {slides[nextIndex].buttonText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button className="carousel-arrow prev-arrow" onClick={prevSlide}>
            &#10094;
          </button>
          <button className="carousel-arrow next-arrow" onClick={nextSlide}>
            &#10095;
          </button>
        </>
      )}

      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentIndex(index);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CircularCarousel; 