import React, { useState, useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import './ModelPreview.css';

const ModelPreview = ({ modelUrl, modelType, showQRCode = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelValid, setModelValid] = useState(false);

  useEffect(() => {
    if (!modelUrl) {
      setLoading(false);
      return;
    }

    // Validate if the model URL is accessible
    const checkModel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(modelUrl, { method: 'HEAD' });
        if (response.ok) {
          setModelValid(true);
        } else {
          setError(`Could not access model: ${response.statusText}`);
          setModelValid(false);
        }
      } catch (err) {
        setError(`Error checking model: ${err.message}`);
        setModelValid(false);
      } finally {
        setLoading(false);
      }
    };

    checkModel();
  }, [modelUrl]);

  if (loading) {
    return (
      <div className="model-preview loading">
        <div className="loading-spinner"></div>
        <p>Loading model...</p>
      </div>
    );
  }

  if (!modelUrl) {
    return (
      <div className="model-preview empty">
        <p>No model selected for preview</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="model-preview error">
        <p>Error: {error}</p>
        <p>URL: {modelUrl}</p>
      </div>
    );
  }

  // For iOS USDZ models, we can only offer a link
  if (modelType === 'usdz') {
    return (
      <div className="model-preview usdz">
        <p>iOS AR Model (USDZ)</p>
        <a 
          href={modelUrl} 
          rel="ar"
          target="_blank"
          className="ar-preview-link"
        >
          View iOS AR Model
        </a>
        <p className="preview-note">
          Note: USDZ models can only be previewed on iOS devices
        </p>
        <div className="model-info">
          <p>Model URL: <a href={modelUrl} target="_blank" rel="noopener noreferrer">{modelUrl}</a></p>
        </div>
        
        {showQRCode && <QRCodeGenerator iosUrl={modelUrl} />}
      </div>
    );
  }

  // For Android GLB/GLTF models, we can embed a 3D viewer
  if (modelType === 'glb' || modelType === 'gltf') {
    return (
      <div className="model-preview glb">
        <p>Android AR Model ({modelType.toUpperCase()})</p>
        <model-viewer
          src={modelUrl}
          alt="3D model preview"
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          environment-image="neutral"
          shadow-intensity="1"
          style={{ width: "100%", height: "300px" }}
        ></model-viewer>
        <div className="model-info">
          <p>Model URL: <a href={modelUrl} target="_blank" rel="noopener noreferrer">{modelUrl}</a></p>
        </div>
        
        {showQRCode && <QRCodeGenerator androidUrl={modelUrl} />}
      </div>
    );
  }

  // Fallback for other model types
  return (
    <div className="model-preview unknown">
      <p>Model preview not available for type: {modelType}</p>
      <div className="model-info">
        <p>Model URL: <a href={modelUrl} target="_blank" rel="noopener noreferrer">{modelUrl}</a></p>
      </div>
    </div>
  );
};

export default ModelPreview; 