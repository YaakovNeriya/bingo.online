import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { Shield, Key, CheckCircle, AlertCircle } from 'lucide-react';

const ProfileView = () => {
  const navigate = useNavigate();
  const {
    user,
    regions,
    isLoadingRegions,
    isSaving,
    error,
    successMessage,
    formData,
    handleChange,
    updateProfile
  } = useProfile();

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const isImpersonating = !!localStorage.getItem('impersonatedUserId');

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>אנא התחבר כדי לצפות בפרופיל שלך</h2>
        <button 
          onClick={() => navigate('/login')} 
          className="btn btn-primary"
          style={{ marginTop: '1rem', padding: '0.5rem 1.5rem' }}
        >
          להתחברות
        </button>
      </div>
    );
  }

  const selectedRegion = regions.find(r => r.id === parseInt(formData.region_id));

  return (
    <div className="container" style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1 style={{ 
        color: 'var(--primary-color)', 
        borderBottom: '3px solid var(--glass-border)',  
        fontSize: '2rem'
      }}>
        הפרופיל שלי
      </h1>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1.5rem',
        alignItems: 'stretch',
        flexWrap: 'wrap'
      }}>
        {/* Left Side: Summary Card */}
        <div 
          className="glass-panel" 
          style={{ 
            flex: '1 1 250px',
            padding: '2rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            height: 'fit-content'
          }}
        >
          <h2 style={{ color: 'var(--primary-color)', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
            {user.first_name} {user.last_name}
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '1rem', margin: '0 0 1.5rem 0' }}>
            {user.email}
          </p>

          <div style={{ 
            width: '100%', 
            borderTop: '1px solid var(--glass-border)', 
            paddingTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            textAlign: 'right'
          }}>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>סטטוס חשבון:</span>
              <span style={{ marginRight: '0.5rem', color: user.is_superuser ? '#1d4ed8' : 'var(--text-color)' }}>
                {user.is_superuser ? 'מנהל מערכת' : 'לקוח רשום'}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>אזור משלוח:</span>
              <span style={{ marginRight: '0.5rem', color: 'var(--text-color)' }}>
                {selectedRegion ? selectedRegion.name : 'לא נבחר אזור'}
              </span>
            </div>
            {selectedRegion && (
              <div>
                <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>עלות משלוח:</span>
                <span style={{ marginRight: '0.5rem', color: 'var(--text-color)' }}>
                  {selectedRegion.shipping_cost}₪
                </span>
              </div>
            )}

            {/* Social Login Badge */}
            {user.login_method && user.login_method !== 'email' && (
              <div style={{
                marginTop: '0.5rem',
                background: user.login_method === 'google' ? 'rgba(219, 68, 85, 0.08)' : 'rgba(24, 119, 242, 0.08)',
                border: `1px solid ${user.login_method === 'google' ? 'rgba(219, 68, 85, 0.25)' : 'rgba(24, 119, 242, 0.25)'}`,
                color: user.login_method === 'google' ? '#c5221f' : '#1877f2',
                padding: '0.5rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                justifyContent: 'center',
                width: '100%',
                fontFamily: '"Assistant", sans-serif'
              }}>
                מחובר באמצעות {user.login_method === 'google' ? 'Google' : 'Facebook'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <form 
          onSubmit={updateProfile}
          className="glass-panel" 
          style={{ 
            flex: '2 1 450px',
            padding: '2.5rem 2rem', 
            borderRadius: '16px', 
            border: '1px solid var(--glass-border)', 
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >


          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>שם פרטי</label>
              <input 
                type="text" 
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field" 
                required 
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>שם משפחה</label>
              <input 
                type="text" 
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field" 
                required 
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>מספר טלפון</label>
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field" 
                pattern="^[\d\s\-\+]+$"
                title="נא להזין מספר נייד תקין"
                required 
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>כתובת אימייל (שם משתמש)</label>
              <input 
                type="email" 
                value={user.email}
                disabled 
                className="input-field" 
                style={{ 
                  width: '100%', 
                  padding: '0.65rem 0.85rem', 
                  background: 'rgba(0,0,0,0.05)', 
                  cursor: 'not-allowed', 
                  opacity: 0.7 
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>אזור משלוח לקבלת הזמנות</label>
            <select
              name="region_id"
              value={formData.region_id}
              onChange={handleChange}
              className="input-field"
              required
              style={{ width: '100%', padding: '0.65rem 0.85rem' }}
            >
              <option value="">בחר אזור משלוח...</option>
              {isLoadingRegions ? (
                <option disabled>טוען אזורים...</option>
              ) : (
                regions.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} (משלוח: {r.shipping_cost}₪, זמן אספקה: {r.delivery_days} ימים)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Toggle Password Change section */}
          {(!user.login_method || user.login_method === 'email') && (
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary-color)',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.95rem'
                }}
              >
                <Key size={18} />
                <span>{showPasswordSection ? 'בטל שינוי סיסמה' : (isImpersonating ? 'שנה סיסמת לקוח (כמנהל)' : 'שנה סיסמת גישה')}</span>
              </button>

              {showPasswordSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                  {!isImpersonating && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>סיסמה נוכחית (חובה לשם אימות)</label>
                      <input 
                        type="password" 
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleChange}
                        className="input-field" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>סיסמה חדשה</label>
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                      />
                    </div>
                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>אימות סיסמה חדשה</label>
                      <input 
                        type="password" 
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className="input-field" 
                        style={{ width: '100%', padding: '0.65rem 0.85rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.3)', 
              color: '#15803d', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px',
              fontSize: '0.95rem',
              marginTop: '1.5rem'
            }}>
              <CheckCircle size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#b91c1c', 
              padding: '0.75rem 1rem', 
              borderRadius: '8px',
              fontSize: '0.95rem',
              marginTop: '1.5rem'
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '1rem', 
            marginTop: '1.5rem',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '1.5rem'
          }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{ padding: '0.65rem 1.5rem' }}
              disabled={isSaving}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.65rem 2rem', fontWeight: 'bold' }}
              disabled={isSaving}
            >
              {isSaving ? 'שומר שינויים...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileView;
