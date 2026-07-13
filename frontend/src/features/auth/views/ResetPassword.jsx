import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../../../api/client';
import { Lock, CheckCircle, XCircle } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('קישור לא חוקי או חסר טוקן.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }
    
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      await client.post('/users/reset-password', {
        token,
        new_password: password
      });
      setIsSuccess(true);
      setMessage('הסיסמה שונתה בהצלחה! מועבר למסך ההתחברות...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'אירעה שגיאה. ייתכן שהקישור פג תוקף או שכבר נעשה בו שימוש.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '2rem 1rem' }}>
      <div className="glass-panel hover-lift" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>
          <div style={{ background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'var(--primary-light)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: isSuccess ? '#10b981' : 'var(--primary-color)' }}>
            {isSuccess ? <CheckCircle size={30} /> : <Lock size={30} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
            {isSuccess ? 'הסיסמה עודכנה' : 'איפוס סיסמה'}
          </h2>
          {!isSuccess && (
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              הזן את הסיסמה החדשה שלך למטה.
            </p>
          )}
        </div>

        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#047857', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <XCircle size={18} />
            {error}
          </div>
        )}

        {!isSuccess && token && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>סיסמה חדשה</label>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={isSubmitting}
                minLength={6}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>אימות סיסמה חדשה</label>
              <input 
                type="password" 
                className="input-field" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
                disabled={isSubmitting}
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '1rem', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1, marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'שומר...' : 'שנה סיסמה'}
            </button>
          </form>
        )}
        
        {(!token || isSuccess) && (
          <button 
            onClick={() => navigate('/login')}
            className="btn" 
            style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginTop: '0.5rem', cursor: 'pointer' }}
          >
            חזרה להתחברות
          </button>
        )}

      </div>
    </div>
  );
};

export default ResetPassword;
