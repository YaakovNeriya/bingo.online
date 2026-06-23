import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import AbandonedCarts from './AbandonedCarts';
import ProductManagement from './ProductManagement';
import SiteSettings from './SiteSettings';
import ShippingRegions from './ShippingRegions';
import CustomersManagement from './CustomersManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [report, setReport] = useState(null);
  const [orders, setOrders] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [persistedEditSkuId, setPersistedEditSkuId] = useState(null);

  useEffect(() => {
    if (location.state?.editSkuId) {
      setPersistedEditSkuId(location.state.editSkuId);
      setActiveTab('products');
      // Clean up state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.editSkuId, location.pathname, navigate]);

  useEffect(() => {
    fetchReport();
    fetchOrders();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await client.get('/admin/reports/sales');
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await client.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    await client.patch(`/admin/orders/${orderId}/status`, { status });
    fetchOrders();
  };

  const clearTrafficData = async () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את נתוני המעקב? לא ניתן לבטל פעולה זו.')) {
      try {
        await client.delete('/admin/reports/traffic');
        fetchReport();
        alert('נתוני המעקב אופסו בהצלחה.');
      } catch (err) {
        alert('שגיאה באיפוס הנתונים.');
      }
    }
  };

  if (!report) return <div className="container">טוען...</div>;

  return (
    <div className="container">
      <h1>פאנל ניהול</h1>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('dashboard')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'dashboard' ? '#e8e8e8ff' : '', color: activeTab !== 'dashboard' ? '#475569' : '' }}>
          דשבורד והזמנות
        </button>
        <button 
          className={`btn ${activeTab === 'products' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('products')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'products' ? '#e8e8e8ff' : '', color: activeTab !== 'products' ? '#475569' : '' }}>
          מוצרים
        </button>
        <button 
          className={`btn ${activeTab === 'carts' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('carts')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'carts' ? '#e8e8e8ff' : '', color: activeTab !== 'carts' ? '#475569' : '' }}>
          עגלות נטושות
        </button>
        <button 
          className={`btn ${activeTab === 'settings' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('settings')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'settings' ? '#e8e8e8ff' : '', color: activeTab !== 'settings' ? '#475569' : '' }}>
          הגדרות חנות
        </button>
        <button 
          className={`btn ${activeTab === 'customers' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('customers')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'customers' ? '#e8e8e8ff' : '', color: activeTab !== 'customers' ? '#475569' : '' }}>
          לקוחות
        </button>
        <button 
          className={`btn ${activeTab === 'regions' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('regions')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'regions' ? '#e8e8e8ff' : '', color: activeTab !== 'regions' ? '#475569' : '' }}>
          אזורי משלוח
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3>הכנסות</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{report.total_revenue}₪</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3>סך הזמנות</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{report.total_orders}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>מקורות הגעה</h3>
                <button onClick={clearTrafficData} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                  איפוס נתונים
                </button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {Object.entries(report.traffic_sources || {}).length === 0 ? (
                  <li style={{ color: 'var(--text-light)' }}>אין נתונים</li>
                ) : (
                  Object.entries(report.traffic_sources).map(([source, count]) => (
                    <li key={source} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                      <span>{source}</span>
                      <strong style={{ color: 'var(--primary-color)' }}>{count}</strong>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <h2>הזמנות אחרונות</h2>
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>מזהה</th>
                  <th style={{ padding: '1rem' }}>סך הכל</th>
                  <th style={{ padding: '1rem' }}>סטטוס</th>
                  <th style={{ padding: '1rem' }}>פעולה</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>#{order.id}</td>
                    <td style={{ padding: '1rem' }}>{order.total_price}₪</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px', 
                        background: order.status === 'Shipped' ? 'var(--success-color)' : '#f59e0b',
                        color: 'white',
                        fontSize: '0.875rem'
                      }}>
                        {order.status === 'Shipped' ? 'נשלח' : 'התקבל'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {order.status !== 'Shipped' && (
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => updateOrderStatus(order.id, 'Shipped')}>
                          סמן כנשלח
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'products' && <ProductManagement editSkuId={persistedEditSkuId} />}
      {activeTab === 'carts' && <AbandonedCarts />}
      {activeTab === 'settings' && <SiteSettings />}
      {activeTab === 'regions' && <ShippingRegions />}
      {activeTab === 'customers' && <CustomersManagement />}
    </div>
  );
};

export default AdminDashboard;
