import React, { useState } from 'react';
import ImageCarousel from '../../../../components/ui/ImageCarousel';
import ImageLightbox from '../../../../components/ui/ImageLightbox';

const ProductImageGallery = ({ productModel, selectedSku, setSelectedSku, currentImageIndex, setCurrentImageIndex }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Construct unified mediaItems array: [Model Video, Model Image, Color SKU Images...]
  const mediaItems = React.useMemo(() => {
    if (!productModel) return [];
    const items = [];

    // 1. Model Video
    if (productModel.video_url) {
      items.push({
        type: 'video',
        url: productModel.video_url,
        skuId: null,
        sku: null
      });
    }

    // 2. Model Image
    if (productModel.image_url) {
      items.push({
        type: 'image',
        url: productModel.image_url,
        skuId: null,
        sku: null
      });
    }

    // 3. Color SKUs Images
    if (productModel.color_skus) {
      productModel.color_skus.forEach(sku => {
        if (sku.image_urls && sku.image_urls.length > 0) {
          sku.image_urls.forEach(url => {
            items.push({
              type: 'image',
              url: url,
              skuId: sku.id,
              sku: sku
            });
          });
        }
      });
    }

    return items;
  }, [productModel]);

  // Target index for active selectedSku jump (swatch click)
  const targetIndex = React.useMemo(() => {
    if (!selectedSku || mediaItems.length === 0) return undefined;
    const foundIdx = mediaItems.findIndex(item => item.skuId === selectedSku.id);
    return foundIdx !== -1 ? foundIdx : undefined;
  }, [selectedSku, mediaItems]);

  const currentItem = mediaItems[currentImageIndex];
  const allUrls = mediaItems.map(item => item.url);

  return (
    <>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <ImageCarousel 
          images={mediaItems} 
          alt={productModel?.name || "מוצר"} 
          aspectRatio="1 / 1"
          height="auto"
          targetIndex={targetIndex}
          onClick={() => {
            if (currentItem && currentItem.type === 'video') return;
            setLightboxOpen(true);
          }}
          onPlayClick={() => setLightboxOpen(true)}
          showDots={true}
          onIndexChange={(idx) => {
            setCurrentImageIndex(idx);
            const item = mediaItems[idx];
            if (item) {
              setSelectedSku(item.sku);
            }
          }}
          duration={25}
        />
      </div>

      {lightboxOpen && allUrls.length > 0 && (
        <ImageLightbox 
          images={allUrls}
          initialIndex={currentImageIndex}
          alt={productModel?.name} 
          onClose={() => setLightboxOpen(false)} 
        />
      )}
    </>
  );
};

export default ProductImageGallery;
