import React, { useState, useEffect, useMemo } from 'react';
import client from '../../../api/client';
import { Search, Check, AlertCircle, RefreshCw } from 'lucide-react';

const InventoryManagement = () => {
  const [flatSkus, setFlatSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Searching
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing state tracking
  // { skuId: { value: '15.5', status: 'idle' | 'saving' | 'success' | 'error' } }
  const [editStates, setEditStates] = useState({});

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await client.get('/products/catalog');
      const types = res.data;
      
      const extractedSkus = [];
      types.forEach(type => {
        if (type.product_models) {
          type.product_models.forEach(model => {
            if (model.color_skus) {
              model.color_skus.forEach(sku => {
                extractedSkus.push({
                  modelId: model.id,
                  modelName: model.name,
                  skuId: sku.id,
                  skuCode: sku.sku,
                  colorName: sku.color_name,
                  stock_meters: sku.stock_meters,
                  isActive: sku.is_active
                });
              });
            }
          });
        }
      });
      setFlatSkus(extractedSkus);
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Compute filtered and sorted SKUs
  const processedSkus = useMemo(() => {
    let result = [...flatSkus];
    
    // 1. Filter by search term
    if (searchTerm.trim()) {
      const lowerQuery = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.modelName && s.modelName.toLowerCase().includes(lowerQuery)) ||
        (s.colorName && s.colorName.toLowerCase().includes(lowerQuery)) ||
        (s.skuCode && s.skuCode.toLowerCase().includes(lowerQuery))
      );
    }
    
    // 2. Sort by stock ascending (lowest first)
    result.sort((a, b) => {
      const stockA = parseFloat(a.stock_meters) || 0;
      const stockB = parseFloat(b.stock_meters) || 0;
      return stockA - stockB;
    });

    return result;
  }, [flatSkus, searchTerm]);

  // Handle local change in input
  const handleInputChange = (skuId, newValue) => {
    setEditStates(prev => ({
      ...prev,
      [skuId]: { value: newValue, status: 'idle' }
    }));
  };

  // Save to DB
  const saveStock = async (skuId) => {
    const editState = editStates[skuId];
    if (!editState || editState.status === 'saving' || editState.value === undefined) return;
    
    const originalSku = flatSkus.find(s => s.skuId === skuId);
    if (!originalSku) return;

    // Check if it actually changed
    const currentValFloat = parseFloat(originalSku.stock_meters) || 0;
    const newValFloat = parseFloat(editState.value) || 0;
    
    if (currentValFloat === newValFloat && editState.value !== '') {
      // No real change
      return;
    }

    try {
      setEditStates(prev => ({ ...prev, [skuId]: { ...prev[skuId], status: 'saving' } }));
      
      await client.put(`/admin/color-skus/${skuId}`, {
        stock_meters: newValFloat
      });
      
      // Update original array so we don't need to refetch
      setFlatSkus(prev => prev.map(s => s.skuId === skuId ? { ...s, stock_meters: newValFloat } : s));
      
      // Show success briefly, then clear from editStates so it falls back to flatSkus value
      setEditStates(prev => ({ ...prev, [skuId]: { value: newValFloat, status: 'success' } }));
      setTimeout(() => {
        setEditStates(prev => {
          const next = { ...prev };
          // Only delete if it's still success (user didn't start typing again)
          if (next[skuId]?.status === 'success') {
            delete next[skuId];
          }
          return next;
        });
      }, 2000);
      
    } catch (err) {
      console.error('Failed to save stock:', err);
      setEditStates(prev => ({ ...prev, [skuId]: { ...prev[skuId], status: 'error' } }));
    }
  };

  const handleKeyDown = (e, skuId) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Triggers onBlur which triggers save
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '85px',
        zIndex: 10,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            placeholder="חיפוש לפי דגם, צבע או מק״ט..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        
        <button 
          onClick={fetchCatalog}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--glass-bg)',
            border: '1px solid #cbd5e1',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: 'var(--text-light)',
            fontWeight: '600'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          רענן נתונים
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>מלאי (מטרים)</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-light)' }}>שם דגם</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-light)' }}>צבע</th>
                <th style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-light)' }}>מק״ט</th>
              </tr>
            </thead>
            <tbody>
              {loading && flatSkus.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>טוען נתונים...</td>
                </tr>
              ) : processedSkus.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>לא נמצאו פריטים.</td>
                </tr>
              ) : (
                processedSkus.map(sku => {
                  const localState = editStates[sku.skuId];
                  const displayValue = localState ? localState.value : sku.stock_meters;
                  const status = localState ? localState.status : 'idle';
                  
                  return (
                    <tr key={sku.skuId} style={{ borderBottom: '1px solid #8a8b8cff' }}>
                      <td style={{ padding: '0.6rem 1rem', width: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            step="0.1"
                            value={displayValue === null || displayValue === undefined ? '' : displayValue}
                            onChange={(e) => handleInputChange(sku.skuId, e.target.value)}
                            onBlur={() => saveStock(sku.skuId)}
                            onKeyDown={(e) => handleKeyDown(e, sku.skuId)}
                            style={{
                              width: '80px',
                              padding: '0.4rem',
                              border: `1px solid ${status === 'error' ? '#ef4444' : status === 'success' ? '#22c55e' : '#cbd5e1'}`,
                              borderRadius: '6px',
                              fontSize: '1rem',
                              textAlign: 'center',
                              outline: 'none',
                              background: status === 'saving' ? '#f1f5f9' : 'white'
                            }}
                            disabled={status === 'saving'}
                          />
                          {status === 'saving' && <RefreshCw size={16} className="spin" color="#94a3b8" />}
                          {status === 'success' && <Check size={18} color="#22c55e" />}
                          {status === 'error' && <AlertCircle size={18} color="#ef4444" title="שגיאה בשמירה" />}
                        </div>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', fontWeight: '600', color: 'var(--text-color)' }}>
                        {!sku.isActive && <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '8px', color: 'var(--text-light)' }}>מוסתר</span>}
                        {sku.modelName}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)' }}>{sku.colorName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-light)', fontSize: '0.9rem' }} dir="ltr">{sku.skuCode || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InventoryManagement;
