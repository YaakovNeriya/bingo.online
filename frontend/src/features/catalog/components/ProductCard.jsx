import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../../../components/ui/SmartImage';
import ImageLightbox from '../../../components/ui/ImageLightbox';

const ProductCard = ({ productModel, index = 999 }) => {
  const navigate = useNavigate();
  if (!productModel || productModel.color_skus.length === 0) return null;

  const [activeSku, setActiveSku] = useState(productModel.color_skus[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const rawPrice = activeSku.specific_price || productModel.base_price;
  const currentPrice = Number(rawPrice) % 1 === 0 ? Number(rawPrice) : parseFloat(Number(rawPrice).toFixed(2));

  const activeImage = activeSku.image_urls && activeSku.image_urls.length > 0
    ? activeSku.image_urls[0]
    : null;

  return (
    <>
      <div
        className="product-card-glass hover-lift mobile-edge-card"
        onClick={() => navigate(`/product/${productModel.id}?sku=${activeSku.id}`)}
      >
        <div className="mobile-edge-image">
          {activeImage ? (
            <SmartImage
              src={activeImage}
              alt={productModel.name}
              className="product-card-img-full"
              eager={index < 6}
              onPlayClick={() => setLightboxOpen(true)}
            />
          ) : (
            <div className="product-card-no-img">אין תמונה</div>
          )}
        </div>
        <div className="mobile-edge-content">
          <div className="product-card-header">
            <h3 className="product-card-title">{productModel.name}</h3>
            <div className="product-card-price">
              {currentPrice}₪ <span className="product-card-price-unit">/ מטר</span>
            </div>
            {productModel.fabric_height && (
              <div className="product-card-height">
                גובה {productModel.fabric_height}מ'
              </div>
            )}
          </div>

          <div className="product-swatches-container">
            {productModel.color_skus.slice(0, 5).map(sku => {
              const lastImage = sku.image_urls && sku.image_urls.length > 0 ? sku.image_urls[sku.image_urls.length - 1] : null;
              const inStock = parseFloat(sku.stock_meters) > 0;
              const isActive = sku.id === activeSku.id;
              const swatchClass = `color-swatch-bubble ${isActive ? 'active' : (inStock ? 'in-stock' : '')}`;

              return (
                <div
                  key={sku.id}
                  title={`${sku.color_name} (מלאי: ${sku.stock_meters}מ')`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSku(sku);
                  }}
                  className={swatchClass}
                >
                  {lastImage ? (
                    <SmartImage
                      src={lastImage}
                      alt={sku.color_name}
                      className="product-card-img-full"
                      style={{ opacity: inStock ? 1 : 0.5 }}
                      hidePlayIcon={true}
                    />
                  ) : (
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-light)' }}>{sku.color_name.substring(0, 2)}</span>
                  )}

                  {!inStock && <div className="color-swatch-out-of-stock-line" />}
                </div>
              );
            })}

            {productModel.color_skus.length > 5 && (
              <div
                title={`עוד ${productModel.color_skus.length - 5} צבעים`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${productModel.id}?sku=${activeSku.id}`);
                }}
                className="color-swatch-more-bubble"
              >
                +{productModel.color_skus.length - 5}
              </div>
            )}
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
