import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../features/auth/AuthContext';
import client from '../../api/client';
import { Clock, AlertCircle } from 'lucide-react';

const CountdownBanner = () => {
  const { user } = useContext(AuthContext);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    if (!user?.applicable_deadline) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(user.applicable_deadline).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsPassed(true);
        setTimeLeft(null);
      } else {
        setIsPassed(false);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft({ days, hours, minutes });
      }
    };

    updateCountdown();
    // No setInterval - banner updates only when the component remounts (page change)
  }, [user?.applicable_deadline]);

  if (!user || !user.applicable_deadline) return null;

  if (isPassed) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
        color: '#fecaca',
        textAlign: 'center',
        padding: '2.5rem 1rem 1rem 1rem',
        marginTop: '-4.5rem',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        fontWeight: '400',
        letterSpacing: '0.5px',
        borderBottom: '1px solid rgba(248, 113, 113, 0.3)',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        width: '100%'
      }}>
        <AlertCircle size={20} color="#f87171" />
        <span style={{ fontWeight: '500', letterSpacing: '0.5px' }}>חלון ההזמנות לעונה זו נסגר. לא ניתן לשלוח עגלות חדשות.</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="countdown-banner-container" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      color: '#f8fafc',
      textAlign: 'center',
      padding: '2.5rem 1rem 1rem 1rem',
      marginTop: '-4.5rem',
      marginBottom: '2rem',
      position: 'relative',
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
      borderBottom: '1px solid rgba(251, 191, 36, 0.15)',
      borderBottomLeftRadius: '16px',
      borderBottomRightRadius: '16px',
      width: '100%'
    }}>
      <span style={{ 
        background: 'rgba(251, 191, 36, 0.15)', 
        padding: '0.2rem 0.8rem', 
        borderRadius: '999px',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        color: '#fbbf24',
        fontWeight: 'bold',
        letterSpacing: '0.5px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        הזמנות עד {new Date(user.applicable_deadline).getDate()}.{new Date(user.applicable_deadline).getMonth() + 1} <span style={{ fontSize: '0.85em', opacity: 0.8, fontWeight: 'normal', padding: '0 0.15rem' }}>בשעה {new Date(user.applicable_deadline).getHours().toString().padStart(2, '0')}:{new Date(user.applicable_deadline).getMinutes().toString().padStart(2, '0')}</span>
      </span>
      <div className="countdown-text-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock className="countdown-clock-icon" size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span className="countdown-main-text" style={{ fontWeight: '400', letterSpacing: '0.5px' }}>
            נותרו עוד <strong style={{ color: '#fbbf24', padding: '0 0.15rem', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>{timeLeft.days}</strong> ימים, <strong style={{ color: '#fbbf24', padding: '0 0.15rem', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>{timeLeft.hours}</strong> שעות ו-<strong style={{ color: '#fbbf24', padding: '0 0.15rem', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>{timeLeft.minutes}</strong> דקות
          </span>
        </div>
        <span className="deadline-season-text" style={{ fontWeight: '400', letterSpacing: '0.5px' }}>לסגירת העונה!</span>
      </div>
    </div>
  );
};

export default CountdownBanner;
