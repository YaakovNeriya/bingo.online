import React from 'react';
import { Lock } from 'lucide-react';

export const CartHeader = ({
  hasActiveOrder,
  handleToggleSendOrder,
  isSendingOrder,
  cartIsEmpty,
  isDeadlinePassed
}) => {
  return (
    <>
      <div className="cart-header-container" style={{ justifyContent: 'center', width: '100%' }}>
        <button 
          className={`btn send-order-btn ${hasActiveOrder ? 'sent' : ''}`}
          onClick={handleToggleSendOrder}
          disabled={isSendingOrder || (cartIsEmpty && !hasActiveOrder) || isDeadlinePassed}
          style={{ 
            opacity: (isSendingOrder || (cartIsEmpty && !hasActiveOrder) || isDeadlinePassed) ? 0.6 : 1,
            cursor: (isSendingOrder || (cartIsEmpty && !hasActiveOrder) || isDeadlinePassed) ? 'not-allowed' : 'pointer',
            backgroundColor: hasActiveOrder ? '#f59e0b' : '',
            width: '100%',
            maxWidth: '600px',
            fontSize: '1.2rem',
            padding: '1rem'
          }}
        >
          {isSendingOrder ? 'שולח...' : hasActiveOrder ? 'בטל והחזר לעגלה' : 'שלח הזמנה'}
        </button>
      </div>

      <div className="cart-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <h2 style={{ margin: 0, color: 'var(--text-color)', textAlign: 'center', fontSize: '1.6rem' }}>עגלת הקניות שלך</h2>
          {isDeadlinePassed && (
            <div style={{ background: '#fee2e2', color: '#9f1239', padding: '1rem', borderRadius: '8px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', width: '100%' }}>
              <Lock size={20} /> חלון ההזמנות נסגר. לא ניתן לשנות או לשלוח את העגלה.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
