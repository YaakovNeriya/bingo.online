import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartImage from '../../../components/ui/SmartImage';
import ImageLightbox from '../../../components/ui/ImageLightbox';
import { MoveVertical, Play } from 'lucide-react';

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
          {/* Card Badges (Over Image) */}
          {productModel.video_url && (
            <div className="card-badges-container">
              <div className="card-badge video-badge">
                <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />
              </div>
            </div>
          )}

          {/* Mobile View Model Image */}
          <div className="mobile-only-img-wrapper">
            {productModel.image_url ? (
              <SmartImage
                src={productModel.image_url}
                alt={productModel.name}
                className="product-card-img-full"
                eager={index < 2}
              />
            ) : (
              <div className="product-card-no-img">אין תמונה</div>
            )}
          </div>

          {/* Desktop View SKU Image */}
          <div className="desktop-only-img-wrapper">
            {activeImage ? (
              <SmartImage
                src={activeImage}
                alt={productModel.name}
                className="product-card-img-full"
                eager={index < 2}
                onPlayClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="product-card-no-img">אין תמונה</div>
            )}
          </div>
        </div>
        <div className="mobile-edge-content">
          <div className="product-card-header">
            {/* Line 1: Model Name & Height */}
            <div className="product-card-row">
              <h3 className="product-card-title">{productModel.name}</h3>
              {productModel.fabric_height && (
                <div className="product-card-height">
                  <MoveVertical className="product-height-icon" />
                  <span>{productModel.fabric_height}מ'</span>
                </div>
              )}
            </div>

            {/* Line 2: Price & Color Swatch Stack */}
            <div className="product-card-row product-card-subrow">
              <div className="product-card-price">
                {currentPrice}₪ <span className="product-card-price-unit">/ מטר</span>
              </div>
              {productModel.color_skus && productModel.color_skus.length > 0 && (
                <div className="product-card-swatch-stack">
                  <div className="swatch-stack-bubbles">
                    {productModel.color_skus.slice(0, 2).map((sku) => {
                      const imgUrl = sku.image_urls && sku.image_urls.length > 0 ? sku.image_urls[sku.image_urls.length - 1] : null;
                      return (
                        <div key={sku.id} className="swatch-stack-bubble">
                          {imgUrl ? (
                            <img src={imgUrl} alt={sku.color_name} />
                          ) : (
                            <span className="swatch-stack-text">{sku.color_name.substring(0, 2)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {productModel.color_skus.length > 2 && (
                    <span className="swatch-stack-more">{productModel.color_skus.length - 2}+</span>
                  )}
                </div>
              )}
            </div>
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
