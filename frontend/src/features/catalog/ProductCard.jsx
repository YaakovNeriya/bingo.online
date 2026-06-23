import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../../components/ImageCarousel';

const ProductCard = ({ productModel }) => {
  const navigate = useNavigate();
  if (!productModel || productModel.color_skus.length === 0) return null;

  // Use the first SKU for display image and base info
  const displaySku = productModel.color_skus[0];
  const currentPrice = displaySku.specific_price || productModel.base_price;

  return (
    <div 
      className="glass-panel hover-lift" 
      onClick={() => navigate(`/product/${productModel.id}`)}
      style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', cursor: 'pointer' }}
    >
      <ImageCarousel 
        images={displaySku.image_urls} 
        alt={displaySku.color_name} 
        height="200px" 
        onClick={() => navigate(`/product/${productModel.id}`)}
        showDots={true}
      />
      
      <h3 style={{ marginBottom: '0', color: 'var(--primary-color)' }}>{productModel.name}</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          {currentPrice}₪ <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 'normal' }}>/ מטר</span>
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-light)' }}>
          גובה: {productModel.fabric_height}מ'
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: 'auto' }}>
        {productModel.color_skus.map(sku => (
          <span 
            key={sku.id} 
            title={`${sku.color_name} (מלאי: ${sku.stock_meters}מ')`}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              background: parseFloat(sku.stock_meters) > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: parseFloat(sku.stock_meters) > 0 ? 'var(--text-color)' : 'var(--danger-color)',
              border: `1px solid ${parseFloat(sku.stock_meters) > 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}
          >
            {sku.color_name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductCard;
