import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { CartProvider } from './features/cart/CartContext.jsx';
import { CatalogProvider } from './features/catalog/CatalogContext.jsx';

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://fe0b92ea065aa4f4e9fb06fe6f54e49a@o4511698789728256.ingest.de.sentry.io/4511699093684304",
  dataCollection: {}
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider 
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
        onScriptLoadError={() => console.warn('Google OAuth script failed to load. Google Login will be disabled.')}
      >
        <AuthProvider>
          <CartProvider>
            <CatalogProvider>
              <App />
            </CatalogProvider>
          </CartProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
