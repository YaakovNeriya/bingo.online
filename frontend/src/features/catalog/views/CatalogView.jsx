import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import { useCatalogData } from '../hooks/useCatalogData';
import { useCatalogScroll } from '../hooks/useCatalogScroll';
import { CatalogHero } from '../components/CatalogHero';
import { CategoryBubbles } from '../components/CategoryBubbles';
import { ProductGrid } from '../components/ProductGrid';
import { AboutBanner } from '../components/AboutBanner';

const CatalogView = () => {
  const { user } = useContext(AuthContext);

  const {
    catalog,
    settings,
    carouselImages,
    isFetching,
    flattenedItems,
    getCategoryDisplayImage
  } = useCatalogData();

  const {
    visibleCount,
    loaderRef,
    scrollToCategory
  } = useCatalogScroll({ isFetching, flattenedItems });

  useEffect(() => {
    // Only preload once catalog is fully fetched, so we don't compete with network requests
    if (!isFetching) {
      const timer = setTimeout(() => {
        import('./ProductDetailView').catch(() => {
          // Preload failed silently — component will just load normally when needed
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  return (
    <div className="container">
      <CatalogHero 
        carouselImages={carouselImages} 
        settings={settings} 
        user={user} 
      />

      <CategoryBubbles 
        catalog={catalog} 
        getCategoryDisplayImage={getCategoryDisplayImage} 
        scrollToCategory={scrollToCategory} 
      />

      <ProductGrid 
        isFetching={isFetching} 
        flattenedItems={flattenedItems} 
        visibleCount={visibleCount} 
        loaderRef={loaderRef} 
      />

      <AboutBanner settings={settings} />
    </div>
  );
};

export default CatalogView;
