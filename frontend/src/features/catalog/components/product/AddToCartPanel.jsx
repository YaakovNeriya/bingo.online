import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import AddToCartButton from '../../../../components/ui/AddToCartButton';
import FabricLengthSlider from '../../../../components/ui/FabricLengthSlider';
import SocialShareCard from '../../../../components/ui/SocialShareCard';
import { CartContext } from '../../../cart/CartContext';

const AddToCartPanel = ({ 
  selectedSku, 
  user, 
  currentPrice, 
  lengthMeters, 
  setLengthMeters, 
  minCutLength, 
  lowStockThreshold,
  units, 
  setUnits, 
  addingToCart, 
  cartError,
  cartSuccess,
  handleAddToCart 
}) => {
  const navigate = useNavigate();
  const { cartItems } = React.useContext(CartContext);

  const isInCart = selectedSku && cartItems?.some(item => item.color_sku?.id === selectedSku.id || item.sku?.id === selectedSku.id);
  const [showShareCard, setShowShareCard] = React.useState(false);

  React.useEffect(() => {
    let showTimer;
    if (cartSuccess && isInCart) {
      // Delay showing if just added successfully
      showTimer = setTimeout(() => setShowShareCard(true), 3000);
    } else if (isInCart && !cartSuccess) {
      // If already in cart from before, show immediately
      setShowShareCard(true);
    } else if (!isInCart) {
      setShowShareCard(false);
    }
    return () => clearTimeout(showTimer);
  }, [isInCart, cartSuccess]);

  return (
    <>


      <div className="fabric-slider-wrapper" style={{ marginTop: '2rem' }}>
        <FabricLengthSlider 
          value={lengthMeters} 
          onChange={setLengthMeters} 
          min={minCutLength} 
          max={selectedSku ? selectedSku.stock_meters : 0} 
        />
        
        {/* Stock Indicator Below Slider Bubble */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          {selectedSku && selectedSku.stock_meters > 0 && selectedSku.stock_meters <= lowStockThreshold ? (
            <div style={{ 
              color: '#b45309', 
              fontWeight: 'bold', 
              fontSize: '1rem', 
              background: '#fef3c7', 
              display: 'inline-flex', 
              alignItems: 'center',
              padding: '0.3rem 1rem', 
              borderRadius: '1rem', 
              boxShadow: '0 2px 4px rgba(217, 119, 6, 0.1)'
            }}>
              נשאר רק {selectedSku.stock_meters} מטרים במלאי
            </div>
          ) : (
            <div style={{ color: 'var(--text-light)' }}>
              במלאי: <strong>{selectedSku?.stock_meters}</strong> מטרים
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 0, background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 'bold' }}>כמות יחידות</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', borderRadius: '30px', padding: '0.25rem' }}>
              <button 
                onClick={() => setUnits(Math.max(1, units - 1))} 
                disabled={!selectedSku || selectedSku.stock_meters < 0.1 || units <= 1}
                style={{ 
                  background: 'var(--primary-color)', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  border: 'none', 
                  cursor: (!selectedSku || selectedSku.stock_meters < 0.1 || units <= 1) ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 4px 8px',
                  transition: '0.2s',
                  opacity: (!selectedSku || selectedSku.stock_meters < 0.1 || units <= 1) ? 0.5 : 1 
                }}
              >
                <Minus size={24} />
              </button>
              <input 
                type="text" 
                min="1" 
                step="1" 
                value={units} 
                onChange={e => setUnits(parseInt(e.target.value) || 0)}
                disabled={!selectedSku || selectedSku.stock_meters < 0.1}
                style={{ width: '50px', textAlign: 'center', fontSize: '1.6rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontWeight: 'bold' }}
              />
              <button 
                onClick={() => setUnits(units + 1)} 
                disabled={!selectedSku || selectedSku.stock_meters < 0.1}
                style={{ 
                  background: 'var(--primary-color)', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  border: 'none', 
                  cursor: (!selectedSku || selectedSku.stock_meters < 0.1) ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 4px 8px',
                  transition: '0.2s',
                  opacity: (!selectedSku || selectedSku.stock_meters < 0.1) ? 0.5 : 1 
                }}
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(59, 130, 246, 0.05)', padding: '1rem 2rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', width: '100%' }}>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 'bold', marginBottom: '0.25rem' }}>סה"כ לתשלום:</span>
            <span style={{ fontSize: '2.4rem', fontWeight: 'bold', color: 'var(--primary-color)', lineHeight: 1.2 }}>
              {(Math.round(Math.round((currentPrice || 0) * 100) * Math.round(lengthMeters * 10) * units / 10) / 100).toFixed(2)} ₪
            </span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              {lengthMeters.toFixed(1)} מטרים, {units === 1 ? 'יחידה אחת' : `${units} יחידות`}
            </span>
          </div>
        </div>

        {!user ? (
          <button 
            className="btn btn-primary hover-lift" 
            onClick={() => navigate('/login')} 
            style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: '#3b82f6', borderRadius: '12px' }}
          >
            התחבר כדי להוסיף לעגלה
          </button>
        ) : (
          <AddToCartButton 
            onClick={handleAddToCart} 
            disabled={!selectedSku || selectedSku.stock_meters < 0.1 || addingToCart}
            style={{ width: '100%' }}
          >
            {!selectedSku || selectedSku.stock_meters < 0.1 ? 'אזל במלאי' : addingToCart ? 'מוסיף...' : (
              <>
                הוסף לעגלה <ShoppingCart size={24} />
              </>
            )}
            </AddToCartButton>
          )}
        
        {showShareCard && (
          <SocialShareCard />
        )}
      </div>
    </>
  );
};

export default AddToCartPanel;
