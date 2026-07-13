import React, { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../features/auth/AuthContext';
import { CartContext } from '../features/cart/CartContext';
import { ShoppingCart, LogOut, Shield, Menu, X, User } from 'lucide-react';
import client from '../api/client';
import ThemeToggle from '../components/ui/ThemeToggle';
import NavbarSearch from './NavbarSearch';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount, hasUnsentItems, hasActiveOrder } = useContext(CartContext);
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const prevCartCountRef = useRef(cartCount);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    client.get('/products/public/settings').then(res => setSettings(res.data || {})).catch(console.error);
  }, []);

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

  // Handle "Send Order" reminder tooltip
  useEffect(() => {
    let timer1, timer2;
    if (location.pathname === '/' && hasUnsentItems && !hasActiveOrder) {
      timer1 = setTimeout(() => {
        setShowReminder(true);
        timer2 = setTimeout(() => {
          setShowReminder(false);
        }, 10000);
      }, 4000);
    } else {
      setShowReminder(false);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname, hasUnsentItems, hasActiveOrder]);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <nav className="nav-bar" style={isMobile ? { background: 'transparent', boxShadow: 'none', border: 'none', backdropFilter: 'none', padding: '1rem', marginBottom: '0.5rem' } : {}}>
      <div className="container nav-content">
        <Link to="/" onClick={() => {
          sessionStorage.removeItem('catalogScrollPos');
          window.scrollTo(0, 0);
        }} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          textDecoration: 'none',
        }} className={isMobile ? 'mobile-hidden' : ''}>
          <img className="nav-logo" src="/bingo_logo.webp" alt="בינגו בדים" style={{ height: '40px', objectFit: 'contain', margin: '-15px -1px -15px 0' }} />
        </Link>

        {!isMobile && (
          <NavbarSearch isMobile={isMobile} isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} />
        )}

        <div className={`nav-links ${isMobile ? 'mobile-hidden' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          {user ? (
              <>
                {/* Username Greeting */}
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <div 
                    className="hide-on-mobile-menu"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.6)', 
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      borderRadius: '9999px',
                      padding: '0.5rem 1.2rem',
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      fontFamily: '"Assistant", sans-serif',
                      color: 'var(--primary-color)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      userSelect: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={18} style={{ opacity: 0.8 }} />
                      <span>שלום, {user.first_name ? user.first_name : 'אורח'}</span>
                    </div>
                  </div>
                </Link>

                {/* Cart Button */}
                <Link to="/cart" style={{ textDecoration: 'none' }}>
                  <div 
                    className={`cart-button-container ${showTooltip ? 'explode-bubbles' : ''}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      color: 'var(--primary-color)',
                      width: '43px',
                      height: '43px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => { 
                      e.currentTarget.style.transform = 'scale(1.08) translateY(-1px)'; 
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.transform = 'scale(1) translateY(0)'; 
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                    }}
                  >
                    <ShoppingCart size={20} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    {cartCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#eab308',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: '2px solid white',
                        boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)',
                        padding: '0 4px'
                      }}>{cartCount}</span>
                    )}
                    
                    {/* Reminder Tooltip for Desktop */}
                    {showReminder && (
                      <div style={{
                        position: 'absolute',
                        top: '55px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(245, 158, 11, 0.95)',
                        color: 'white',
                        padding: '0.4rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                        zIndex: 100,
                        pointerEvents: 'none',
                        animation: 'fadeInDown 0.4s ease-out'
                      }}>
                        <div style={{
                          content: '""',
                          position: 'absolute',
                          top: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          width: '10px',
                          height: '10px',
                          background: 'rgba(245, 158, 11, 0.95)',
                        }} />
                        שלח הזמנה
                      </div>
                    )}
                  </div>
                </Link>
                
                {/* Logout Button */}
                <button 
                  className="nav-auth-buttons hide-on-mobile-menu"
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
              </>
          ) : (
            <Link to="/login" className="btn btn-primary nav-auth-buttons" style={{ padding: '0.5rem 1rem' }}>
              <span style={{ marginLeft: '0.25rem' }}>התחבר</span>
              <LogOut size={18} style={{ transform: 'scaleX(-1)' }} />
            </Link>
          )}
        </div>

        {/* Mobile Actions (Premium App-like Header) */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '1rem',
            marginTop: '0.3rem',
            marginBottom: '0.3rem'
          }}>
            
            {/* Standalone Enlarge Favicon (Right - RTL) */}
            <Link to="/" onClick={() => { sessionStorage.removeItem('catalogScrollPos'); window.scrollTo(0, 0); }} style={{ flexShrink: 0, display: 'flex', textDecoration: 'none', alignItems: 'center', position: 'relative' }}>
              {/* Powder Glow Effect */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90px',
                height: '60px',
                background: 'rgba(255, 255, 255, 0.7)',
                filter: 'blur(15px)',
                borderRadius: '50%',
                zIndex: -1,
                pointerEvents: 'none'
              }}></div>
              
              <img 
                src="/bingo_2_row.webp" 
                alt="Bingo Fabrics" 
                style={{ 
                  height: '40px', 
                  width: '50px',
                  objectFit: 'contain',
                  transform: 'scale(1.4)',
                  transformOrigin: 'center'
                }} 
              />
            </Link>

            {/* Floating Search Pill (Takes remaining space) */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.4))',
              borderRadius: '999px',
              padding: '0.5rem 1rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              gap: '0.75rem',
            }}>
              {/* Cart (Right inside Pill - RTL) */}
              <Link to="/cart" style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)', position: 'relative' }}>
                <ShoppingCart size={22} strokeWidth={2.5} />
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '-13px',
                    background: '#eab308',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '700',
                    minWidth: '23px',
                    height: '23px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    boxShadow: '0 2px 6px rgba(234, 179, 8, 0.4)',
                    border: '2px solid white'
                  }}>{cartCount}</span>
                )}
                
                {/* Reminder Tooltip for Mobile */}
                {showReminder && (
                  <div style={{
                    position: 'absolute',
                    top: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(245, 158, 11, 0.95)',
                    color: 'white',
                    padding: '0.4rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                    zIndex: 100,
                    pointerEvents: 'none',
                    animation: 'fadeInDown 0.4s ease-out'
                  }}>
                    <div style={{
                      content: '""',
                      position: 'absolute',
                      top: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '10px',
                      height: '10px',
                      background: 'rgba(245, 158, 11, 0.95)',
                    }} />
                    שלח הזמנה
                  </div>
                )}
              </Link>
              
              {/* Search Placeholder (Center) */}
              <div 
                onClick={() => setIsSearchActive(true)}
                style={{ 
                  flex: 1, 
                  color: 'var(--text-light)', 
                  cursor: 'text', 
                  fontSize: '1.1rem', 
                  fontWeight: '500',
                  textAlign: 'right',
                  padding: '0 0.5rem'
                }}
              >
                 חיפוש ...
              </div>
              
              {/* Hamburger (Left inside Pill - RTL) */}
              <button 
                className="mobile-hamburger-btn"
                onClick={() => setIsDrawerOpen(true)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-color)', padding: 0 }}
              >
                <Menu size={26} strokeWidth={2.2} />
              </button>

              <NavbarSearch isMobile={isMobile} isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} />
            </div>

            {/* Login Button (if not logged in) - Outside Pill (Left - RTL) */}
            {!user && (
              <Link 
                to="/login"
                style={{ 
                  flexShrink: 0,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary-color)',
                  background: 'var(--glass-bg, rgba(255, 255, 255, 0.85))',
                  border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.4))',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                  textDecoration: 'none'
                }}
              >
                <User size={22} strokeWidth={2.2} />
              </Link>
            )}

          </div>
        )}
        
        {!isMobile && (
          <button 
            className="mobile-hamburger-btn"
            onClick={() => setIsDrawerOpen(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'none', color: 'var(--primary-color)' }}
          >
            <Menu size={32} />
          </button>
        )}

      </div>

      {/* Hamburger Drawer */}
      {createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 999999,
            pointerEvents: isDrawerOpen ? 'auto' : 'none',
          }}
        >
          {/* Backdrop overlay */}
          <div 
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              opacity: isDrawerOpen ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsDrawerOpen(false);
            }}
          />

          <div 
            className="hamburger-drawer"
            style={{
              position: 'absolute',
              top: 0,
              left: isDrawerOpen ? 0 : '-100%',
              width: '65%',
              height: '100vh',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              transition: 'left 0.4s ease',
              boxShadow: '8px 0 15px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem 1rem',
              borderRight: '1px solid var(--glass-border)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start', padding: '0 1rem', marginTop: '1rem', flexShrink: 0 }}>
              {user && (
                <>
                  <Link 
                    to="/profile" 
                    onClick={() => setIsDrawerOpen(false)}
                    style={{ 
                      textDecoration: 'none',
                      width: '100%'
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '700', 
                      color: 'var(--primary-color)',
                      borderBottom: '1px solid var(--glass-border)',
                      paddingBottom: '0.75rem',
                      marginBottom: '0.25rem',
                      fontFamily: '"Assistant", sans-serif',
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} style={{ color: 'var(--primary-color)' }} />
                        <span>שלום, {user.first_name || 'אורח'}</span>
                      </div>
                    </div>
                  </Link>
                  {user.is_admin && (
                    <Link 
                      to="/bingo-sys-manager-hq" 
                      onClick={() => setIsDrawerOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#1d4ed8', fontWeight: 'bold' }}
                    >
                      <Shield size={20} /> ניהול
                    </Link>
                  )}
                  <div 
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setShowLogoutConfirm(true);
                    }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#9f1239', fontWeight: 'bold' }}
                  >
                    <LogOut size={20} /> התנתק
                  </div>
                </>
              )}
            </div>

          {/* About Banner inside Drawer */}
          <div style={{
            marginTop: '2rem',
            flexGrow: 0.8,
            padding: '2rem 1rem',
            background: 'linear-gradient(rgba(65, 65, 65, 0.23), rgba(0, 0, 0, 0.68)), url(/fabric_banner_cropped.webp) center/cover no-repeat',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h3 style={{ fontSize: '1.5rem', color: '#ffffff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>הסיפור שמאחורי הבדים</h3>
            <p style={{ fontSize: '1rem', color: '#f0f0f0', margin: 0, lineHeight: '1.4', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              {settings.about_text
                ? settings.about_text.split('\n')[0]
                : 'ברוכים הבאים לבינגו בדים, המקום בו אופנה, יצירה ואיכות נפגשים.'}
            </p>
            <Link
              to="/about"
              onClick={() => setIsDrawerOpen(false)}
              style={{
                marginTop: '0.5rem',
                padding: '0.6rem 1.5rem',
                fontSize: '1rem',
                background: 'rgba(255,255,255,0.15)',
                border: '2px solid #ffffff',
                color: '#ffffff',
                borderRadius: '30px',
                textDecoration: 'none',
                fontWeight: 'bold',
              }}
            >
              הכירו אותנו
            </Link>
            <Link
              to="/terms"
              onClick={() => setIsDrawerOpen(false)}
              style={{
                marginTop: '0.5rem',
                fontSize: '1rem',
                color: '#d1d5db',
                textDecoration: 'underline',
                background: 'transparent',
                border: 'none',
              }}
            >
              תקנון ותנאי שימוש
            </Link>
            <div style={{ marginTop: '0.5rem' }}>
              <ThemeToggle />
            </div>
            <Link
              to="/developer"
              onClick={() => setIsDrawerOpen(false)}
              style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; }}
            >
              Built by Y.I.N
            </Link>
          </div>
        </div>
      </div>,
      document.body
    )}
      
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
            
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '0.75rem', fontFamily: '"Assistant", sans-serif' }}>
              האם אתה בטוח?
            </h3>
            
            <p style={{ color: 'var(--text-light)', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              אתה עומד להתנתק מהחשבון שלך בבינגו בדים. נשמח לראותך שוב בקרוב!
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'var(--glass-bg)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  color: 'var(--text-light)',
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
                onClick={handleLogout}
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
