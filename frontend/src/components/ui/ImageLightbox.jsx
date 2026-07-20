import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import SmartImage from './SmartImage';
import { useModalBack } from '../../hooks/useModalBack';

const ImageLightbox = ({ src, images, initialIndex = 0, alt, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchRef = React.useRef({ startX: null, isMultiTouch: false });

  useModalBack(true, onClose, 'image_lightbox');

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
    if (e.touches.length > 1) {
      touchRef.current.isMultiTouch = true;
      return;
    }
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.isMultiTouch = false;
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 1) {
      touchRef.current.isMultiTouch = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      const { startX, isMultiTouch } = touchRef.current;
      const touchEnd = e.changedTouches[0].clientX;
      
      if (!isMultiTouch && startX !== null) {
        const distance = startX - touchEnd;
        const swipeThreshold = 50;

        if (distance > swipeThreshold) {
          handleNext();
        } else if (distance < -swipeThreshold) {
          handlePrev();
        }
      }
      
      // Reset
      touchRef.current.startX = null;
      touchRef.current.isMultiTouch = false;
    } else {
      // Finger lifted but others remain -> it was a multi-touch
      touchRef.current.isMultiTouch = true;
    }
  };

  if (imageList.length === 0) return null;

  return createPortal(
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
        onClick={(e) => {
          // Only close if clicking outside the image (the image stops propagation)
          // Ensure we don't accidentally close when clicking buttons
          if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            onClose();
          }
        }}
      >
        {/* Videos: render directly without TransformWrapper to avoid CSS transform stutter */}
        {imageList[currentIndex] && (imageList[currentIndex].includes('wistia.com') || imageList[currentIndex].includes('wistia.net')) ? (
          <SmartImage 
            src={imageList[currentIndex]} 
            alt={alt} 
            lightboxMode={true}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
            onClick={(e) => e.stopPropagation()} 
          />
        ) : (
          /* Images: use TransformWrapper for zoom/pan */
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={5}
            centerOnInit
            wheel={{ wheelDisabled: false }}
            doubleClick={{ disabled: false, step: 2 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <SmartImage 
                  src={imageList[currentIndex]} 
                  alt={alt} 
                  lightboxMode={true}
                  style={{
                    width: '100%',
                    height: '100%',
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
        )}
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
            zIndex: 100000
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
