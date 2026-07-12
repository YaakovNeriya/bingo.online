import React, { useState } from 'react';
import ImageCarousel from '../../../../components/ui/ImageCarousel';
import ImageLightbox from '../../../../components/ui/ImageLightbox';

const ProductImageGallery = ({ selectedSku, currentImageIndex, setCurrentImageIndex }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ImageCarousel 
          images={selectedSku?.image_urls || []} 
          alt={selectedSku?.color_name || "מוצר"} 
          height="400px" 
          onClick={() => {
            const currentImg = selectedSku?.image_urls?.[currentImageIndex];
            if (currentImg && (currentImg.includes('wistia.com') || currentImg.includes('wistia.net'))) {
              return; // Do nothing on video background click
            }
            setLightboxOpen(true);
          }}
          onPlayClick={() => setLightboxOpen(true)}
          showDots={true}
          onIndexChange={setCurrentImageIndex}
          duration={25}
        />
      </div>

      {lightboxOpen && selectedSku?.image_urls && selectedSku.image_urls.length > 0 && (
        <ImageLightbox 
          images={selectedSku.image_urls}
          initialIndex={currentImageIndex}
          alt={selectedSku.color_name} 
          onClose={() => setLightboxOpen(false)} 
        />
      )}
    </>
  );
};

export default ProductImageGallery;
