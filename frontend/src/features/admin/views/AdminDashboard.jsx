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
import '../admin.css';

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || localStorage.getItem('admin_dashboard_tab') || 'orders';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    localStorage.setItem('admin_dashboard_tab', activeTab);
  }, [activeTab]);
  
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
      
      <div className="admin-tabs-container">
        <button
          className={`btn admin-tab-btn ${activeTab === 'statistics' ? 'btn-primary' : 'admin-tab-btn-inactive'}`}
          onClick={() => setActiveTab('statistics')}
        >
          סטטיסטיקה
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'orders' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('orders')}
        >
          הזמנות
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'products' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('products')}
        >
          מוצרים
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'inventory' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('inventory')}
        >
          מלאי
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'season' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('season')}
        >
          הכנה לעונה
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'settings' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('settings')}
        >
          הגדרות חנות
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'customers' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('customers')}
        >
          לקוחות
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'regions' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('regions')}
        >
          אזורי חלוקה
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'archives' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('archives')}
        >
          ארכיון עונות
        </button>
        <button 
          className={`btn admin-tab-btn ${activeTab === 'backups' ? 'btn-primary' : 'admin-tab-btn-inactive'}`} 
          onClick={() => setActiveTab('backups')}
        >
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
