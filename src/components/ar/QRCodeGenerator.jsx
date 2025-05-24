import React, { useState, useRef, forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeGenerator.css';

const QRCodeGenerator = forwardRef(({ iosUrl, androidUrl }, ref) => {
  const [activeTab, setActiveTab] = useState('ios');
  const internalRef = useRef(null);
  const resolvedRef = ref || internalRef;
  
  // Generate deep link for iOS AR Quick Look
  const getIOSQRUrl = () => {
    if (!iosUrl) return '';
    // Create an HTML page URL instead of direct USDZ link
    const encodedModelUrl = encodeURIComponent(iosUrl);
    const productName = 'Product';
    return `${window.location.origin}/ar-quicklook/?url=${encodedModelUrl}&title=${productName}`;
  };
  
  // Generate deep link for Android Scene Viewer
  const getAndroidQRUrl = () => {
    if (!androidUrl) return '';
    return `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(androidUrl)}&mode=ar_preferred`;
  };
  
  const getQRValue = () => {
    return activeTab === 'ios' ? getIOSQRUrl() : getAndroidQRUrl();
  };
  
  const handleDownloadQR = () => {
    const refElement = resolvedRef.current;
    if (!refElement) return;
    
    // Get the SVG element
    const svgElement = refElement.querySelector('svg');
    if (!svgElement) return;
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create an image from the SVG
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image to the canvas
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      // Download the image
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `ar-qr-${activeTab}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    
    img.src = url;
  };

  if (!iosUrl && !androidUrl) {
    return (
      <div className="qr-code-generator empty">
        <p>No AR models available for QR code generation</p>
      </div>
    );
  }

  return (
    <div className="qr-code-generator">
      <h3>AR QR Code</h3>
      <p className="qr-description">
        Scan this QR code with a mobile device to view the product in AR
      </p>
      
      <div className="qr-tabs">
        {iosUrl && (
          <button 
            className={`qr-tab ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
            type="button"
          >
            iOS AR
          </button>
        )}
        
        {androidUrl && (
          <button 
            className={`qr-tab ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
            type="button"
          >
            Android AR
          </button>
        )}
      </div>
      
      <div className="qr-content">
        <div className="qr-display" ref={resolvedRef}>
          <QRCodeSVG 
            id="ar-qr-code"
            value={getQRValue()}
            size={200}
            level="H"
            includeMargin={true}
            title="AR QR Code"
          />
        </div>
        
        <div className="qr-instructions">
          <h4>{activeTab === 'ios' ? 'iOS AR Instructions' : 'Android AR Instructions'}</h4>
          {activeTab === 'ios' ? (
            <ol>
              <li>Open the camera app on your iOS device</li>
              <li>Point it at this QR code</li>
              <li>Tap the notification to open AR Quick Look</li>
              <li>Place the 3D model in your environment</li>
            </ol>
          ) : (
            <ol>
              <li>Open the camera app on your Android device</li>
              <li>Point it at this QR code</li>
              <li>Tap the notification to open Scene Viewer</li>
              <li>Place the 3D model in your environment</li>
            </ol>
          )}
        </div>
      </div>
      
      <button 
        className="qr-download-btn" 
        onClick={handleDownloadQR}
        type="button"
      >
        Download QR Code
      </button>
    </div>
  );
});

export default QRCodeGenerator; 