import React, { useEffect, useRef, useState } from 'react';
import './ARModelViewer.css';

const ARModelViewer = ({ iosUrl, androidUrl, productName }) => {
  const modelViewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Load model-viewer script dynamically
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
    script.type = 'module';
    document.body.appendChild(script);
    
    script.onload = () => {
      setIsLoading(false);
    };
    
    script.onerror = () => {
      setError('Failed to load model viewer');
      setIsLoading(false);
    };
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  if (error) {
    return (
      <div className="ar-model-error">
        <p>{error}</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="ar-model-loading">
        <div className="loading-spinner"></div>
        <p>Loading 3D viewer...</p>
      </div>
    );
  }

  return (
    <div className="ar-model-viewer-container">
      <model-viewer
        ref={modelViewerRef}
        src={androidUrl}
        ios-src={iosUrl}
        alt={`3D model of ${productName}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        environment-image="neutral"
        exposure="0.5"
        poster="/placeholder.svg?height=300&width=300"
      >
        <button slot="ar-button" className="ar-button">
          View in your space
        </button>
        <div className="progress-bar hide" slot="progress-bar">
          <div className="update-bar"></div>
        </div>
      </model-viewer>
    </div>
  );
};

export default ARModelViewer;
