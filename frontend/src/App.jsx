import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './layouts/Navbar';
import ScrollToTop from './components/ScrollToTop';
import client from './api/client';

// Lazy load all views for Code Splitting
const CatalogView = lazy(() => import('./features/catalog/views/CatalogView'));
const ProductDetailView = lazy(() => import('./features/catalog/views/ProductDetailView'));
const Login = lazy(() => import('./features/auth/views/Login'));
const CartView = lazy(() => import('./features/cart/views/CartView'));
const About = lazy(() => import('./features/about/views/About'));
const Terms = lazy(() => import('./features/about/views/Terms'));
const Developer = lazy(() => import('./features/about/views/Developer'));
const AdminDashboard = lazy(() => import('./features/admin/views/AdminDashboard'));
const ProfileView = lazy(() => import('./features/profile/views/ProfileView'));
const ForgotPassword = lazy(() => import('./features/auth/views/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/auth/views/ResetPassword'));

function App() {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    
    if (utmSource) {
      const trackedKey = `tracked_${utmSource}`;
      if (!sessionStorage.getItem(trackedKey)) {
        client.post('/products/track-visit', { source: utmSource })
          .then(() => {
            sessionStorage.setItem(trackedKey, 'true');
          })
          .catch(err => console.error('Tracking failed:', err));
      }
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  const location = useLocation();
  const showNavbar = !['/login', '/forgot-password', '/reset-password'].includes(location.pathname);
  const [impersonatedUserName, setImpersonatedUserName] = React.useState(localStorage.getItem('impersonatedUserName'));

  React.useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'impersonatedUserName') {
        setImpersonatedUserName(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleEndImpersonation = () => {
    localStorage.removeItem('impersonatedUserId');
    localStorage.removeItem('impersonatedUserName');
    setImpersonatedUserName(null);
    window.location.href = '/bingo-sys-manager-hq?tab=customers';
  };

  return (
    <>
      <ScrollToTop />
      {impersonatedUserName && (
        <div style={{
          background: '#eab308',
          color: 'var(--text-color)',
          textAlign: 'center',
          padding: '0.75rem',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          flexWrap: 'wrap'
        }}>
          <span>מצב התחזות : <span style={{ textDecoration: 'underline' }}>{impersonatedUserName}</span></span>
          <button 
            onClick={handleEndImpersonation}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.25rem 0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            סיים עריכה וחזור לניהול
          </button>
        </div>
      )}
      {showNavbar && <Navbar />}
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>
          טוען את בינגו בדים...
        </div>
      }>
        <Routes>
          <Route path="/" element={<CatalogView />} />
          <Route path="/product/:modelId" element={<ProductDetailView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/cart" element={<CartView />} />
          <Route path="/bingo-sys-manager-hq" element={<AdminDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/developer" element={<Developer />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
