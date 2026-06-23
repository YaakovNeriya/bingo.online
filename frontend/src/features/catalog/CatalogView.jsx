import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import client from '../../api/client';
import ProductCard from './ProductCard';
import ShareWidget from '../../components/ShareWidget';
import ImageCarousel from '../../components/ImageCarousel';
import ThemeToggle from '../../components/ThemeToggle';

const CatalogView = () => {
  const { user } = useContext(AuthContext);
  const [catalog, setCatalog] = useState([]);
  const [settings, setSettings] = useState({});
  const [carouselImages, setCarouselImages] = useState([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await client.get('/products/catalog');
        setCatalog(res.data);
      } catch (err) {
        console.error("Failed to fetch catalog", err);
      }
    };
    const fetchSettings = async () => {
      try {
        const res = await client.get('/products/public/settings');
        setSettings(res.data || {});
        if (res.data && res.data.carousel_images) {
          try {
            setCarouselImages(JSON.parse(res.data.carousel_images));
          } catch(e) {
            console.error("Failed to parse carousel images", e);
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchCatalog();
    fetchSettings();
  }, []);

  return (
    <div className="container">
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>
            {settings.main_page_title || 'הקטלוג שלנו'}
          </h1>
          {settings.main_page_subtitle && (
            <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--text-light)', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {settings.main_page_subtitle}
            </h3>
          )}
        </div>
        
        {user?.is_superuser && (
          <Link 
            to="/admin"
            title="ניהול"
            style={{
              position: 'absolute',
              left: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              zIndex: 10
            }}
          >
            <Shield size={20} />
          </Link>
        )}
        
        <ShareWidget url={window.location.origin} title={settings.main_page_title || "בינגו בדים - קטלוג מוצרים"} />
      </div>

      {carouselImages.length > 0 && (
        <div style={{ marginBottom: '3rem', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <ImageCarousel 
            images={carouselImages} 
            alt="קרוסלת עמוד הבית" 
            height="300px" 
            autoPlay={true} 
            autoPlayInterval={5000} 
          />
        </div>
      )}
      
      {catalog.map(type => (
        <div key={type.id} style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', borderBottom: '2px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            {type.name}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
            {type.product_models.map(model => (
              <ProductCard key={model.id} productModel={model} />
            ))}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: '4rem',
        padding: '4rem 2rem',
        background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(/fabric_banner_cropped.png) center/cover no-repeat',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: '2.2rem', color: '#ffffff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>הסיפור שמאחורי הבדים</h3>
        <p style={{ fontSize: '1.3rem', color: '#f0f0f0', maxWidth: '600px', margin: 0, lineHeight: '1.6', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {settings.about_text 
            ? settings.about_text.split('\n')[0] 
            : 'ברוכים הבאים לבינגו בדים, המקום בו אופנה, יצירה ואיכות נפגשים.'}
        </p>
        <Link 
          to="/about" 
          style={{ 
            marginTop: '1rem',
            padding: '0.8rem 2.5rem', 
            fontSize: '1.1rem',
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid #ffffff',
            color: '#ffffff',
            backdropFilter: 'blur(4px)',
            borderRadius: '30px',
            transition: 'all 0.3s ease',
            textDecoration: 'none',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#000000'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#ffffff'; }}
        >
          הכירו אותנו מקרוב
        </Link>
        <ThemeToggle style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 10 }} />
      </div>
    </div>
  );
};

export default CatalogView;
