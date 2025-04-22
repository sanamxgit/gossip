import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodeGenerator.css';

const QRCodeGenerator = ({ iosUrl, androidUrl }) => {
  const [activeTab, setActiveTab] = useState('ios');
  
  // Generate deep link for iOS AR Quick Look
  const getIOSQRUrl = () => {
    if (!iosUrl) return '';
    // Use ar:// protocol which directly opens the USDZ in AR Quick Look without downloading
    return `https://apple-cdn.example.link/?url=${encodeURIComponent(iosUrl)}&ar=true`;
  };
  
  // Generate deep link for Android Scene Viewer
  const getAndroidQRUrl = () => {
    if (!androidUrl) return '';
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(androidUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
  };
  
  const getQRValue = () => {
    return activeTab === 'ios' ? getIOSQRUrl() : getAndroidQRUrl();
  };
  
  const handleDownloadQR = () => {
    const svg = document.getElementById('ar-qr-code');
    if (!svg) return;
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create an image from the SVG
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
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
          >
            iOS AR
          </button>
        )}
        
        {androidUrl && (
          <button 
            className={`qr-tab ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            Android AR
          </button>
        )}
      </div>
      
      <div className="qr-content">
        <div className="qr-display">
          <QRCodeSVG 
            id="ar-qr-code"
            value={getQRValue()}
            size={200}
            level="H"
            includeMargin={true}
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
      
      <button className="qr-download-btn" onClick={handleDownloadQR}>
        Download QR Code
      </button>
    </div>
  );
};

export default QRCodeGenerator; 