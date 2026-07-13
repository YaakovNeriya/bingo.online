import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import client from '../../../api/client';
import { CatalogContext } from '../CatalogContext';

export const useProductData = (modelId) => {
  const location = useLocation();
  const { catalog, settings, isFetching: isCatalogLoading } = useContext(CatalogContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [productModel, setProductModel] = useState(null);
  const [selectedSku, setSelectedSku] = useState(null);
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
      // Deep copy to allow patching stock without mutating context
      const modelCopy = JSON.parse(JSON.stringify(foundModel));
      setProductModel(modelCopy);
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

  // Select SKU when productModel updates or URL search params change
  useEffect(() => {
    if (!productModel || !productModel.color_skus || productModel.color_skus.length === 0) return;
    
    let targetSku = productModel.color_skus[0];
    
    // Parse the ?sku= ID from the URL if present
    const searchParams = new URLSearchParams(location.search);
    const skuParam = searchParams.get('sku');
    if (skuParam) {
      const matchedSku = productModel.color_skus.find(s => s.id === parseInt(skuParam));
      if (matchedSku) {
        targetSku = matchedSku;
      }
    }
    
    setSelectedSku(targetSku);
    
    // Only reset image index if the actual SKU ID changed to avoid resetting on stock update
    setSelectedSku(prevSku => {
      if (!prevSku || prevSku.id !== targetSku.id) {
        setCurrentImageIndex(0);
      }
      return targetSku;
    });
    
  }, [productModel, location.search]);

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
    setSelectedSku,
    currentImageIndex,
    setCurrentImageIndex,
    minCutLength,
    lowStockThreshold,
    relatedModels,
    randomModels
  };
};
