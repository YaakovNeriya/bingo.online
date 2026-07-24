import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import SmartImage from './SmartImage';
import { useModalBack } from '../../hooks/useModalBack';

const ImageLightbox = ({ src, images, initialIndex = 0, alt, onClose }) => {
  useModalBack(true, onClose, 'image_lightbox');

  // --- Data ---
  const imageList = React.useMemo(() => {
    return images && images.length > 0 ? images : (src ? [src] : []);
  }, [images, src]);

  // --- Zoom state (ref for synchronous reads, state for re-renders) ---
  const isZoomedRef = useRef(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoomChange = useCallback((scale) => {
    const zoomed = scale > 1.05;
    isZoomedRef.current = zoomed; // Synchronous update — critical for watchDrag
    setIsZoomed(zoomed);          // Async update — triggers re-render for UI
  }, []);

  // --- Embla Carousel ---
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    direction: 'rtl',
    startIndex: initialIndex < imageList.length ? initialIndex : 0,
    duration: 25,
    watchDrag: () => !isZoomedRef.current
  });

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // --- Navigation ---
  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev(); // RTL: scrollPrev = visual next
  }, [emblaApi]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext(); // RTL: scrollNext = visual prev
  }, [emblaApi]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // --- Render ---
  if (imageList.length === 0) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Background click to close */}
      <div 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'zoom-out' }}
        onClick={onClose}
      />

      {/* Close button */}
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
        <X size={34} />
      </button>

      {/* Next button (right arrow) */}
      {imageList.length > 1 && (
        <button
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'rgba(0,0,0,0)',
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
          <ChevronRight size={28} />
        </button>
      )}

      {/* Embla Carousel Viewport */}
      <div 
        className="embla" 
        ref={emblaRef} 
        dir="rtl"
        style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden', 
          zIndex: 9999 
        }}
        onClick={(e) => {
          if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            onClose();
          }
        }}
      >
        <div className="embla__container" style={{ display: 'flex', height: '100%' }}>
          {imageList.map((imgUrl, idx) => {
            const isVideo = imgUrl && (imgUrl.includes('wistia.com') || imgUrl.includes('wistia.net'));
            return (
              <div 
                className="embla__slide" 
                key={idx} 
                style={{ 
                  flex: '0 0 100%', 
                  minWidth: 0, 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                {isVideo ? (
                  <SmartImage 
                    src={imgUrl} 
                    alt={alt} 
                    lightboxMode={idx === currentIndex}
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
                  <TransformWrapper
                    initialScale={1}
                    minScale={1}
                    maxScale={5}
                    centerOnInit
                    wheel={{ wheelDisabled: false }}
                    doubleClick={{ disabled: false, step: 2 }}
                    panning={{ disabled: !isZoomed }}
                    onTransform={(ref) => {
                      handleZoomChange(ref.state.scale);
                    }}
                  >
                    {() => (
                      <TransformComponent 
                        wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }} 
                        contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
                      >
                        <SmartImage 
                          src={imgUrl} 
                          alt={`${alt} ${idx + 1}`} 
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
            );
          })}
        </div>
      </div>

      {/* Prev button (left arrow) */}
      {imageList.length > 1 && (
        <button
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '10px',
            background: 'rgba(0,0,0,0)',
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
          <ChevronLeft size={28} />
        </button>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
