import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import SmartImage from '../../../components/ui/SmartImage';
import ShareWidget from '../../../components/ui/ShareWidget';

export const CartItemCard = ({
  item,
  selectedItems,
  toggleItemSelection,
  isDeadlinePassed,
  onTrashClick,
  confirmDeleteId,
  openEditModal
}) => {
  const pricePerMeter = item.color_sku.specific_price ?? item.color_sku.product_model.base_price;
  // Calculate using integer cents to avoid floating point errors
  const lengthCm = Math.round(parseFloat(item.length_meters) * 100);
  const priceAgorot = Math.round(parseFloat(pricePerMeter) * 100);
  const rowTotal = (Math.round((lengthCm * item.units * priceAgorot) / 100) / 100).toFixed(2);
  
  const lastImage = item.color_sku.image_urls && item.color_sku.image_urls.length > 0 
    ? item.color_sku.image_urls[item.color_sku.image_urls.length - 1] 
    : null;

  return (
    <div className="cart-item-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
      
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Status Icon */}
        <div className="cart-checkbox-container" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
          <label className="custom-checkbox-wrapper">
            <input 
              type="checkbox" 
              checked={!!selectedItems[item.unique_id]} 
              onChange={() => toggleItemSelection(item.id)} 
              disabled={isDeadlinePassed}
            />
            <div className="custom-checkmark"></div>
          </label>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 auto', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)' }}>{item.color_sku.product_model.name}</h3>
          {item.color_sku.sku && (
            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              מק"ט: {item.color_sku.sku}
            </div>
          )}
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            צבע: <strong>{item.color_sku.color_name}</strong>
          </div>
          {item.color_sku.product_model.fabric_height && (
            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
              גובה: {item.color_sku.product_model.fabric_height} מטר
            </div>
          )}
        </div>

        {/* Image */}
        <div style={{ flex: '0 0 auto' }}>
          <Link to={`/product/${item.color_sku.product_model.id}`} style={{ width: '88px', height: '88px', borderRadius: '10px', background: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer', textDecoration: 'none' }}>
            {lastImage ? (
              <SmartImage src={lastImage} alt={item.color_sku.color_name} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
            ) : (
              <span style={{ fontSize: '2.5rem' }}>🧵</span>
            )}
          </Link>
        </div>
      </div>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />

      {/* Bottom Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        {/* Actions */}
        <div className="cart-item-actions">
          <button 
            onClick={() => onTrashClick(item)}
            disabled={isDeadlinePassed}
            className={`deleteButton ${confirmDeleteId === item.id ? 'confirming' : ''}`}
            title="הסר מהעגלה"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 50 59" className="bin">
              <path fill="#B5BAC1" d="M0 7.5C0 5.01472 2.01472 3 4.5 3H45.5C47.9853 3 50 5.01472 50 7.5V7.5C50 8.32843 49.3284 9 48.5 9H1.5C0.671571 9 0 8.32843 0 7.5V7.5Z"></path>
              <path fill="#B5BAC1" d="M17 3C17 1.34315 18.3431 0 20 0H29.3125C30.9694 0 32.3125 1.34315 32.3125 3V3H17V3Z"></path>
              <path fill="#B5BAC1" d="M2.18565 18.0974C2.08466 15.821 3.903 13.9202 6.18172 13.9202H43.8189C46.0976 13.9202 47.916 15.821 47.815 18.0975L46.1699 55.1775C46.0751 57.3155 44.314 59.0002 42.1739 59.0002H7.8268C5.68661 59.0002 3.92559 57.3155 3.83073 55.1775L2.18565 18.0974ZM18.0003 49.5402C16.6196 49.5402 15.5003 48.4209 15.5003 47.0402V24.9602C15.5003 23.5795 16.6196 22.4602 18.0003 22.4602C19.381 22.4602 20.5003 23.5795 20.5003 24.9602V47.0402C20.5003 48.4209 19.381 49.5402 18.0003 49.5402ZM29.5003 47.0402C29.5003 48.4209 30.6196 49.5402 32.0003 49.5402C33.381 49.5402 34.5003 48.4209 34.5003 47.0402V24.9602C34.5003 23.5795 33.381 22.4602 32.0003 22.4602C30.6196 22.4602 29.5003 23.5795 29.5003 24.9602V47.0402Z" clipRule="evenodd" fillRule="evenodd"></path>
              <path fill="#B5BAC1" d="M2 13H48L47.6742 21.28H2.32031L2 13Z"></path>
            </svg>
            <span className="tooltip tooltip-normal">מחק</span>
            <span className="tooltip tooltip-confirm">למחוק?</span>
          </button>
          {!item.is_order_item && openEditModal && (
            <button 
              onClick={() => openEditModal(item)}
              disabled={isDeadlinePassed}
              className="editButton"
              title="ערוך פריט"
            >
              <Edit2 size={20} />
            </button>
          )}
          
          <ShareWidget 
            url={`${window.location.origin}/api/v1/share/product/${item.color_sku.product_model.id}`} 
            title={`בינגו בדים - ${item.color_sku.product_model.name}`}
            customClass="shareButton"
          />
        </div>

        {/* Quantity & Price */}
        <div className="cart-item-price-section">
          <div style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text-color)', lineHeight: 1, marginBottom: '0.5rem' }}>₪{rowTotal}</div>
          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '500' }}>
              {item.length_meters} מטר
            </span>
            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '500' }}>
              {item.units} יח'
            </span>
            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '500' }}>
              ₪{parseFloat(pricePerMeter).toFixed(2)} למטר
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
