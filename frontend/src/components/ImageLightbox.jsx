import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ImageLightbox = ({ src, images, initialIndex = 0, alt, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);

  const imageList = images && images.length > 0 ? images : (src ? [src] : []);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, imageList.length]);

  const handleTouchStart = (e) => {
    if (e.touches.length > 1) return; // Ignore multi-touch (pinch) for swiping
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || e.changedTouches.length > 1) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    const swipeThreshold = 50;

    // Only swipe if we moved enough
    if (distance > swipeThreshold) {
      handlePrev();
    } else if (distance < -swipeThreshold) {
      handleNext();
    }
    setTouchStart(null);
  };

  if (imageList.length === 0) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Background click listener */}
      <div 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'zoom-out' }}
        onClick={onClose}
      />

      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '10px',
          zIndex: 10000
        }}
      >
        <X size={32} />
      </button>

      {imageList.length > 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '1rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}
      
      <div 
        style={{ zIndex: 9999, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={5}
          centerOnInit
          wheel={{ wheelDisabled: false }}
          doubleClick={{ disabled: false, step: 2 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img 
                src={imageList[currentIndex]} 
                alt={alt} 
                style={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  cursor: 'grab',
                  userSelect: 'none',
                  WebkitUserDrag: 'none'
                }}
                onClick={(e) => e.stopPropagation()} 
              />
            </TransformComponent>
          )}
        </TransformWrapper>
      </div>

      {imageList.length > 1 && (
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '1rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}
    </div>
  );
};

export default ImageLightbox;
