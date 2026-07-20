import React from 'react';
import ProductCard from './ProductCard';
import SkeletonCard from '../../../components/ui/SkeletonCard';

export const ProductGrid = ({
  isFetching,
  flattenedItems,
  visibleCount,
  loaderRef
}) => {
  if (isFetching) {
    return (
      <div className="product-category-container">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <>
      <div className="product-category-container">
        {flattenedItems.slice(0, visibleCount).map((item, idx) => {
          if (item.type === 'header') {
            return (
              <h2 
                key={`header-${item.data.id}`} 
                id={`category-section-${item.data.id}`} 
                className="category-title full-width-header"
              >
                {item.data.name}
              </h2>
            );
          } else {
            return <ProductCard key={`prod-${item.data.id}`} productModel={item.data} index={idx} />;
          }
        })}
      </div>
      
      {visibleCount < flattenedItems.length && (
        <div ref={loaderRef} style={{ height: '40px', width: '100%', marginTop: '2rem' }}></div>
      )}
    </>
  );
};
