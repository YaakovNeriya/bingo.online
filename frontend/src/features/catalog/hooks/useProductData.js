import { useState, useEffect, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import client from '../../../api/client';
import { CatalogContext } from '../CatalogContext';

export const useProductData = (modelId) => {
  const location = useLocation();
  const { catalog, settings, isFetching: isCatalogLoading } = useContext(CatalogContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [productModel, setProductModel] = useState(null);
  
  // selectedSku controls the active color bubble and cart selection
  const [selectedSku, setSelectedSku] = useState(null);
  
  // currentImageIndex dictates the active slide in the unified media gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const minCutLength = parseFloat(settings['minimum_order_length']) || 1.0;
  const lowStockThreshold = parseInt(settings['low_stock_threshold']) || 20;

  // Set loading state based on catalog context
  useEffect(() => {
    if (isCatalogLoading) {
      setLoading(true);
    }
  }, [isCatalogLoading]);

  // Set model and fetch stock when catalog or modelId changes
  useEffect(() => {
    if (isCatalogLoading) return;
    if (!catalog || catalog.length === 0) {
      setLoading(false);
      setError('המוצר לא נמצא (הקטלוג ריק).');
      return;
    }
    
    let foundModel = null;
    for (const type of catalog) {
      const model = type.product_models.find(m => m.id === parseInt(modelId));
      if (model) {
        foundModel = { ...model, type_name: type.name, type_id: type.id };
        break;
      }
    }
    
    if (foundModel) {
      const modelCopy = JSON.parse(JSON.stringify(foundModel));
      setProductModel(modelCopy);
      
      // Pre-compute unified media locally just to find initial index based on URL
      const tempMedia = [];
      if (modelCopy.video_url) tempMedia.push({ url: modelCopy.video_url, type: 'video', skuId: null });
      if (modelCopy.image_url) tempMedia.push({ url: modelCopy.image_url, type: 'image', skuId: null });
      if (modelCopy.color_skus) {
        modelCopy.color_skus.forEach(sku => {
          if (sku.image_urls) {
            sku.image_urls.forEach(url => tempMedia.push({ url, type: 'image', skuId: sku.id }));
          }
        });
      }

      // Parse ?sku= param to set initial gallery index if navigating directly to a color
      const searchParams = new URLSearchParams(window.location.search);
      const skuParam = searchParams.get('sku');
      let initialIndex = 0;
      let initialSkuObj = null;

      if (skuParam) {
        const skuIdInt = parseInt(skuParam);
        const foundIndex = tempMedia.findIndex(m => m.skuId === skuIdInt);
        if (foundIndex !== -1) {
          initialIndex = foundIndex;
          initialSkuObj = modelCopy.color_skus.find(s => s.id === skuIdInt) || null;
        }
      }

      setCurrentImageIndex(initialIndex);
      setSelectedSku(initialSkuObj);
      
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Fetch Live Stock for this model in the background
      const fetchLiveStock = async () => {
        try {
          const res = await client.get(`/products/models/${modelId}/stock`);
          const stockDict = res.data; // { sku_id: stock_meters }
          
          setProductModel(prevModel => {
            if (!prevModel) return prevModel;
            const updatedModel = { ...prevModel };
            updatedModel.color_skus = updatedModel.color_skus.map(sku => ({
              ...sku,
              stock_meters: stockDict[sku.id] !== undefined ? stockDict[sku.id] : sku.stock_meters
            }));
            return updatedModel;
          });
        } catch (err) {
          console.error("Failed to fetch live stock for model", err);
        }
      };
      
      fetchLiveStock();
      
    } else {
      setError('המוצר לא נמצא.');
      setLoading(false);
    }
  }, [catalog, modelId, isCatalogLoading]);

  // Generate the Unified Media Array for the gallery components
  const unifiedMedia = useMemo(() => {
    if (!productModel) return [];
    
    const media = [];
    if (productModel.video_url) media.push({ url: productModel.video_url, type: 'video', skuId: null });
    if (productModel.image_url) media.push({ url: productModel.image_url, type: 'image', skuId: null });
    
    if (productModel.color_skus) {
      productModel.color_skus.forEach(sku => {
        if (sku.image_urls) {
          sku.image_urls.forEach(url => media.push({ url, type: 'image', skuId: sku.id }));
        }
      });
    }
    return media;
  }, [productModel]);

  // Sync selectedSku when currentImageIndex changes via swiping in gallery
  useEffect(() => {
    if (unifiedMedia.length > 0 && currentImageIndex >= 0 && currentImageIndex < unifiedMedia.length) {
      const currentMedia = unifiedMedia[currentImageIndex];
      if (currentMedia.skuId !== null) {
        const skuObj = productModel?.color_skus?.find(s => s.id === currentMedia.skuId);
        if (skuObj && (!selectedSku || selectedSku.id !== skuObj.id)) {
          setSelectedSku(skuObj);
        }
      } else {
        if (selectedSku !== null) {
          setSelectedSku(null);
        }
      }
    }
  }, [currentImageIndex, unifiedMedia, productModel, selectedSku]);

  // Compute related and random models
  const relatedModels = productModel && catalog && catalog.length > 0
    ? catalog
        .find(t => t.id === productModel.type_id)
        ?.product_models.filter(m => m.id !== productModel.id) || []
    : [];

  const randomModels = productModel && catalog && catalog.length > 0
    ? catalog
        .flatMap(t => t.product_models)
        .filter(m => m.id !== productModel.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
    : [];

  return {
    catalog,
    loading,
    error,
    productModel,
    selectedSku,
    setSelectedSku, // can still be used directly if needed, but usually we just change currentImageIndex
    currentImageIndex,
    setCurrentImageIndex,
    unifiedMedia,
    minCutLength,
    lowStockThreshold,
    relatedModels,
    randomModels
  };
};
