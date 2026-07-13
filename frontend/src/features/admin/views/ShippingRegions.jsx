import React, { useState, useEffect, useContext } from 'react';
import client from '../../../api/client';
import { Edit2, Trash2, CalendarClock } from 'lucide-react';
import { AuthContext } from '../../auth/AuthContext';

const formatCustomDate = (isoString) => {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
};

const ShippingRegions = () => {
  const { refreshUser } = useContext(AuthContext);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', shipping_cost: 0, delivery_days: 3, deadline_date: '' });

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const res = await client.get('/users/regions');
      setRegions(res.data);
    } catch (err) {
      setError('שגיאה בטעינת אזורים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegions();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.deadline_date === '') {
        payload.deadline_date = null;
      }
      
      if (editingId) {
        await client.put(`/admin/regions/${editingId}`, payload);
      } else {
        await client.post('/admin/regions', payload);
      }
      setEditingId(null);
      setFormData({ name: '', shipping_cost: 0, delivery_days: 3, deadline_date: '' });
      fetchRegions();
      if (refreshUser) refreshUser(); // Update the top banner if the user's deadline changed
    } catch (err) {
      alert(err.response?.data?.detail || 'שגיאה בשמירה');
    }
  };

  const handleEdit = (region) => {
    setEditingId(region.id);
    setFormData({
      name: region.name,
      shipping_cost: region.shipping_cost,
      delivery_days: region.delivery_days,
      deadline_date: region.deadline_date ? region.deadline_date.slice(0, 16) : '' // Format for datetime-local
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק אזור זה? לקוחות המשויכים לאזור יתבקשו לעדכן את אזור המשלוח שלהם בהתחברות הבאה.")) return;
    try {
      await client.delete(`/admin/regions/${id}`);
      fetchRegions();
    } catch (err) {
      alert('שגיאה במחיקה');
    }
  };

  if (loading) return <div>טוען...</div>;

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-color)' }}>ניהול אזורי משלוח</h2>
      {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        {regions.map(region => (
          <div key={region.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{region.name}</strong>
              <span style={{ color: 'var(--text-light)' }}>|</span>
              <span>זמן אספקה: עד {region.delivery_days} ימים</span>
              <span style={{ color: 'var(--text-light)' }}>|</span>
              <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>עלות משלוח: {region.shipping_cost}₪</span>
              <span style={{ color: 'var(--text-light)' }}>|</span>
              <span style={{ color: region.deadline_date ? '#be123c' : 'var(--text-light)', fontWeight: region.deadline_date ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <CalendarClock size={14} /> 
                {region.deadline_date ? `דדליין: ${formatCustomDate(region.deadline_date)}` : 'דדליין גלובלי'}
              </span>
            </span>
            <div style={{ display: 'flex', gap: '1rem', marginRight: 'auto' }}>
              <button onClick={() => handleEdit(region)} title="הגדר דדליין לעיר זו" style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                <CalendarClock size={18} />
              </button>
              <button onClick={() => handleEdit(region)} title="ערוך אזור" style={{ background: 'none', border: 'none', color: 'rgb(59, 130, 246)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(region.id)} title="מחק אזור" style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
        <h3>{editingId ? 'עריכת אזור' : 'הוספת אזור חדש'}</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם אזור:</label>
            <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>עלות משלוח (₪):</label>
            <input type="number" step="0.1" min="0" className="input-field" value={formData.shipping_cost} onChange={e => setFormData({...formData, shipping_cost: parseFloat(e.target.value) || 0})} required />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>זמן אספקה (ימים):</label>
            <input type="number" min="0" className="input-field" value={formData.delivery_days} onChange={e => setFormData({...formData, delivery_days: parseInt(e.target.value) || 0})} required />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9f1239', fontWeight: 'bold' }}>דדליין חריג לעיר זו (אופציונלי):</label>
            <input type="datetime-local" className="input-field" value={formData.deadline_date || ''} onChange={e => setFormData({...formData, deadline_date: e.target.value || null})} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>{editingId ? 'שמור שינויים' : 'הוסף אזור'}</button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setFormData({ name: '', shipping_cost: 0, delivery_days: 3 }); }} style={{ height: '42px' }}>ביטול</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingRegions;
