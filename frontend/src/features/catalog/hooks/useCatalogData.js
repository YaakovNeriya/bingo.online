import { useMemo, useContext } from 'react';
import { CatalogContext } from '../CatalogContext';

export const useCatalogData = () => {
  const { catalog, settings, carouselImages, isFetching } = useContext(CatalogContext);

  const flattenedItems = useMemo(() => {
    const items = [];
    catalog.forEach(type => {
      items.push({ type: 'header', data: type });
      type.product_models.forEach(model => {
        items.push({ type: 'product', data: model, categoryId: type.id });
      });
    });
    return items;
  }, [catalog]);

  const getCategoryDisplayImage = (type) => {
    for (const model of type.product_models) {
      if (model.color_skus && model.color_skus.length > 0) {
        const sku = model.color_skus[0];
        if (sku.image_urls && sku.image_urls.length > 0) {
          return sku.image_urls[sku.image_urls.length - 1]; // Use last image (the texture)
        }
      }
    }
    return null;
  };

  return {
    catalog,
    settings,
    carouselImages,
    isFetching,
    flattenedItems,
    getCategoryDisplayImage
  };
};
