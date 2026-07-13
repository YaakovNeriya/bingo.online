import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../../../components/ui/ThemeToggle';

export const AboutBanner = ({ settings }) => {
  return (
    <div className="hide-on-mobile" style={{
      margin: '4rem 0 4rem 0',
      padding: '4rem 2rem',
      background: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(/fabric_banner_cropped.webp) center/cover no-repeat',
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
        <Link
          to="/about"
          style={{
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
        <Link
          to="/terms"
          style={{
            fontSize: '1.1rem',
            color: '#d1d5db',
            textDecoration: 'underline',
            background: 'transparent',
            border: 'none',
            padding: '0.2rem'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#d1d5db'; }}
        >
          תקנון ותנאי שימוש
        </Link>
      </div>
      <ThemeToggle style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 10 }} />
      <Link
        to="/developer"
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1.5rem',
          fontSize: '1.5rem',
          color: 'rgba(255, 255, 255, 0.45)',
          textDecoration: 'none',
          transition: 'color 0.3s ease',
          zIndex: 10
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
      >
        Built by Y.I.N
      </Link>
    </div>
  );
};
