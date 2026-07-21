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
      <div className="countdown-banner-container passed">
        <AlertCircle size={20} color="#f87171" />
        <span style={{ fontWeight: '500', letterSpacing: '0.5px' }}>חלון ההזמנות לעונה זו נסגר. לא ניתן לשלוח עגלות חדשות.</span>
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="countdown-banner-container">
      <span className="countdown-badge">
        הזמנות עד {new Date(user.applicable_deadline).getDate()}.{new Date(user.applicable_deadline).getMonth() + 1} <span className="countdown-badge-small-text">בשעה {new Date(user.applicable_deadline).getHours().toString().padStart(2, '0')}:{new Date(user.applicable_deadline).getMinutes().toString().padStart(2, '0')}</span>
      </span>
      <div className="countdown-text-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock className="countdown-clock-icon" size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          <span className="countdown-main-text">
            נותרו עוד <strong className="countdown-number">{timeLeft.days}</strong> ימים, <strong className="countdown-number">{timeLeft.hours}</strong> שעות ו-<strong className="countdown-number">{timeLeft.minutes}</strong> דקות
          </span>
        </div>
        <span className="deadline-season-text">לסגירת העונה!</span>
      </div>
    </div>
  );
};

export default CountdownBanner;
