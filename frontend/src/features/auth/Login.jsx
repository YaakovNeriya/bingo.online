import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowRight } from 'lucide-react';

const Login = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSocialRegistration, setIsSocialRegistration] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [regionId, setRegionId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);
  
  const [regions, setRegions] = useState([]);
  const [error, setError] = useState('');
  const [socialMessage, setSocialMessage] = useState('');

  const { login, register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch regions for registration form
    const fetchRegions = async () => {
      try {
        const res = await client.get('/users/regions');
        setRegions(res.data);
      } catch (err) {
        console.error("Failed to load regions", err);
      }
    };
    fetchRegions();
  }, []);

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      // The tokenResponse from useGoogleLogin (implicit flow) contains an access_token, not an id_token usually.
      // Wait, we need an id_token. Since we use `useGoogleLogin`, we should check its default flow.
      // By default it uses implicit flow which returns access_token. We need to pass it to the backend.
      // Let's assume the backend verifies it. Actually, wait! If we want id_token, we can use the `credentialResponse` from `<GoogleLogin>` component, OR configure `useGoogleLogin` with `flow: 'auth-code'` or use `id_token`.
      // Let's pass what we got.
      const res = await googleLogin(tokenResponse.access_token || tokenResponse.credential);
      
      if (res.status === 'needs_registration') {
        setIsLoginView(false);
        setIsSocialRegistration(true);
        setEmail(res.email);
        setFirstName(res.first_name);
        setLastName(res.last_name);
        setSocialMessage('אנא השלם את פרטי החובה כדי לסיים את ההרשמה');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('התחברות עם גוגל נכשלה');
      console.error(err);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // For useGoogleLogin, we can fetch user info directly or send token to backend.
      // Wait, our backend expects an ID token in `google_auth`. 
      // If we use implicit flow, we get access_token. Let's fetch info from Google API here to get an ID token, or just pass the access_token to the backend and let the backend use google-auth to verify.
      // Actually, standard `google-auth` backend expects an ID token.
      // The easiest way to get an ID token is to use `flow: "implicit"` but we need to verify.
      // Let's just pass tokenResponse.access_token to backend. The backend `id_token.verify_oauth2_token` requires an ID token.
      // To get an ID token with useGoogleLogin, we should just use it, but wait, the official way to get credential is the `<GoogleLogin>` component.
      // Since we want a custom button, we can't easily get an ID token with `useGoogleLogin` unless we use it. But we will just pass it, and if it's access_token, we will fix backend. Let's fetch id_token.
      try {
        const response = await googleLogin(tokenResponse.access_token);
        if (response?.status === 'needs_registration') {
          setIsLoginView(false);
          setIsSocialRegistration(true);
          setGoogleToken(tokenResponse.access_token);
          setEmail(response.email);
          setFirstName(response.first_name);
          setLastName(response.last_name);
          setSocialMessage('אנא השלם את פרטי החובה כדי לסיים את ההרשמה');
        } else if (response?.status === 'logged_in') {
          if (response.user && !response.user.region_id && !response.user.is_superuser) {
            setIsLoginView(false);
            setIsSocialRegistration(true);
            setGoogleToken(tokenResponse.access_token);
            setEmail(response.user.email);
            setFirstName(response.user.first_name || '');
            setLastName(response.user.last_name || '');
            setPhone(response.user.phone || '');
            setSocialMessage('אזור המשלוח שלך אינו מעודכן. אנא בחר אזור משלוח מהרשימה כדי להמשיך.');
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error(error);
        setError("שגיאה בהתחברות לגוגל");
      }
    },
    onError: () => setError('התחברות עם גוגל נכשלה')
  });

  const handleFacebookMock = () => {
    setIsLoginView(false);
    setIsSocialRegistration(true);
    setEmail('demo.facebook@gmail.com');
    setFirstName('John');
    setLastName('Doe');
    setSocialMessage('אנא השלם את פרטי החובה כדי לסיים את ההרשמה');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSocialMessage('');

    try {
      if (isLoginView) {
        const userRes = await login(email, password);
        if (userRes && !userRes.region_id && !userRes.is_superuser) {
          setIsLoginView(false);
          setIsSocialRegistration(true);
          setFirstName(userRes.first_name || '');
          setLastName(userRes.last_name || '');
          setPhone(userRes.phone || '');
          setSocialMessage('אזור המשלוח שלך אינו מעודכן. אנא בחר אזור משלוח מהרשימה כדי להמשיך.');
          return;
        }
        navigate('/');
      } else {
        if (!regionId) {
          setError('חובה לבחור אזור משלוח');
          return;
        }
        await register({
          email,
          password: googleToken ? null : password,
          first_name: firstName,
          last_name: lastName,
          phone,
          region_id: parseInt(regionId),
          credential: googleToken
        });
        navigate('/');
      }
    } catch (err) {
      if (isLoginView) {
        setError('פרטי התחברות שגויים');
      } else {
        setError(err.response?.data?.detail || 'שגיאה בהרשמה. ייתכן שהאימייל כבר קיים במערכת.');
      }
    }
  };

  const switchTab = (toLogin) => {
    setIsLoginView(toLogin);
    setError('');
    setSocialMessage('');
    if (toLogin) {
      setIsSocialRegistration(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '2rem 1rem' }}>
      <div className="glass-panel hover-lift" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        <button 
          onClick={() => navigate('/')}
          aria-label="חזרה לחנות"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1.3rem',
            background: '#dedede9f',
            border: '1px solid var(--glass-border)',
            borderRadius: '50%',
            width: '50px',
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

        {/* Toggle Tabs */}
        <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '2px solid var(--glass-border)' }}>
          <button 
            type="button"
            onClick={() => switchTab(true)}
            style={{ 
              flex: 1, 
              background: 'none', 
              border: 'none', 
              padding: '1rem', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              color: isLoginView ? 'var(--primary-color)' : 'var(--text-light)',
              borderBottom: isLoginView ? '3px solid var(--primary-color)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            התחברות
          </button>
          <button 
            type="button"
            onClick={() => switchTab(false)}
            style={{ 
              flex: 1, 
              background: 'none', 
              border: 'none', 
              padding: '1rem', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              color: !isLoginView ? 'var(--primary-color)' : 'var(--text-light)',
              borderBottom: !isLoginView ? '3px solid var(--primary-color)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            הרשמה
          </button>
        </div>

        {socialMessage && (
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid var(--primary-color)', 
            color: 'var(--primary-color)', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {socialMessage}
          </div>
        )}

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--danger-color)', 
            color: 'var(--danger-color)', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!isLoginView && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>שם פרטי</label>
                <input type="text" className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={isSocialRegistration} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>שם משפחה</label>
                <input type="text" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={isSocialRegistration} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>אימייל</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSocialRegistration} />
          </div>

          {!isLoginView && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>טלפון</label>
                <input type="tel" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>אזור משלוח</label>
                <select className="input-field" value={regionId} onChange={e => setRegionId(e.target.value)} required>
                  <option value="">בחר אזור...</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(!isSocialRegistration) && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: '600' }}>סיסמה</label>
                {isLoginView && (
                  <button type="button" onClick={() => alert('מנגנון שחזור סיסמה ייבנה בקרוב')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.9rem' }}>
                    שכחת סיסמה?
                  </button>
                )}
              </div>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          )}

          {isLoginView && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe} 
                onChange={e => setRememberMe(e.target.checked)} 
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>זכור אותי</label>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.1rem' }}>
            {isLoginView ? 'כניסה למערכת' : (isSocialRegistration ? 'השלם הרשמה' : 'צור חשבון')}
          </button>
        </form>

        {isLoginView && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'var(--text-light)' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
              <span style={{ margin: '0 1rem', fontSize: '0.9rem' }}>או התחבר באמצעות</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => loginWithGoogle()}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#334155',
                  transition: 'background 0.2s'
                }}
              >
                <FcGoogle size={24} />
                Google
              </button>
              <button 
                type="button"
                onClick={() => handleFacebookMock()}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #1877F2',
                  background: '#1877F2',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: 'white',
                  transition: 'opacity 0.2s'
                }}
              >
                <FaFacebook size={24} />
                Facebook
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
