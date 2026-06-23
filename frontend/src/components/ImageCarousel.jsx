import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

const ImageCarousel = ({ images, alt, height = '200px', onClick, showDots = true, onIndexChange, autoPlay = false, autoPlayInterval = 5000, isFullScreen = false }) => {
  // Conditionally include autoplay plugin
  const plugins = (autoPlay && images && images.length > 1 && !isFullScreen) 
    ? [Autoplay({ delay: autoPlayInterval, stopOnInteraction: true, stopOnMouseEnter: true })] 
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    direction: 'rtl', // Native RTL support!
    duration: 75 // Higher number means slower, more graceful transition (default is 25)
  }, plugins);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedIndex(idx);
    if (onIndexChange) onIndexChange(idx);
  }, [emblaApi, onIndexChange]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Handle FullScreen Pause logic manually if state changes dynamically
  useEffect(() => {
    if (!emblaApi) return;
    const autoplayPlugin = emblaApi.plugins().autoplay;
    if (autoplayPlugin) {
      if (isFullScreen) {
        autoplayPlugin.stop();
      } else {
        autoplayPlugin.play();
      }
    }
  }, [isFullScreen, emblaApi]);

  if (!images || images.length === 0) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height, 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'var(--text-light)' 
        }}
        onClick={onClick}
      >
        אין תמונה
      </div>
    );
  }

  // If there's only one image, no need for carousel logic
  if (images.length === 1) {
    return (
      <img 
        src={images[0]} 
        alt={alt} 
        style={{ 
          width: '100%', 
          height, 
          objectFit: 'cover', 
          borderRadius: '8px', 
          cursor: onClick ? 'pointer' : 'default' 
        }} 
        onClick={onClick}
      />
    );
  }

  const scrollTo = (index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height, 
        borderRadius: '8px', 
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
      dir="rtl"
    >
      <div 
        className="embla" 
        ref={emblaRef} 
        style={{ overflow: 'hidden', height: '100%' }}
      >
        <div className="embla__container" style={{ display: 'flex', height: '100%' }}>
          {images.map((img, idx) => (
            <div className="embla__slide" key={idx} style={{ flex: '0 0 100%', minWidth: 0, position: 'relative' }}>
              <img 
                src={img}
                alt={`${alt} ${idx + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {showDots && scrollSnaps.length > 1 && (
        <div style={{ 
          position: 'absolute', 
          bottom: '10px', 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px', 
          zIndex: 2,
        }}>
          {scrollSnaps.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { 
                e.stopPropagation(); 
                scrollTo(idx);
              }}
              style={{
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                padding: 0, 
                border: 'none',
                background: idx === selectedIndex ? 'var(--primary-color)' : 'rgba(255,255,255,0.7)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                cursor: 'pointer', 
                transition: 'all 0.2s'
              }}
              aria-label={`Show image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
