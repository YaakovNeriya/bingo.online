import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

// Cache to avoid refetching Wistia data
const wistiaCache = {};

const SmartImage = ({ src, alt, style, className, hidePlayIcon = false, eager = false, lightboxMode = false, onPlayClick, ...props }) => {
  const [highResThumb, setHighResThumb] = useState(null);

  let wistiaId = '';
  if (typeof src === 'string' && (src.includes('wistia.com') || src.includes('wistia.net'))) {
    const reg = /(?:medias|iframe)\/([a-zA-Z0-9]+)/;
    const match = src.match(reg);
    if (match && match[1]) {
      wistiaId = match[1];
    } else {
      const cleanUrl = src.split('?')[0];
      const lastSegment = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
      if (lastSegment && lastSegment.length >= 8 && lastSegment.length <= 12 && /^[a-zA-Z0-9]+$/.test(lastSegment)) {
        wistiaId = lastSegment;
      }
    }
  }

  useEffect(() => {
    if (wistiaId) {
      if (!wistiaCache[wistiaId]) {
        const urlParam = encodeURIComponent(`https://fast.wistia.net/embed/iframe/${wistiaId}`);
        const fetchPromise = fetch(`https://fast.wistia.com/oembed?url=${urlParam}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.thumbnail_url) {
              const url = data.thumbnail_url.replace('?image_crop_resized=960x540', '');
              wistiaCache[wistiaId].thumb = url;
              return url;
            }
            return null;
          })
          .catch(err => {
            console.error("Wistia data fetch error:", err);
            return null;
          });
        wistiaCache[wistiaId] = { promise: fetchPromise };
        fetchPromise.then(url => { if (url) setHighResThumb(url); });
      } else if (wistiaCache[wistiaId].promise && !wistiaCache[wistiaId].thumb) {
        wistiaCache[wistiaId].promise.then(url => { if (url) setHighResThumb(url); });
      } else if (wistiaCache[wistiaId].thumb) {
        setHighResThumb(wistiaCache[wistiaId].thumb);
      }
    }
  }, [wistiaId]);

  const containerRef = React.useRef(null);
  const observerRef = React.useRef(null);
  const timeoutRef = React.useRef(null);

  useEffect(() => {
    if (wistiaId && !lightboxMode && containerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          timeoutRef.current = setTimeout(() => {
            // Only preload if still intersecting after 1.5s
            import('../../utils/WistiaSmartPreloader').then((module) => {
              module.WistiaSmartPreloader.preload(wistiaId);
              if (observerRef.current) observerRef.current.disconnect();
            });
          }, 2000);
        } else {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }
      });
      observerRef.current.observe(containerRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [wistiaId, lightboxMode]);

  useEffect(() => {
    if (lightboxMode && wistiaId && containerRef.current) {
      import('../../utils/WistiaSmartPreloader').then((module) => {
        let playerNode = module.WistiaSmartPreloader.getPlayerFor(wistiaId);
        if (!playerNode) {
          playerNode = document.createElement('wistia-player');
          playerNode.setAttribute('media-id', wistiaId);
          playerNode.setAttribute('preload', 'auto');
        }
        playerNode.setAttribute('autoplay', 'true');
        // Since we are moving it to the lightbox, re-enable play buttons/controls
        playerNode.removeAttribute('big-play-button');
        playerNode.muted = false;
        playerNode.removeAttribute('muted');
        
        playerNode.style.width = '100%';
        playerNode.style.height = '100%';
        playerNode.style.maxWidth = '100%';
        playerNode.style.maxHeight = '100%';
        
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(playerNode);
      });
      
      return () => {
        if (containerRef.current) {
           containerRef.current.innerHTML = '';
        }
      };
    }
  }, [lightboxMode, wistiaId]);

  if (!src) return null;
  
  if (wistiaId) {
    if (lightboxMode) {
      return (
        <div 
          ref={containerRef}
          style={{ ...style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          className={className}
          onClick={(e) => {
            if (props.onClick) props.onClick(e);
          }}
        >
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        style={{ ...style, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        className={className}
        onClick={(e) => {
          if (props.onClick) props.onClick(e);
        }}
      >
        <img 
          src={highResThumb || `https://fast.wistia.com/embed/medias/${wistiaId}/swatch`}
          alt={alt || 'Video'}
          loading={eager ? 'eager' : 'lazy'}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: style?.objectFit || 'cover',
            filter: highResThumb ? 'none' : 'blur(5px)',
            transition: 'filter 0.5s ease-out'
          }}
        />
        
        {!hidePlayIcon && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />
            
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10
              }}
            >
              <button 
                type="button"
                onClick={(e) => {
                  if (onPlayClick) {
                    e.stopPropagation();
                    onPlayClick(e);
                  }
                }}
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                  e.currentTarget.style.borderColor = 'white';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                }}
                title="נגן סרטון"
              >
                <Play size={28} fill="white" style={{ marginLeft: '4px' }} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return <img src={src} alt={alt} style={style} className={className} loading={eager ? 'eager' : 'lazy'} {...props} />;
};

export default SmartImage;
