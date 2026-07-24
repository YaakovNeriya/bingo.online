import React, { useState } from 'react';
import ImageCarousel from '../../../../components/ui/ImageCarousel';
import ImageLightbox from '../../../../components/ui/ImageLightbox';

const ProductImageGallery = ({ productModel, unifiedMedia, selectedSku, setSelectedSku, currentImageIndex, setCurrentImageIndex }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <ImageCarousel 
          unifiedMedia={unifiedMedia} 
          activeIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
          alt={productModel?.name || "מוצר"} 
          aspectRatio="1 / 1"
          height="auto"
          onClick={() => {
            const currentImg = unifiedMedia?.[currentImageIndex];
            if (currentImg && currentImg.type === 'video') {
              return; // Do nothing on video background click
            }
            setLightboxOpen(true);
          }}
          onPlayClick={() => setLightboxOpen(true)}
          showDots={true}
          duration={25}
        />
        
        {/* Elegant Color Tag */}
        {(() => {
          const currentMedia = unifiedMedia?.[currentImageIndex];
          if (!currentMedia || !currentMedia.skuId) return null;
          
          const currentSku = productModel?.color_skus?.find(s => s.id === currentMedia.skuId);
          if (!currentSku || !currentSku.color_name) return null;

          return (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(79, 80, 80, 0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '99px',
              fontSize: '0.8rem',
              fontWeight: '500',
              // boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <span style={{ fontWeight: 'bold', textAlign: 'center', lineHeight: '1.1' }}>
                {currentSku.color_name.split(/\s+/).map((word, index, arr) => (
                  <React.Fragment key={index}>
                    {word}
                    {index < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </span>
            </div>
          );
        })()}
      </div>

      {lightboxOpen && unifiedMedia && unifiedMedia.length > 0 && (
        <ImageLightbox 
          unifiedMedia={unifiedMedia}
          initialIndex={currentImageIndex}
          alt={productModel?.name || "מוצר"} 
          onClose={(lastIndex) => {
            if (lastIndex !== undefined) {
              setCurrentImageIndex(lastIndex);
            }
            setLightboxOpen(false);
          }} 
        />
      )}
    </>
  );
};

export default ProductImageGallery;
