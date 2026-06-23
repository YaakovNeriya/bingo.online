import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { Trash2 } from 'lucide-react';

const AbandonedCarts = () => {
  const [carts, setCarts] = useState([]);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const res = await client.get('/admin/carts/abandoned');
      setCarts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את כל העגלות הנטושות?")) return;
    try {
      await client.delete('/admin/carts/abandoned');
      alert("עגלות נטושות נוקו!");
      fetchCarts();
    } catch (err) {
      alert("שגיאה במחיקת עגלות");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>עגלות נטושות</h2>
        <button className="btn btn-danger" onClick={handleClearAll}>
          <Trash2 size={18} /> נקה עגלות ישנות
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {carts.length === 0 ? <p>לא נמצאו עגלות נטושות.</p> : (
          <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem' }}>מזהה עגלה</th>
                <th style={{ padding: '1rem' }}>סך פריטים</th>
              </tr>
            </thead>
            <tbody>
              {carts.map(cart => (
                <tr key={cart.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem' }}>#{cart.id}</td>
                  <td style={{ padding: '1rem' }}>{cart.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AbandonedCarts;
