import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import { FaQrcode } from 'react-icons/fa';
import './ModelPreview.css';

const ModelPreview = ({ modelUrl, modelType, iosUrl, androidUrl }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState(null);
  const modelViewerRef = useRef(null);

  useEffect(() => {
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
  }, [modelUrl]);

  // Generate the AR Quick Look URL for iOS
  const getARQuickLookUrl = (url) => {
    return `https://developer.apple.com/augmented-reality/quick-look/?url=${encodeURIComponent(url)}`;
  };

  // Generate the Scene Viewer URL for Android
  const getSceneViewerUrl = (url) => {
    return `@https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(url)}&mode=ar_preferred`;
  };

  const toggleQRCode = () => {
    setShowQR(!showQR);
  };

  const handleModelLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleModelError = () => {
    setIsLoading(false);
    setError('Failed to load 3D model');
  };

  // Use androidUrl or modelUrl for the 3D preview
  const previewUrl = androidUrl || modelUrl;

    return (
    <div className="model-preview-container">
      <div className="model-viewer-container">
        <model-viewer
          ref={modelViewerRef}
          src={previewUrl}
          alt="3D model preview"
          auto-rotate
          camera-controls
          ar
          ar-modes="webxr scene-viewer"
          loading="eager"
          reveal="auto"
          poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        >
          {isLoading && <div className="loading-spinner" />}
          {error && <div className="error-message">{error}</div>}
          <div className="progress-bar" slot="progress-bar">
            <div className="update-bar"></div>
        </div>
        </model-viewer>
        <button className="ar-button" onClick={toggleQRCode}>
          <FaQrcode /> View in Your Room
        </button>
      </div>

      {showQR && (
        <div className="qr-overlay">
          <div className="qr-modal">
            <button className="close-qr" onClick={toggleQRCode}>×</button>
            <h3>View in Your Room</h3>
            <div className="qr-codes-container">
              {iosUrl && (
                <div className="qr-code-section">
                  <h4>iOS (iPhone/iPad)</h4>
                  <QRCode 
                    value={getARQuickLookUrl(iosUrl)}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="scan-text">Scan with iOS device</p>
                </div>
              )}
              {(androidUrl || modelUrl) && (
                <div className="qr-code-section">
                  <h4>Android</h4>
                  <QRCode 
                    value={getSceneViewerUrl(androidUrl || modelUrl)}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="scan-text">Scan with Android device</p>
                </div>
              )}
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default ModelPreview; 