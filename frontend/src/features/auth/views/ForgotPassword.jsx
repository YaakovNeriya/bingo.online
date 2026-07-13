import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../../../api/client';
import { ArrowRight, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await client.post(`/users/password-recovery/${encodeURIComponent(email)}`);
      // We always show a success message regardless of actual existence to prevent email enumeration
      setMessage('אם כתובת האימייל קיימת במערכת, קישור לאיפוס סיסמה נשלח אליה עכשיו. (אנא בדוק גם בתיקיית הספאם)');
      setEmail('');
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError('יותר מדי ניסיונות. אנא נסה שוב בעוד מספר דקות.');
      } else {
        setError('אירעה שגיאה. אנא נסה שנית מאוחר יותר.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '2rem 1rem' }}>
      <div className="glass-panel hover-lift" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        <button 
          onClick={() => navigate('/login')}
          aria-label="חזרה להתחברות"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.3rem',
            background: '#dedede9f',
            border: '1px solid var(--glass-border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-color)',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary-color)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; e.currentTarget.style.color = 'var(--text-color)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <ArrowRight size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <div style={{ background: 'var(--primary-light)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--primary-color)' }}>
            <Mail size={30} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.5rem' }}>שכחת סיסמה?</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            הזן את כתובת האימייל שאיתה נרשמת, ואנו נשלח לך קישור לאיפוס הסיסמה.
          </p>
        </div>

        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#047857', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>אימייל</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={isSubmitting}
              placeholder="example@gmail.com"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ padding: '1rem', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'שולח...' : 'שלח קישור לאיפוס'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ForgotPassword;
