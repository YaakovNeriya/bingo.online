import React, { createContext, useState, useEffect, useMemo } from 'react';
import client from '../../api/client';

export const CatalogContext = createContext();

export const CatalogProvider = ({ children }) => {
  const [catalog, setCatalog] = useState([]);
  const [settings, setSettings] = useState({});
  const [carouselImages, setCarouselImages] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const initCatalog = async () => {
      try {
        const [catalogRes, settingsRes] = await Promise.all([
          client.get('/products/catalog'),
          client.get('/products/public/settings')
        ]);
        
        setCatalog(catalogRes.data || []);
        
        const settingsData = settingsRes.data || {};
        setSettings(settingsData);
        
        if (settingsData.carousel_images) {
          try {
            setCarouselImages(JSON.parse(settingsData.carousel_images));
          } catch (e) {
            console.error("Failed to parse carousel images", e);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial catalog data", err);
      } finally {
        setIsFetching(false);
      }
    };

    initCatalog();
  }, []);

  const value = useMemo(() => ({
    catalog,
    settings,
    carouselImages,
    isFetching,
    // Provide a way to manually refresh if needed
    refreshCatalog: async () => {
      try {
        const res = await client.get('/products/catalog');
        setCatalog(res.data || []);
      } catch (e) {}
    }
  }), [catalog, settings, carouselImages, isFetching]);

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};
