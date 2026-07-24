import React from 'react';
import SmartImage from '../../../../components/ui/SmartImage';

const ColorSelector = ({ productModel, unifiedMedia, selectedSku, setSelectedSku, setCurrentImageIndex }) => {
  return (
    <div>
      <h4 style={{ marginBottom: '0.5rem' }}>בחר צבע:</h4>
      <div 
        className="color-scroll-container"
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto',
          paddingBottom: '12px',
          paddingTop: '6px',     
          paddingRight: '20px',
          paddingLeft: '20px',
          marginRight: '-20px',
          marginLeft: '-20px',
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
          maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
        }}
      >
        <style>{`
          .color-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {productModel.color_skus.map(sku => {
          const isOutOfStock = sku.stock_meters <= 0;
          const isSelected = selectedSku?.id === sku.id;
          const lastImage = sku.image_urls && sku.image_urls.length > 0 ? sku.image_urls[sku.image_urls.length - 1] : null;
          
          return (
            <div 
              key={sku.id} 
              onClick={() => {
                // Find first image index of this SKU in unifiedMedia
                const firstIndex = unifiedMedia.findIndex(m => m.skuId === sku.id);
                if (firstIndex !== -1) {
                  setCurrentImageIndex(firstIndex);
                } else {
                  // Fallback if no images found for this SKU
                  setSelectedSku(sku);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                opacity: isOutOfStock ? 0.5 : 1,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                padding: '3px',
                flexShrink: 0
              }}
              title={isOutOfStock ? 'אזל מהמלאי' : `מלאי: ${sku.stock_meters}מ'`}
            >
              <div style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                border: isSelected ? '3px solid var(--primary-color, #1A365D)' : '0px',
                boxShadow: isSelected 
                  ? '0 0 0 3px #ffffff, 0 0 0 5.5px var(--primary-color, #1A365D), 0 8px 18px rgba(0,0,0,0.2)' 
                  : '0 0px 0px rgba(0, 0, 0)',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {lastImage ? (
                  <SmartImage 
                    src={lastImage} 
                    alt={sku.color_name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>{sku.color_name.substring(0, 2)}</span>
                )}
                
                {isOutOfStock && (
                  <div style={{ 
                    position: 'absolute', 
                    width: '120%', 
                    height: '3px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.8)', 
                    transform: 'rotate(-45deg)' 
                  }} />
                )}
              </div>
              <span style={{ 
                fontSize: '0.95rem', 
                fontWeight: isSelected ? 'bold' : 'normal',
                color: isSelected ? '#1A365D' : 'var(--text-color)',
                textAlign: 'center',
                lineHeight: '1.15'
              }}>
                {sku.color_name.split(/\s+/).map((word, index, arr) => (
                  <React.Fragment key={index}>
                    {word}
                    {index < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 

export default ColorSelector;
