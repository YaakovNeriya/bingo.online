import React, { useContext, useState } from 'react';
import { AuthContext } from '../../auth/AuthContext';
import { useCartState } from '../hooks/useCartState';
import { useCartActions } from '../hooks/useCartActions';
import { CartHeader } from '../components/CartHeader';
import { CartItemCard } from '../components/CartItemCard';
import { CartEditModal } from '../components/CartEditModal';
import { CreditCard } from 'lucide-react';

const CartView = () => {
  const { user } = useContext(AuthContext);
  const [showPaymentMsg, setShowPaymentMsg] = useState(false);

  const {
    cart,
    activeOrder,
    error,
    setError,
    minCutLength,
    selectedItems,
    toggleItemSelection,
    fetchCart,
    editingItem,
    setEditingItem,
    editLength,
    setEditLength,
    editUnits,
    setEditUnits,
    displayItems,
    cartTotalPrice,
    setItemSelection,
    syncCartState
  } = useCartState();

  const {
    confirmDeleteId,
    isSendingOrder,
    handleSaveEdit,
    onTrashClick,
    handleToggleSendOrder,
    handleToggleItem,
    updatingItems
  } = useCartActions({
    cart,
    activeOrder,
    fetchCart,
    selectedItems,
    editingItem,
    editUnits,
    editLength,
    minCutLength,
    setEditingItem,
    setError,
    toggleItemSelection,
    setItemSelection,
    syncCartState
  });

  const isDeadlinePassed = user?.applicable_deadline && new Date() > new Date(user.applicable_deadline);

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditLength(parseFloat(item.length_meters));
    setEditUnits(item.units);
  };

  if (!cart) return <div className="container">{error || 'טוען...'}</div>;

  const hasActiveOrder = !!activeOrder;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <CartHeader 
        hasActiveOrder={hasActiveOrder}
        handleToggleSendOrder={handleToggleSendOrder}
        isSendingOrder={isSendingOrder}
        cartIsEmpty={cart.items.length === 0}
        isDeadlinePassed={isDeadlinePassed}
      />

      {error && (
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
          {error}
        </div>
      )}
      
      <div className="glass-panel cart-panel">
        {displayItems.length === 0 ? (
          <p>העגלה שלך ריקה.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {displayItems.map(item => (
                <CartItemCard 
                  key={item.unique_id}
                  item={item}
                  selectedItems={selectedItems}
                  toggleItemSelection={() => handleToggleItem(item)}
                  isDeadlinePassed={isDeadlinePassed}
                  onTrashClick={onTrashClick}
                  confirmDeleteId={confirmDeleteId}
                  openEditModal={item.is_order_item ? undefined : openEditModal}
                  isUpdating={updatingItems[item.unique_id]}
                />
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37,99,235,0.05)', padding: '0.75rem 1rem', borderRadius: '12px', gap: '0.5rem' }}>
              <div style={{ flexShrink: 0 }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>סה"כ לתשלום</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1', marginTop: '0.1rem' }}>
                  ₪{cartTotalPrice}
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowPaymentMsg(true);
                  setTimeout(() => setShowPaymentMsg(false), 3000);
                }}
                style={{ opacity: showPaymentMsg ? 1 : 0.8, padding: '0.5rem 1rem', fontSize: '0.95rem', borderRadius: '999px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, transition: 'all 0.3s', minWidth: '160px', justifyContent: 'center' }}
              >
                <CreditCard size={22} /> {showPaymentMsg ? 'התשלום ייגבה בהמשך' : 'לתשלום מאובטח'}
              </button>
            </div>
          </>
        )}
      </div>

      <CartEditModal 
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        editLength={editLength}
        setEditLength={setEditLength}
        minCutLength={minCutLength}
        editUnits={editUnits}
        setEditUnits={setEditUnits}
        handleSaveEdit={handleSaveEdit}
      />
    </div>
  );
};

export default CartView;
