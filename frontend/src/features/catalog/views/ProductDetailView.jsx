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

const ProductDetailView = () => {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { fetchCartCount } = useContext(CartContext);
  
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
  } = useCartForm(modelId, selectedSku, minCutLength, fetchCartCount);

  if (loading) return <div className="container" style={{ paddingBottom: '2rem' }}>טוען...</div>;
  if (error) return <div className="container" style={{ paddingBottom: '2rem', color: 'var(--danger-color)' }}>{error}</div>;
  if (!productModel) return null;

  const currentPrice = selectedSku?.specific_price || productModel.base_price;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Breadcrumb / Top Navigation */}
      <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
        <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>חנות</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>{productModel.type_name}</span>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: 'var(--text-color)' }}>{productModel.name}</span>
      </div>

      {cartError && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(254, 226, 226, 0.95)',
          border: '1px solid #fca5a5',
          color: '#991b1b',
          padding: '1rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 9999,
          textAlign: 'center',
          fontWeight: '600',
          backdropFilter: 'blur(4px)',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          {cartError}
        </div>
      )}

      {cartSuccess && (
        <div style={{
          position: 'fixed',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(220, 252, 231, 0.95)',
          border: '1px solid #86efac',
          color: '#166534',
          padding: '1rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 9999,
          textAlign: 'center',
          fontWeight: '600',
          backdropFilter: 'blur(4px)',
          animation: 'fadeInDown 0.3s ease-out'
        }}>
          {cartSuccess}
        </div>
      )}

      {/* Main Product Section */}
      <div className="glass-panel product-desktop-grid">
        
        {/* Right Side (RTL) - Image Gallery */}
        <div className="grid-image">
          <ProductImageGallery 
            selectedSku={selectedSku} 
            currentImageIndex={currentImageIndex} 
            setCurrentImageIndex={setCurrentImageIndex} 
          />
        </div>

        {/* Right Side (RTL) Details - Under Image on Desktop */}
        <div className="grid-details">
          <ProductHeader 
            productModel={productModel} 
            selectedSku={selectedSku} 
            user={user} 
          />

          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {currentPrice}₪ <span style={{ fontSize: '1rem', color: 'var(--text-light)', fontWeight: 'normal' }}>/ מטר</span>
          </div>

          <ColorSelector 
            productModel={productModel} 
            selectedSku={selectedSku} 
            setSelectedSku={setSelectedSku} 
            setCurrentImageIndex={setCurrentImageIndex} 
          />
        </div>

        {/* Left Side (RTL) - Cart & Actions */}
        <div className="grid-cart">
          <AddToCartPanel 
            selectedSku={selectedSku} 
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
