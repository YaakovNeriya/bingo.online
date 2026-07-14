import React from 'react';
import { ChevronDown, ChevronUp, MapPin, User, Package, Calendar, ArrowDownUp, Printer, ShoppingCart, Users, Phone, Mail } from 'lucide-react';
import { formatDate, getStatusStyle, getStatusLabel } from '../utils/adminUtils';

export const RegionCard = ({
  region,
  expandedRegion,
  toggleRegion,
  sortMode,
  sortingRegion,
  sortedData,
  handleSmartSort,
  handlePrint,
  loadingRegion,
  regionCustomers,
  expandedCustomer,
  toggleCustomer,
  handleImpersonate,
  loadingCustomer,
  customerOrders
}) => {
  return (
    <div className="region-card-outer" style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--primary-color)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      {/* Level 1: Region */}
      <div
        style={{
          padding: '1rem',
          background: 'rgba(37, 99, 235, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <MapPin color="var(--primary-color)" size={24} style={{ flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)', whiteSpace: 'nowrap' }}>{region.name}</h3>
          <span style={{ background: 'var(--primary-color)', color: 'white', padding: '4px 10px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {region.customer_count} לקוחות
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {expandedRegion === region.id && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleSmartSort(region.id); }}
                disabled={sortingRegion[region.id]}
                style={{
                  background: sortMode[region.id] ? 'var(--primary-color)' : 'white',
                  color: sortMode[region.id] ? 'white' : 'var(--primary-color)',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  transition: '0.2s',
                  opacity: sortingRegion[region.id] ? 0.6 : 1,
                  flexShrink: 0
                }}
              >
                <ArrowDownUp size={16} />
                {sortingRegion[region.id] ? 'ממיין...' : sortMode[region.id] ? 'ביטול מיון' : 'מיון חכם'}
              </button>
              {sortMode[region.id] && sortedData[region.id] && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrint(region.id, region.name); }}
                  style={{
                    background: '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  <Printer size={16} />
                  הדפסה
                </button>
              )}
            </>
          )}
          <button
            onClick={() => toggleRegion(region.id)}
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              flexShrink: 0
            }}
          >
            {expandedRegion === region.id ? <ChevronUp size={24} color="var(--primary-color)" /> : <ChevronDown size={24} color="var(--primary-color)" />}
          </button>
        </div>
      </div>

      {/* Level 2: Customers */}
      {expandedRegion === region.id && (
        <div style={{ padding: '1.5rem', background: 'var(--bg-color)' }}>
          {loadingRegion[region.id] ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>טוען רשימת לקוחות...</p>
          ) : sortMode[region.id] && sortedData[region.id] ? (
            /* ========== SORTED VIEW ========== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(139, 92, 246, 0.08))',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px dashed var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                color: 'var(--primary-color)',
                fontWeight: '500'
              }}>
                <ArrowDownUp size={16} />
                ממוין לפי חפיפת מוצרים — לקוחות עם הזמנות דומות מופיעים ברצף
              </div>
              {sortedData[region.id].map(customer => (
                <div key={customer.id} style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {/* Customer header with sort index */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        background: 'var(--primary-color)',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        flexShrink: 0
                      }}>
                        {customer.sort_index}
                      </span>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>
                          {customer.first_name} {customer.last_name}
                        </strong>
                        <div style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '2px' }}>
                          {customer.phone || 'אין טלפון'} • {customer.email}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      color: 'var(--primary-color)',
                      flexShrink: 0
                    }}>
                      {Number(customer.total || 0).toFixed(2)}₪
                    </div>
                  </div>

                  {/* Items list */}
                  {customer.items.length > 0 ? (
                    <div style={{ padding: '0' }}>
                      {customer.items.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.7rem 1.25rem',
                          borderBottom: idx < customer.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}>
                          <div style={{ flex: '1 1 180px' }}>
                            <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', display: 'block', marginBottom: '1px' }}>{item.category}</span>
                            <strong style={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>
                              {item.product_name}
                            </strong>
                            <span style={{ color: 'var(--text-light)', marginRight: '4px' }}> — {item.color_name}</span>
                            {item.sku && <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginRight: '6px' }}>({item.sku})</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ background: 'var(--bg-color)', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                              {item.length_meters} מ'
                            </span>
                            <span style={{ color: 'var(--text-light)' }}>×</span>
                            <span style={{ background: 'var(--bg-color)', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                              {item.units} יח'
                            </span>
                          </div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-color)', fontSize: '0.95rem', minWidth: '70px', textAlign: 'left' }}>
                            {Number(item.price || 0).toFixed(2)}₪
                          </div>
                          <span style={{
                            ...getStatusStyle(item.status),
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                          }}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ padding: '1rem', color: 'var(--text-light)', textAlign: 'center' }}>אין פריטים</p>
                  )}
                </div>
              ))}
            </div>
          ) : regionCustomers[region.id]?.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>אין לקוחות באזור זה.</p>
          ) : (
            /* ========== NORMAL VIEW (existing) ========== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {regionCustomers[region.id]?.map(customer => (
                <div key={customer.id} style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div className="customer-row-header"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: expandedCustomer === customer.id ? '#f1f5f9' : 'white'
                    }}
                  >
                    <div className="customer-row-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Top row: Name & Orders */}
                      <div className="customer-row-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <User size={20} color="#475569" />
                          <strong style={{ fontSize: '1.15rem', color: 'var(--text-color)' }}>{customer.first_name} {customer.last_name}</strong>
                        </div>
                        <span style={{ background: '#e2e8f0', color: 'var(--text-color)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          <Package size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />
                          {customer.order_count} הזמנות
                        </span>
                        {customer.cart_items_count > 0 && (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShoppingCart size={14} />
                            {customer.cart_items_count} בעגלה
                          </span>
                        )}
                      </div>
                      {/* Bottom row: Contact info */}
                      <div className="customer-row-contact" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', color: 'var(--text-light)', fontSize: '0.95rem', paddingRight: '2.25rem' }}>
                        <span>{customer.phone || 'אין טלפון'}</span>
                        <span className="separator" style={{ color: 'var(--text-light)', display: customer.phone ? 'inline' : 'none' }}>|</span>
                        <span>{customer.email}</span>
                      </div>
                    </div>
                    <div className="customer-row-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleImpersonate(customer)}
                        title="היכנס לעריכת עגלת לקוח"
                        style={{
                          background: '#eab308',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          flexShrink: 0
                        }}
                      >
                        <ShoppingCart size={18} />
                        <span className="hide-on-mobile">ערוך עגלה</span>
                      </button>
                      <button
                        onClick={() => toggleCustomer(customer.id)}
                        style={{
                          background: 'var(--bg-color)',
                          border: '1px solid #cbd5e1',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        {expandedCustomer === customer.id ? <ChevronUp size={20} color="#475569" /> : <ChevronDown size={20} color="#475569" />}
                      </button>
                    </div>
                  </div>

                  {/* Level 3: Orders */}
                  {expandedCustomer === customer.id && (
                    <div style={{ padding: '1.5rem', background: 'var(--bg-color)', borderTop: '2px solid #e2e8f0' }}>
                      {loadingCustomer[customer.id] ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>טוען היסטוריית הזמנות...</p>
                      ) : customerOrders[customer.id]?.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>ללקוח זה אין הזמנות במערכת.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>היסטוריית הזמנות מפורטת:</h4>
                          {customerOrders[customer.id]?.map(order => (
                            <div key={order.id} style={{ background: 'var(--glass-bg)', border: '1px solid #94a3b8', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

                              {/* Order Header */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: 'var(--text-light)', alignItems: 'center' }}>
                                  {order.id > 0 ? (
                                    <span style={{ background: '#1e293b', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.1rem' }}>הזמנה #{order.id}</span>
                                  ) : (
                                    <span style={{ background: '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '1.1rem' }}>עגלת קניות פתוחה</span>
                                  )}
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                    <Calendar size={16} />
                                    {formatDate(order.created_at)}
                                  </span>
                                  <span style={{ ...getStatusStyle(order.status), padding: '4px 10px', borderRadius: '4px', fontSize: '0.95rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                    {getStatusLabel(order.status)}
                                  </span>
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center' }}>
                                  {Number(order.total_price || 0).toFixed(2)}₪
                                </div>
                              </div>

                              {/* Order Items */}
                              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
                                {order.items.map((item, index) => (
                                  <div key={item.id} style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 0',
                                    borderBottom: index !== order.items.length - 1 ? '1px solid #e2e8f0' : 'none'
                                  }}>
                                    {/* Left side: Name & SKU */}
                                    <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                      <strong style={{ color: 'var(--text-color)', fontSize: '1.05rem' }}>
                                        {item.color_sku?.product_model?.name || item.historical_product_name} <span style={{ fontWeight: 'normal', color: 'var(--text-light)' }}>- {item.color_sku?.color_name || item.historical_color_name}</span>
                                      </strong>
                                      <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>מק"ט: {item.color_sku?.sku || 'ללא מק"ט'}</span>
                                    </div>

                                    {/* Middle: Quantities */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 120px' }}>
                                      <span style={{ background: 'var(--bg-color)', border: '1px solid #e2e8f0', color: 'var(--text-light)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                        {item.length_meters} מטר
                                      </span>
                                      <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>×</span>
                                      <span style={{ background: 'var(--bg-color)', border: '1px solid #e2e8f0', color: 'var(--text-light)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                        {item.units} יח'
                                      </span>
                                    </div>

                                    {/* Right: Price */}
                                    <div style={{ fontWeight: 'bold', color: 'var(--text-color)', fontSize: '1.1rem', textAlign: 'left', minWidth: '70px' }}>
                                      {Number(item.price_at_purchase || 0).toFixed(2)}₪
                                    </div>
                                  </div>
                                ))}
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
      )}
    </div>
  );
};
