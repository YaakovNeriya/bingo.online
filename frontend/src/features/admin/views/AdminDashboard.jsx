import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import SeasonTransition from './SeasonTransition';
import ProductManagement from './ProductManagement';
import SiteSettings from './SiteSettings';
import ShippingRegions from './ShippingRegions';
import CustomersManagement from './CustomersManagement';
import SeasonArchives from './SeasonArchives';
import SeasonStatistics from '../components/SeasonStatistics';
import OrdersManagement from './OrdersManagement';
import InventoryManagement from './InventoryManagement';
import BackupsManagement from './BackupsManagement';

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'orders';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const navigate = useNavigate();
  const [persistedEditSkuId, setPersistedEditSkuId] = useState(null);

  useEffect(() => {
    let timeoutId;
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 15 minutes inactivity timeout for admin panel
      timeoutId = setTimeout(() => {
        alert("מטעמי אבטחה, נותקת מהמערכת בעקבות חוסר פעילות.");
        logout();
      }, 15 * 60 * 1000);
    };

    resetTimeout();
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimeout));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, [logout]);

  useEffect(() => {
    if (location.state?.editSkuId) {
      setPersistedEditSkuId(location.state.editSkuId);
      setActiveTab('products');
      // Clean up state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.editSkuId, location.pathname, navigate]);

  return (
    <div className="container">
      <h1>פאנל ניהול</h1>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'statistics' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('statistics')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'statistics' ? '#e8e8e8ff' : '', color: activeTab !== 'statistics' ? '#475569' : '' }}>
          סטטיסטיקה
        </button>
        <button 
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('orders')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'orders' ? '#e8e8e8ff' : '', color: activeTab !== 'orders' ? '#475569' : '' }}>
          הזמנות
        </button>
        <button 
          className={`btn ${activeTab === 'products' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('products')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'products' ? '#e8e8e8ff' : '', color: activeTab !== 'products' ? '#475569' : '' }}>
          מוצרים
        </button>
        <button 
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('inventory')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'inventory' ? '#e8e8e8ff' : '', color: activeTab !== 'inventory' ? '#475569' : '' }}>
          מלאי
        </button>
        <button 
          className={`btn ${activeTab === 'season' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('season')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'season' ? '#e8e8e8ff' : '', color: activeTab !== 'season' ? '#475569' : '' }}>
          הכנה לעונה
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
        <button 
          className={`btn ${activeTab === 'archives' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('archives')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'archives' ? '#e8e8e8ff' : '', color: activeTab !== 'archives' ? '#475569' : '' }}>
          ארכיון
        </button>
        <button 
          className={`btn ${activeTab === 'backups' ? 'btn-primary' : ''}`} 
          onClick={() => setActiveTab('backups')}
          style={{ flex: '1 1 auto', padding: '0.5rem', fontSize: '0.9rem', background: activeTab !== 'backups' ? '#e8e8e8ff' : '', color: activeTab !== 'backups' ? '#475569' : '' }}>
          גיבויים
        </button>
      </div>



      {activeTab === 'products' && <ProductManagement editSkuId={persistedEditSkuId} />}
      {activeTab === 'season' && <SeasonTransition />}
      {activeTab === 'settings' && <SiteSettings />}
      {activeTab === 'regions' && <ShippingRegions />}
      {activeTab === 'customers' && <CustomersManagement />}
      {activeTab === 'archives' && <SeasonArchives />}
      {activeTab === 'statistics' && <SeasonStatistics />}
      {activeTab === 'orders' && <OrdersManagement />}
      {activeTab === 'inventory' && <InventoryManagement />}
      {activeTab === 'backups' && <BackupsManagement />}
    </div>
  );
};

export default AdminDashboard;
