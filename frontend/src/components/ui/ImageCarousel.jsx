import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import SmartImage from './SmartImage';

const ImageCarousel = ({ unifiedMedia, images, activeIndex, alt, height = '200px', aspectRatio, onClick, onPlayClick, showDots = true, onIndexChange, autoPlay = false, autoPlayInterval = 5000, isFullScreen = false, duration = 80 }) => {
  // Normalize legacy `images` array into unifiedMedia format
  const normalizedMedia = React.useMemo(() => {
    if (unifiedMedia && unifiedMedia.length > 0) return unifiedMedia;
    if (images && images.length > 0) {
      return images.map(img => ({ url: img, type: 'image', skuId: null }));
    }
    return [];
  }, [unifiedMedia, images]);

  // Conditionally include autoplay plugin, memoized to prevent re-initialization
  const plugins = React.useMemo(() => {
    return (autoPlay && normalizedMedia && normalizedMedia.length > 1 && !isFullScreen) 
      ? [Autoplay({ delay: autoPlayInterval, stopOnInteraction: true, stopOnMouseEnter: true })] 
      : [];
  }, [autoPlay, normalizedMedia, isFullScreen, autoPlayInterval]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    direction: 'rtl', // Native RTL support!
    duration: duration // Customizable transition speed
  }, plugins);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);

  const scrollPrev = useCallback((e) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    if (idx !== selectedIndex) {
      setSelectedIndex(idx);
      if (onIndexChange) onIndexChange(idx);
    }
  }, [emblaApi, onIndexChange, selectedIndex]);

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

  // Sync activeIndex from props to carousel
  useEffect(() => {
    if (emblaApi && activeIndex !== undefined && activeIndex !== selectedIndex) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, activeIndex, selectedIndex]);

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

  if (!normalizedMedia || normalizedMedia.length === 0) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height, 
          aspectRatio,
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

  // If there's only one media item, no need for carousel logic
  if (normalizedMedia.length === 1) {
    return (
      <SmartImage 
        src={normalizedMedia[0].url} 
        alt={alt} 
        style={{ 
          width: '100%', 
          height, 
          aspectRatio,
          objectFit: 'cover', 
          borderRadius: '8px', 
          cursor: onClick ? 'pointer' : 'default'
        }} 
        onClick={onClick}
        onPlayClick={onPlayClick}
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
        aspectRatio,
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
          {normalizedMedia.map((media, idx) => (
            <div className="embla__slide" key={idx} style={{ flex: '0 0 100%', minWidth: 0, position: 'relative' }}>
              <SmartImage 
                src={media.url}
                alt={`${alt} ${idx + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block'
                }}
                onPlayClick={onPlayClick}
              />
            </div>
          ))}
        </div>
      </div>
      
      {normalizedMedia.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            style={{
              position: 'absolute',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0)',
              border: 'none',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              color: '#334155'
            }}
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={scrollNext}
            style={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0)',
              border: 'none',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              color: '#334155'
            }}
          >
            <ChevronLeft size={20} />
          </button>
        </>
      )}
      
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
