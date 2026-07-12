import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../../../components/ui/SmartImage';
import ImageLightbox from '../../../components/ui/ImageLightbox';

const ProductCard = ({ productModel, index = 999 }) => {
  const navigate = useNavigate();
  if (!productModel || productModel.color_skus.length === 0) return null;

  const [activeSku, setActiveSku] = useState(productModel.color_skus[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const currentPrice = activeSku.specific_price || productModel.base_price;
  
  const activeImage = activeSku.image_urls && activeSku.image_urls.length > 0 
    ? activeSku.image_urls[0] 
    : null;

  return (
    <>
    <div 
      className="product-card-glass hover-lift mobile-edge-card" 
      onClick={() => navigate(`/product/${productModel.id}?sku=${activeSku.id}`)}
      style={{ display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer' }}
    >
      <div className="mobile-edge-image" style={{ aspectRatio: '1 / 1', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
        {activeImage ? (
          <SmartImage 
            src={activeImage} 
            alt={productModel.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            eager={index < 6}
            onPlayClick={() => setLightboxOpen(true)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>אין תמונה</div>
        )}
      </div>
      
      <div className="mobile-edge-content" style={{ padding: '0.9rem', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
        <h3 style={{ marginBottom: '0', color: 'var(--primary-color)' }}>{productModel.name}</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          {currentPrice}₪ <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 'normal' }}>/ מטר</span>
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-light)' }}>
          גובה: {productModel.fabric_height}מ'
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem' }}>
        {productModel.color_skus.map(sku => {
          const lastImage = sku.image_urls && sku.image_urls.length > 0 ? sku.image_urls[sku.image_urls.length - 1] : null;
          const inStock = parseFloat(sku.stock_meters) > 0;
          return (
            <div 
              key={sku.id} 
              title={`${sku.color_name} (מלאי: ${sku.stock_meters}מ')`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSku(sku);
              }}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: inStock ? '2px solid #E8DCC4' : '2px solid #cbd5e1', /* Champagne/gold border */
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {lastImage ? (
                <SmartImage 
                  src={lastImage} 
                  alt={sku.color_name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: inStock ? 1 : 0.5 }}
                  hidePlayIcon={true}
                />
              ) : (
                <span style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>{sku.color_name.substring(0, 2)}</span>
              )}
              
              {/* Crossed out line if out of stock */}
              {!inStock && (
                <div style={{ 
                  position: 'absolute', 
                  width: '120%', 
                  height: '2px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.8)', 
                  transform: 'rotate(-45deg)' 
                }} />
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
    {lightboxOpen && activeImage && (
      <ImageLightbox 
        images={[activeImage]}
        alt={productModel.name} 
        onClose={() => setLightboxOpen(false)} 
      />
    )}
    </>
  );
};

export default ProductCard;
// Force Vite reload
