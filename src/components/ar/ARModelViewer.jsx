import React, { useEffect, useRef, useState } from 'react';
import './ARModelViewer.css';

const ARModelViewer = ({ iosUrl, androidUrl, productName }) => {
  const modelViewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webXRSupported, setWebXRSupported] = useState(true);
  
  useEffect(() => {
    // Check if WebXR is supported
    if (!window.XRSystem && !navigator.xr) {
      setWebXRSupported(false);
      setError('WebXR is not supported in your browser');
      setIsLoading(false);
      return;
    }

    // Reset states when model URL changes
    setIsLoading(true);
    setError(null);
      
    // Add event listeners when the component mounts
    const modelViewer = modelViewerRef.current;
    if (modelViewer) {
      const onProgress = (event) => {
        if (event.detail.totalProgress === 1) {
          setIsLoading(false);
        }
      };

      modelViewer.addEventListener('progress', onProgress);
      modelViewer.addEventListener('error', handleModelError);
      modelViewer.addEventListener('load', handleModelLoad);

      return () => {
        modelViewer.removeEventListener('progress', onProgress);
        modelViewer.removeEventListener('error', handleModelError);
        modelViewer.removeEventListener('load', handleModelLoad);
      };
    }
  }, [androidUrl]);

  const handleModelLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleModelError = (event) => {
    setIsLoading(false);
    setError('Failed to load 3D model');
    console.error('Model viewer error:', event);
  };

  if (error) {
    return (
      <div className="ar-model-error">
        <p>{error}</p>
        {!webXRSupported && (
          <p className="browser-support-note">
            Try using a WebXR-compatible browser like Chrome or Edge on Android, 
            or Safari on iOS.
          </p>
        )}
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
