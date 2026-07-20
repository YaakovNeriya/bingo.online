import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { useModalBack } from '../../../hooks/useModalBack';

export const CartEditModal = ({
  editingItem,
  setEditingItem,
  editLength,
  setEditLength,
  minCutLength,
  editUnits,
  setEditUnits,
  handleSaveEdit
}) => {
  useModalBack(Boolean(editingItem), () => setEditingItem(null), 'cart_edit_modal');

  if (!editingItem) return null;

  return (
    <div onClick={() => setEditingItem(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--glass-bg)', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative' }}>
        <button onClick={() => setEditingItem(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
          <X size={24} />
        </button>
        <h3 style={{ marginBottom: '2rem', fontSize: '1.4rem', color: 'var(--text-color)', textAlign: 'center', fontWeight: '800' }}>עריכת פריט בעגלה</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-color)', fontWeight: '600' }}>אורך הבד (מטרים)</label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', borderRadius: '999px', padding: '0.5rem 1.5rem', width: '100%' }}>
              <button onClick={() => setEditLength(Math.max(minCutLength, Math.round((editLength - 0.1) * 10) / 10))} disabled={editLength <= minCutLength} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: editLength <= minCutLength ? 0.3 : 1, color: 'var(--text-light)' }}><Minus size={22} /></button>
              <input type="number" min={minCutLength} step="0.1" value={editLength} onChange={e => setEditLength(Math.max(minCutLength, parseFloat(e.target.value) || minCutLength))} style={{ width: '80px', textAlign: 'center', fontSize: '1.4rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontWeight: '800' }} />
              <button onClick={() => setEditLength(Math.round((editLength + 0.1) * 10) / 10)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-light)' }}><Plus size={22} /></button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '1rem', color: 'var(--text-color)', fontWeight: '600' }}>כמות</label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', borderRadius: '999px', padding: '0.5rem 1.5rem', width: '100%' }}>
              <button onClick={() => setEditUnits(Math.max(1, editUnits - 1))} disabled={editUnits <= 1} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: editUnits <= 1 ? 0.3 : 1, color: 'var(--text-light)' }}><Minus size={22} /></button>
              <input type="number" min="1" step="1" value={editUnits} onChange={e => setEditUnits(parseInt(e.target.value) || 0)} style={{ width: '80px', textAlign: 'center', fontSize: '1.4rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontWeight: '800' }} />
              <button onClick={() => setEditUnits(editUnits + 1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-light)' }}><Plus size={22} /></button>
            </div>
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={handleSaveEdit} style={{ width: '100%', padding: '0.85rem', fontSize: '1.2rem', borderRadius: '999px', background: '#2563eb', border: 'none', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', fontWeight: 'bold' }}>
          שמור שינויים
        </button>
      </div>
    </div>
  );
};
