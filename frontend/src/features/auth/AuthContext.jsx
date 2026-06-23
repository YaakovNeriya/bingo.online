import React, { createContext, useState, useEffect } from 'react';
import client from '../../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await client.get('/users/me');
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const res = await client.post('/users/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    localStorage.setItem('token', res.data.access_token);
    const userRes = await client.get('/users/me');
    setUser(userRes.data);
    setLoading(false);
    return userRes.data;
  };

  const register = async (userData) => {
    // userData contains { email, password, first_name, last_name, phone, region_id, credential }
    await client.post('/users/register', userData);
    
    // Auto login after successful registration
    if (userData.credential) {
      await googleLogin(userData.credential);
    } else {
      await login(userData.email, userData.password);
    }
  };

  const googleLogin = async (credential) => {
    const res = await client.post('/users/auth/google', { credential });
    if (res.data.status === 'needs_registration') {
      return res.data; // Return to Login.jsx to handle registration
    } else {
      localStorage.setItem('token', res.data.access_token);
      const userRes = await client.get('/users/me');
      setUser(userRes.data);
      return { status: 'logged_in', user: userRes.data };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
