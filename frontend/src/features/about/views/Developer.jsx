import React from 'react';
import { Github, Mail, Phone } from 'lucide-react';

const Developer = () => {

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '1rem auto', padding: '2rem 1.5rem', color: 'var(--text-color)', textAlign: 'center' }}>
      <div className="glass-panel" style={{ padding: '2rem 2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.34)' }}>
        <h1 style={{ color: 'var(--primary-color)', fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          יעקב ישראל נריה
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '2rem' }}>
          DevOps & Full-Stack Developer
        </p>

        <p style={{ fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '2.5rem', color: 'var(--text-color)' }}>
          שמח לפתח ולבנות פתרונות תוכנה מותאמים אישית. אתר זה נבנה ותוכנן תוך דגש על ביצועים מהירים, חווית משתמש מתקדמת ועיצוב מודרני.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          {/* WhatsApp Link */}
          <a
            href="https://wa.me/972553058189"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              width: '100%',
              maxWidth: '300px',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              background: '#25D366',
              color: '#ffffff',
              border: 'none',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 10px rgba(37, 211, 102, 0.3)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(37, 211, 102, 0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(37, 211, 102, 0.3)'; }}
          >
            <Phone size={18} />
            <span>וואטסאפ: 055-3058189</span>
          </a>

          {/* Email Link */}
          <a
            href="mailto:j4acob@outlook.co.il"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              width: '100%',
              maxWidth: '300px',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-color)',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'none'; }}
          >
            <Mail size={18} />
            <span>j4acob@outlook.co.il</span>
          </a>

          {/* GitHub Link */}
          <a
            href="https://github.com/YaakovNeriya"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
              width: '100%',
              maxWidth: '300px',
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-color)',
              borderRadius: '30px',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'none'; }}
          >
            <Github size={18} />
            <span>פרופיל GitHub</span>
          </a>
        </div>

        <div style={{ marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Built with ❤️ by Yaakov Israel Neriya
        </div>
      </div>
    </div>
  );
};

export default Developer;
