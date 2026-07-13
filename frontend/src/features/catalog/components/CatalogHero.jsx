import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import ShareWidget from '../../../components/ui/ShareWidget';
import ImageCarousel from '../../../components/ui/ImageCarousel';
import CountdownBanner from '../../../components/ui/CountdownBanner';

export const CatalogHero = ({ carouselImages, settings, user }) => {
  if (carouselImages.length > 0) {
    return (
      <>
        <div className="home-carousel-wrapper" style={{ zIndex: 45, position: 'relative' }}>
          <ImageCarousel
            images={carouselImages}
            alt="קרוסלת עמוד הבית"
            height="100%"
            autoPlay={true}
            autoPlayInterval={5000}
          />
          <div className="carousel-overlay-centered">
            <h1 className="overlay-title-centered" style={{ margin: 0 }}>
              {settings.main_page_title || 'הקטלוג שלנו'}
            </h1>
            {settings.main_page_date && (
              <h2 className="overlay-date-centered">
                {settings.main_page_date}
              </h2>
            )}

            <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '2rem', pointerEvents: 'auto' }}>
              {user?.is_superuser && (
                <Link to="/bingo-sys-manager-hq" title="ניהול" className="admin-link-btn">
                  <Shield size={20} />
                </Link>
              )}
              <ShareWidget url={window.location.origin} title={settings.main_page_title || "בינגו בדים - קטלוג מוצרים"} />
            </div>
          </div>
        </div>
        <CountdownBanner />
      </>
    );
  }

  return (
    <div className="standard-header-content">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>
          {settings.main_page_title || 'הקטלוג שלנו'}
        </h1>
        {settings.main_page_date && (
          <h2 style={{ margin: '0.25rem 0 0 0', color: 'var(--primary-color)', fontWeight: 'normal', fontSize: '1.5rem' }}>
            {settings.main_page_date}
          </h2>
        )}
        {settings.main_page_subtitle && (
          <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--text-light)', fontWeight: 'bold', fontSize: '1.2rem' }}>
            {settings.main_page_subtitle}
          </h3>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user?.is_superuser && (
          <Link to="/bingo-sys-manager-hq" title="ניהול" className="admin-link-btn">
            <Shield size={20} />
          </Link>
        )}
        <ShareWidget url={window.location.origin} title={settings.main_page_title || "בינגו בדים - קטלוג מוצרים"} />
      </div>
    </div>
  );
};
