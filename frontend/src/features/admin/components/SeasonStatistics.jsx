import React, { useState, useEffect } from 'react';
import client from '../../../api/client';

const SeasonStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'total_meters', direction: 'desc' });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/reports/season-stats');
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = React.useMemo(() => {
    if (!stats || !stats.items_stats) return [];
    const sortableItems = [...stats.items_stats];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [stats, sortConfig]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>טוען נתונים...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-dark)' }}>סטטיסטיקת נוכחית</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>סה״כ מטרים נמכרו</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {stats.total_meters.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>סך הכנסות</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
            ₪{stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
          <h3 style={{ color: 'var(--text-light)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>כמות פריטים שנלקחו</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats.total_items.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '1rem' }}>פירוט לפי בדים וצבעים</h3>
        <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', background: 'var(--bg-light)' }}>
              <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('product_name')}>
                מוצר {sortConfig.key === 'product_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('color_name')}>
                צבע {sortConfig.key === 'color_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('category')}>
                קטגוריה {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('total_meters')}>
                מטרים {sortConfig.key === 'total_meters' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('total_revenue')}>
                הכנסה (₪) {sortConfig.key === 'total_revenue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('total_orders')}>
                הזמנות {sortConfig.key === 'total_orders' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{item.product_name}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.sku && <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{item.sku}</span>}
                    {item.color_name}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-light)', borderRadius: '4px', fontSize: '0.85rem' }}>
                    {item.category}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {item.total_meters.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </td>
                <td style={{ padding: '1rem', color: '#10b981' }}>
                  ₪{item.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '1rem' }}>{item.total_orders}</td>
              </tr>
            ))}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  אין נתונים לעונה הנוכחית
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SeasonStatistics;
