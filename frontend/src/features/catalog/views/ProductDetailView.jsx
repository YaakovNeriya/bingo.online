import React, { useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { CartContext } from '../../cart/CartContext';
import { useProductData } from '../hooks/useProductData';
import { useCartForm } from '../hooks/useCartForm';

// Sub-components
import ProductHeader from '../components/product/ProductHeader';
import ColorSelector from '../components/product/ColorSelector';
import ProductImageGallery from '../components/product/ProductImageGallery';
import AddToCartPanel from '../components/product/AddToCartPanel';
import RelatedProducts from '../components/product/RelatedProducts';
import Toast from '../../../components/ui/Toast';

const ProductDetailView = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { syncCartContext } = useContext(CartContext);
  
  // Hook 1: Product Data
  const {
    catalog,
    loading,
    error,
    productModel,
    selectedSku,
    setSelectedSku,
    currentImageIndex,
    setCurrentImageIndex,
    unifiedMedia,
    minCutLength,
    lowStockThreshold,
    relatedModels,
    randomModels
  } = useProductData(modelId);

  // Hook 2: Cart Form & Logic
  const {
    lengthMeters,
    setLengthMeters,
    units,
    setUnits,
    addingToCart,
    cartError,
    cartSuccess,
    handleAddToCart
  } = useCartForm(modelId, selectedSku, minCutLength, syncCartContext);

  if (loading) return <div className="container" style={{ paddingBottom: '2rem' }}>טוען...</div>;
  if (error) return <div className="container" style={{ paddingBottom: '2rem', color: 'var(--danger-color)' }}>{error}</div>;
  if (!productModel) return null;

  const activeSku = selectedSku || (productModel.color_skus && productModel.color_skus.length > 0 ? productModel.color_skus[0] : null);
  const currentPrice = activeSku?.specific_price || productModel.base_price;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Breadcrumb / Top Navigation */}
      <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-light)', display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>חנות</Link>
        <span style={{ margin: '0 0.4rem' }}>/</span>
        <span>{productModel.type_name}</span>
        <span style={{ margin: '0 0.4rem' }}>/</span>
        <span style={{ color: 'var(--text-color)' }}>{productModel.name}</span>
      </div>

      <Toast type="error" message={cartError} />
      <Toast type="success" message={cartSuccess} />

      {/* Main Product Section */}
      <div className="glass-panel product-desktop-grid">
        
        {/* Right Side (RTL) - Image Gallery */}
        <div className="grid-image">
          <ProductImageGallery 
            productModel={productModel}
            unifiedMedia={unifiedMedia}
            selectedSku={selectedSku} 
            setSelectedSku={setSelectedSku}
            currentImageIndex={currentImageIndex} 
            setCurrentImageIndex={setCurrentImageIndex} 
          />
        </div>

        {/* Right Side (RTL) Details - Under Image on Desktop */}
        <div className="grid-details">
          <ProductHeader 
            productModel={productModel} 
            selectedSku={activeSku} 
            user={user} 
          />

          <div style={{ fontSize: 'clamp(1.4rem, 5vw, 1.85rem)', fontWeight: 'bold', margin: '0.25rem 0' }}>
            {currentPrice}₪ <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 'normal' }}>/ מטר</span>
          </div>

          <ColorSelector 
            productModel={productModel} 
            unifiedMedia={unifiedMedia}
            selectedSku={selectedSku} 
            setSelectedSku={setSelectedSku} 
            setCurrentImageIndex={setCurrentImageIndex} 
          />
        </div>

        {/* Left Side (RTL) - Cart & Actions */}
        <div className="grid-cart">
          <AddToCartPanel 
            selectedSku={activeSku} 
            user={user} 
            currentPrice={currentPrice} 
            lengthMeters={lengthMeters} 
            setLengthMeters={setLengthMeters} 
            minCutLength={minCutLength} 
            lowStockThreshold={lowStockThreshold}
            units={units} 
            setUnits={setUnits} 
            addingToCart={addingToCart} 
            cartError={cartError} 
            cartSuccess={cartSuccess}
            handleAddToCart={handleAddToCart} 
          />
        </div>
        
      </div>

      <RelatedProducts 
        relatedModels={relatedModels} 
        randomModels={randomModels} 
        typeName={productModel.type_name} 
      />

    </div>
  );
};

export default ProductDetailView;
