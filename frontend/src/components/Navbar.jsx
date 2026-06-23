import React, { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AuthContext } from '../features/auth/AuthContext';
import { CartContext } from '../features/cart/CartContext';
import { ShoppingCart, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const prevCartCountRef = useRef(cartCount);

  useEffect(() => {
    let timer1, timer2;
    if (user) {
      if (!sessionStorage.getItem('cartTooltipShown')) {
        sessionStorage.setItem('cartTooltipShown', 'true');
        timer1 = setTimeout(() => {
          setShowTooltip(true);
          timer2 = setTimeout(() => {
            setShowTooltip(false);
          }, 10500);
        }, 2000);
      }
    } else {
      setShowTooltip(false);
      sessionStorage.removeItem('cartTooltipShown');
    }
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [user]);

  useEffect(() => {
    // Show tooltip if cart count increases (user added item)
    if (prevCartCountRef.current !== undefined && cartCount > prevCartCountRef.current) {
      // Don't trigger on initial load if going from 0 to N just from fetching
      // Wait, if it goes from 0 to N on load, prevCartCount is 0.
      // But if user is just logging in, it's covered by the first useEffect.
      setShowTooltip(true);
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 6000);
      prevCartCountRef.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <nav className="nav-bar glass-panel">
      <div className="container nav-content">
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          textDecoration: 'none',
        }}>
          <img className="nav-logo" src="/logo.png" alt="בינגו בדים" style={{ height: '70px', objectFit: 'contain', margin: '-15px -10px -15px 0' }} />
        </Link>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          
          {user ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'rgba(255,255,255,0.6)', 
                border: '1px solid rgba(255,255,255,0.8)',
                borderRadius: '9999px',
                padding: '0.25rem 0.5rem 0.25rem 0.25rem',
                gap: '0.75rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
              }}>
                <Link to="/cart" style={{ textDecoration: 'none' }}>
                  <div className={`coin-scene ${showTooltip ? 'flipped explode-bubbles' : ''}`}>
                    <div className="coin-flipper">
                      {/* Front: User Name */}
                      <div className="coin-front">
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          fontSize: '1.1rem', 
                          fontWeight: '400', 
                          fontFamily: '"Gveret Levin", cursive', 
                          lineHeight: '1.1',
                          marginTop: '0.15rem'
                        }}>
                          <span>שלום</span>
                          <span>{user.first_name ? user.first_name : 'אורח'}</span>
                        </div>
                        {cartCount > 0 && (
                          <span className="front-cart-badge" style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-6px',
                            background: '#eab308',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>{cartCount}</span>
                        )}
                      </div>

                      {/* Back: Cart Icon */}
                      <div className="coin-back">
                        <ShoppingCart size={28} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                        {cartCount > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-6px',
                            background: '#eab308',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>{cartCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
                
                <button 
                  onClick={() => setShowLogoutConfirm(true)} 
                  title="התנתק"
                  style={{ 
                    background: 'linear-gradient(145deg, #ffffff, #f5f5f5)', 
                    border: '1px solid rgba(159, 18, 57, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '43px',
                    height: '43px',
                    borderRadius: '50%',
                    color: '#9f1239',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 8px rgba(0,0,0,0.06), -3px -3px 8px #ffffff',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'; 
                    e.currentTarget.style.boxShadow = '5px 5px 12px rgba(159, 18, 57, 0.15), -3px -3px 8px #ffffff'; 
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.transform = 'scale(1) translateY(0)'; 
                    e.currentTarget.style.boxShadow = '3px 3px 8px rgba(0,0,0,0.06), -3px -3px 8px #ffffff'; 
                  }}
                >
                  <LogOut size={20} />
                </button>
              </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              <span className="hide-on-mobile" style={{ marginLeft: '0.25rem' }}>התחבר</span>
              <LogOut size={18} style={{ transform: 'scaleX(-1)' }} />
            </Link>
          )}
        </div>
      </div>
      
      {showLogoutConfirm && createPortal(
        <div 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowLogoutConfirm(false);
          }}
          style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-panel" style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '24px',
            padding: '2.5rem',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.5) inset',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '64px', height: '64px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)'
            }}>
              <LogOut size={32} color="#dc2626" style={{ transform: 'translateX(-2px)' }} />
            </div>
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.75rem', fontFamily: '"Assistant", sans-serif' }}>
              האם אתה בטוח?
            </h3>
            
            <p style={{ color: '#64748b', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              אתה עומד להתנתק מהחשבון שלך בבינגו בדים. נשמח לראותך שוב בקרוב!
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  color: '#64748b',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                ביטול
              </button>
              <button 
                onClick={handleConfirmLogout}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'; }}
              >
                התנתק
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default Navbar;
