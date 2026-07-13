import React from 'react';
import ProductCard from '../ProductCard';

const RelatedProducts = ({ relatedModels, randomModels, typeName }) => {
  return (
    <>
      {/* Related Models (Same Category) */}
      {relatedModels.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>דגמים נוספים ב{typeName}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {relatedModels.map(model => (
              <ProductCard key={model.id} productModel={model} />
            ))}
          </div>
        </div>
      )}

      {/* Random Suggestions */}
      {randomModels.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-color)' }}>אולי תאהב גם...</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {randomModels.map(model => (
              <ProductCard key={model.id} productModel={model} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default RelatedProducts;
