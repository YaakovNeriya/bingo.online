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
