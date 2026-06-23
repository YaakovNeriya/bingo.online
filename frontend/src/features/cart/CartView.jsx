import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { CartContext } from './CartContext';
import { CreditCard, Trash2, Plus, Minus, Edit2, X, Check } from 'lucide-react';

const CartView = () => {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState(null);
  const { fetchCartCount } = useContext(CartContext);
  const [editingItem, setEditingItem] = useState(null);
  const [editLength, setEditLength] = useState(0);
  const [editUnits, setEditUnits] = useState(0);
  const [minCutLength, setMinCutLength] = useState(1.0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const deleteTimerRef = useRef(null);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  const toggleItemSelection = (id) => {
    setSelectedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchMinCutLength = async () => {
    try {
      const res = await client.get('/products/public/settings');
      if (res.data && res.data['minimum_order_length']) {
        setMinCutLength(parseFloat(res.data['minimum_order_length']) || 1.0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await client.get('/orders/cart');
      setCart(res.data);
      const newSelected = {};
      res.data.items.forEach(item => {
        newSelected[item.id] = true;
      });
      setSelectedItems(prev => {
        const merged = { ...newSelected };
        for (const key in prev) {
          if (prev.hasOwnProperty(key)) {
            merged[key] = prev[key];
          }
        }
        return merged;
      });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('אנא התחבר כדי לצפות בעגלה שלך.');
      } else {
        setError('שגיאה בטעינת העגלה.');
      }
    }
  };

  useEffect(() => {
    fetchCart();
    fetchMinCutLength();
  }, []);

  const handleUpdateUnits = async (itemId, newUnits) => {
    if (newUnits < 1) return;
    try {
      await client.patch(`/orders/cart/items/${itemId}`, { units: newUnits });
      fetchCart();
      fetchCartCount();
    } catch (err) {
      alert(err.response?.data?.detail || 'שגיאה בעדכון כמות');
    }
  };

  const handleSaveEdit = async () => {
    if (editUnits < 1 || editLength < minCutLength) return;
    try {
      await client.patch(`/orders/cart/items/${editingItem.id}`, { 
        units: editUnits,
        length_meters: editLength
      });
      setEditingItem(null);
      fetchCart();
      fetchCartCount();
    } catch (err) {
      alert(err.response?.data?.detail || 'שגיאה בעדכון פריט');
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditLength(parseFloat(item.length_meters));
    setEditUnits(item.units);
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await client.delete(`/orders/cart/items/${itemId}`);
      fetchCart();
      fetchCartCount();
    } catch (err) {
      alert('שגיאה במחיקת הפריט');
    }
  };

  const onTrashClick = (itemId) => {
    if (confirmDeleteId === itemId) {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setConfirmDeleteId(null);
      handleRemoveItem(itemId);
    } else {
      setConfirmDeleteId(itemId);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(null);
      }, 10000);
    }
  };

  const handleCheckout = async () => {
    try {
      await client.post('/orders/checkout');
      alert('הזמנה בוצעה בהצלחה!');
      fetchCart();
      fetchCartCount();
    } catch (err) {
      setError(err.response?.data?.detail || 'שגיאה בביצוע ההזמנה');
    }
  };

  const selectedItemIds = cart?.items.filter(i => selectedItems[i.id]).map(i => i.id) || [];
  const areSelectedItemsOrdered = selectedItemIds.length > 0 && selectedItemIds.every(id => {
    const item = cart?.items.find(i => i.id === id);
    return item && item.status === 'ordered';
  });

  const handleToggleSendOrder = async () => {
    if (selectedItemIds.length === 0) {
      alert("נא לסמן פריטים להזמנה תחילה");
      return;
    }
    setIsSendingOrder(true);
    try {
      const newStatus = areSelectedItemsOrdered ? 'pending' : 'ordered';
      await client.patch('/orders/cart/items/status', {
        item_ids: selectedItemIds,
        status: newStatus
      });
      await fetchCart();
    } catch (err) {
      alert("שגיאה בשליחת הזמנה");
    } finally {
      setIsSendingOrder(false);
    }
  };

  if (!cart) return <div className="container">{error || 'טוען...'}</div>;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="cart-header-container">
        <h1 className="cart-header-title">העגלה שלך</h1>
        <button 
          className={`btn send-order-btn ${areSelectedItemsOrdered ? 'sent' : ''}`}
          onClick={handleToggleSendOrder}
          disabled={isSendingOrder || selectedItemIds.length === 0}
          style={{ 
            opacity: (isSendingOrder || selectedItemIds.length === 0) ? 0.6 : 1,
            cursor: (isSendingOrder || selectedItemIds.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isSendingOrder ? 'שולח...' : areSelectedItemsOrdered ? 'נשלח בהצלחה' : 'שלח הזמנה'}
        </button>
      </div>
      <div className="glass-panel cart-panel">
        {cart.items.length === 0 ? (
          <p>העגלה שלך ריקה.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {cart.items.map(item => {
                const pricePerMeter = item.color_sku.specific_price ?? item.color_sku.product_model.base_price;
                const rowTotal = (parseFloat(item.length_meters) * item.units * parseFloat(pricePerMeter)).toFixed(2);
                return (
                  <div key={item.id} className="cart-item-premium" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
                    
                    {/* Top Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      {/* Status Icon */}
                      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
                        <label className="custom-checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            checked={!!selectedItems[item.id]} 
                            onChange={() => toggleItemSelection(item.id)} 
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
                          {item.color_sku.image_url ? (
                            <img src={item.color_sku.image_url} alt={item.color_sku.color_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '2.5rem' }}>🧵</span>
                          )}
                        </Link>
                      </div>
                    </div>

                    {/* Divider */}
                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.5rem 0' }} />

                    {/* Bottom Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      {/* Actions */}
                      <div className="cart-item-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button 
                          onClick={() => onTrashClick(item.id)}
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
                        <button 
                          onClick={() => openEditModal(item)}
                          className="editButton"
                          title="ערוך פריט"
                        >
                          <Edit2 size={20} />
                        </button>
                      </div>

                      {/* Quantity & Price */}
                      <div style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
                        <div style={{ fontWeight: '800', fontSize: '1.4rem', color: '#0f172a', lineHeight: 1, marginBottom: '0.5rem' }}>₪{rowTotal}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                            {item.length_meters} מטר
                          </span>
                          <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                            {item.units} יח'
                          </span>
                          <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                            ₪{parseFloat(pricePerMeter).toFixed(2)} למטר
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37,99,235,0.05)', padding: '0.75rem 1rem', borderRadius: '12px', gap: '0.5rem' }}>
              <div style={{ flexShrink: 0 }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>סה"כ לתשלום</span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1', marginTop: '0.1rem' }}>
                  ₪{cart.items.reduce((sum, item) => sum + (parseFloat(item.length_meters) * item.units * parseFloat(item.color_sku.specific_price ?? item.color_sku.product_model.base_price)), 0).toFixed(2)}
                </div>
              </div>
              <button className="btn btn-primary" disabled={true} onClick={handleCheckout} style={{ opacity: 0.5, cursor: 'not-allowed', padding: '0.5rem 1rem', fontSize: '0.95rem', borderRadius: '999px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <CreditCard size={22} /> לתשלום מאובטח
              </button>
            </div>
          </>
        )}
      </div>
      {error && <div style={{ color: 'var(--danger-color)', marginTop: '1rem' }}>{error}</div>}

      {/* Edit Modal Popup */}
      {editingItem && (
        <div onClick={() => setEditingItem(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button onClick={() => setEditingItem(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem', color: '#1e293b', textAlign: 'center', fontWeight: '800' }}>עריכת פריט בעגלה</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>אורך הבד (מטרים)</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', borderRadius: '999px', padding: '0.5rem 1.5rem', width: '100%' }}>
                  <button onClick={() => setEditLength(Math.max(minCutLength, Math.round((editLength - 0.1) * 10) / 10))} disabled={editLength <= minCutLength} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: editLength <= minCutLength ? 0.3 : 1, color: '#64748b' }}><Minus size={22} /></button>
                  <input type="number" min={minCutLength} step="0.1" value={editLength} onChange={e => setEditLength(Math.max(minCutLength, parseFloat(e.target.value) || minCutLength))} style={{ width: '80px', textAlign: 'center', fontSize: '1.4rem', background: 'transparent', border: 'none', outline: 'none', color: '#0f172a', fontWeight: '800' }} />
                  <button onClick={() => setEditLength(Math.round((editLength + 0.1) * 10) / 10)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}><Plus size={22} /></button>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>כמות</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', borderRadius: '999px', padding: '0.5rem 1.5rem', width: '100%' }}>
                  <button onClick={() => setEditUnits(Math.max(1, editUnits - 1))} disabled={editUnits <= 1} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: editUnits <= 1 ? 0.3 : 1, color: '#64748b' }}><Minus size={22} /></button>
                  <input type="number" min="1" step="1" value={editUnits} onChange={e => setEditUnits(parseInt(e.target.value) || 0)} style={{ width: '80px', textAlign: 'center', fontSize: '1.4rem', background: 'transparent', border: 'none', outline: 'none', color: '#0f172a', fontWeight: '800' }} />
                  <button onClick={() => setEditUnits(editUnits + 1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}><Plus size={22} /></button>
                </div>
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={handleSaveEdit} style={{ width: '100%', padding: '0.85rem', fontSize: '1.2rem', borderRadius: '999px', background: '#2563eb', border: 'none', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', fontWeight: 'bold' }}>
              שמור שינויים
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
