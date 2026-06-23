import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CatalogView from './features/catalog/CatalogView';
import ProductDetailView from './features/catalog/ProductDetailView';
import Login from './features/auth/Login';
import CartView from './features/cart/CartView';
import AdminDashboard from './features/admin/AdminDashboard';
import About from './features/about/About';
import client from './api/client';

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
  const showNavbar = location.pathname !== '/login';

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<CatalogView />} />
        <Route path="/product/:modelId" element={<ProductDetailView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<CartView />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;
