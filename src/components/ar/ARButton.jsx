import React, { useState, useEffect, forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './ARButton.css';

const ARButton = forwardRef(({ iosUrl, androidUrl, productName }, ref) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [arSupported, setArSupported] = useState(false);
  
  useEffect(() => {
    // Detect device
    const userAgent = navigator.userAgent || navigator.vendor;
    
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroidDevice = /android/i.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    
    // Check if AR is supported
    const isARSupported = isIOSDevice || isAndroidDevice;
    setArSupported(isARSupported);
  }, []);
  
  const getIOSARLink = () => {
    if (!iosUrl) return '';
    // Create a URL to an HTML page with rel="ar" instead of direct USDZ link
    const encodedModelUrl = encodeURIComponent(iosUrl);
    const encodedTitle = encodeURIComponent(productName || 'Product');
    return `${window.location.origin}/ar-quicklook/?url=${encodedModelUrl}&title=${encodedTitle}`;
  };
  
  const handleARClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isIOS) {
      // iOS devices - redirect to special HTML page with rel="ar"
      window.location.href = getIOSARLink();
    } else if (isAndroid) {
      // Android devices can use Scene Viewer
      window.location.href = `intent://arvr.google.com/scene-viewer/1.0?file=${androidUrl}&mode=ar_only#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
    } else {
      // Desktop or unsupported devices show QR code
      setShowQR(true);
    }
  };
  
  const closeQRModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQR(false);
  };
  
  if (!arSupported && !iosUrl && !androidUrl) {
    return null;
  }

  return (
    <>
      <button 
        className="ar-button" 
        onClick={handleARClick}
        title="View in AR"
        type="button"
        ref={ref}
      >
        <span className="ar-icon">📱</span>
        <span className="ar-text">View in AR</span>
      </button>
      
      {showQR && (
        <div className="qr-modal" onClick={closeQRModal}>
          <div className="qr-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeQRModal} type="button">×</button>
            <h3>Scan to view in AR</h3>
            <p>Use your mobile device to scan this QR code and view {productName} in augmented reality.</p>
            
            <div className="qr-tabs">
              <button 
                className={`qr-tab ${isIOS ? 'active' : ''}`} 
                onClick={() => setIsIOS(true)}
                type="button"
              >
                iOS
              </button>
              <button 
                className={`qr-tab ${!isIOS ? 'active' : ''}`} 
                onClick={() => setIsIOS(false)}
                type="button"
              >
                Android
              </button>
            </div>
            
            <div className="qr-code-container">
              <QRCodeSVG 
                value={isIOS ? getIOSARLink() : androidUrl} 
                size={200}
                level="H"
                includeMargin={true}
                title={`${productName} AR QR Code`}
              />
            </div>
            
            <p className="qr-instructions">
              {isIOS ? 'iOS 12+ required for AR Quick Look' : 'Android 8.0+ required for AR View'}
            </p>
          </div>
        </div>
      )}
    </>
  );
});

export default ARButton;
