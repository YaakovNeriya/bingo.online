import React, { useState, useEffect, useMemo } from 'react';
import client from '../../../api/client';
import { Search, ChevronDown, ChevronUp, Package, Calendar, Phone, User, ExternalLink, Printer, ShoppingCart } from 'lucide-react';
import { formatDate, getStatusStyle, getStatusLabel, ORDER_STATUSES } from '../utils/adminUtils';
import '../orders.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Expanded rows
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await client.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = (customer) => {
    if (!customer) return;
    localStorage.setItem('impersonatedUserId', customer.id);
    localStorage.setItem('impersonatedUserName', `${customer.first_name || ''} ${customer.last_name || ''}`.trim());
    window.location.href = '/cart';
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await client.patch(`/admin/orders/${orderId}/status`, { status });
      // update locally to avoid full fetch
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const toggleOrder = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status filter
      if (statusFilter !== 'All' && order.status !== statusFilter) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchStr = `
          ${order.id} 
          ${order.user?.first_name || ''} 
          ${order.user?.last_name || ''} 
          ${order.user?.phone || ''}
        `.toLowerCase();
        if (!searchStr.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Bar: Filters and Search */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setStatusFilter('All')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: statusFilter === 'All' ? 'var(--primary-color)' : '#e2e8f0',
              color: statusFilter === 'All' ? 'white' : '#475569',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            הכל ({orders.length})
          </button>
          
          {Object.entries(ORDER_STATUSES).map(([key, value]) => {
            // Count orders per status
            const count = orders.filter(o => o.status === key).length;
            if (key === 'Received' || key === 'archived') return null; // We don't have Received status anymore, and no need to filter by archived
            
            return (
              <button 
                key={key}
                onClick={() => setStatusFilter(key)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: statusFilter === key ? getStatusStyle(key).background : '#e2e8f0',
                  color: statusFilter === key ? getStatusStyle(key).color : '#475569',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: statusFilter === key ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {value.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="חיפוש לפי שם, טלפון או מס' הזמנה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 2.2rem 0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>טוען הזמנות...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', background: 'var(--glass-bg)', borderRadius: '12px' }}>
          לא נמצאו הזמנות התואמות לחיפוש/לסינון.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredOrders.map(order => (
            <div key={order.id} className="admin-order-row">
              
              {/* Main Row */}
              <div 
                onClick={() => toggleOrder(order.id)}
                className={`admin-order-main ${expandedOrder === order.id ? 'expanded' : ''}`}
              >
                {/* Left Side: Basic Info */}
                <div className="admin-order-left">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span className="admin-order-id-badge">
                      הזמנה #{order.id}
                    </span>
                    <span className="admin-order-date">
                      <Calendar size={14} />
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="mobile-hidden admin-order-divider"></div>
                  
                  <div className="admin-order-user">
                    <strong className="admin-order-user-name">
                      <User size={16} color="#475569" />
                      {order.user ? `${order.user.first_name} ${order.user.last_name || ''}` : 'לקוח לא ידוע'}
                    </strong>
                    <span className="admin-order-user-phone">
                      <Phone size={14} />
                      {order.user?.phone || 'ללא נייד'}
                      {order.user?.region && (
                        <>
                          <span style={{ margin: '0 4px' }}>|</span>
                          {order.user.region.name}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right Side: Status & Actions */}
                <div className="admin-order-right">
                  
                  <div className="admin-order-total">
                    <div className="admin-order-total-label">סה"כ:</div>
                    <strong className="admin-order-total-price">
                      {Number(order.total_price || 0).toFixed(2)}₪
                    </strong>
                  </div>

                  {order.user && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImpersonate(order.user);
                      }}
                      title="היכנס לעריכת עגלת לקוח"
                      className="admin-order-action-btn"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  )}

                  {/* Status update select */}
                  <div onClick={(e) => e.stopPropagation()} className="admin-order-select-container">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="admin-order-status-select"
                      style={{
                        background: getStatusStyle(order.status).background,
                        color: getStatusStyle(order.status).color
                      }}
                    >
                      {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="admin-order-select-icon" style={{ color: getStatusStyle(order.status).color }} />
                  </div>

                  {/* Expand icon */}
                  <div className="admin-order-expand-icon">
                    {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>

                </div>
              </div>

              {/* Expanded Items Area */}
              {expandedOrder === order.id && (
                <div style={{ padding: '1.5rem', background: 'var(--bg-color)', borderTop: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={18} />
                    פריטי ההזמנה ({order.items.length})
                  </h4>
                  
                  {order.items.length === 0 ? (
                    <p style={{ color: 'var(--text-light)' }}>אין פריטים להצגה.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {order.items.map((item, idx) => (
                        <div key={item.id || idx} style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          background: 'var(--glass-bg)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          gap: '1rem'
                        }}>
                          {/* Item details */}
                          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: 'var(--text-color)', fontSize: '1rem' }}>
                              {item.color_sku?.product_model?.name || item.historical_product_name} 
                              <span style={{ fontWeight: 'normal', color: 'var(--text-light)', margin: '0 4px' }}>-</span> 
                              <span style={{ color: 'var(--text-light)' }}>{item.color_sku?.color_name || item.historical_color_name}</span>
                            </strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '2px' }}>
                              מק"ט: {item.color_sku?.sku || 'ללא מק"ט'}
                            </span>
                          </div>

                          {/* Dimensions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 120px' }}>
                            <span style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                              {Number(item.length_meters || 0)} מטר
                            </span>
                            <span style={{ color: 'var(--text-light)' }}>×</span>
                            <span style={{ background: 'var(--bg-color)', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--text-color)' }}>
                              {item.units} יח'
                            </span>
                          </div>

                          {/* Price */}
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-color)', minWidth: '80px', textAlign: 'left' }}>
                            {item.price_at_purchase 
                              ? (Number(item.price_at_purchase) * Number(item.length_meters || 0) * Number(item.units || 1)).toFixed(2) 
                              : Number(item.price || 0).toFixed(2)}₪
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default OrdersManagement;
