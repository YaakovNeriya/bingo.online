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
    if (wistiaId && !wistiaCache[wistiaId]) {
      fetch(`https://fast.wistia.net/oembed?url=https://fast.wistia.net/embed/iframe/${wistiaId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.thumbnail_url) {
            const url = data.thumbnail_url.replace('?image_crop_resized=960x540', '');
            wistiaCache[wistiaId] = { thumb: url };
            setHighResThumb(url);
          }
        })
        .catch(err => console.error("Wistia data fetch error:", err));
    } else if (wistiaId && wistiaCache[wistiaId]) {
      setHighResThumb(wistiaCache[wistiaId].thumb);
    }
  }, [wistiaId]);

  if (!src) return null;
  
  if (wistiaId) {
    if (lightboxMode) {
      return (
        <div style={{ ...style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={className}>
          <iframe 
            src={`https://fast.wistia.net/embed/iframe/${wistiaId}?autoPlay=true`} 
            title="Video Player" 
            allow="autoplay; fullscreen" 
            allowtransparency="true" 
            frameBorder="0" 
            scrolling="no" 
            className="wistia_embed" 
            name="wistia_embed" 
            style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
          ></iframe>
        </div>
      );
    }

    return (
      <div 
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
