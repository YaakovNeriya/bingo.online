import React, { createContext, useState, useEffect, useCallback } from 'react';
import client from '../../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await client.get('/users/me');
      const method = localStorage.getItem('login_method') || 'email';
      setUser({ ...res.data, login_method: method });
    } catch (err) {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    await client.post('/users/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    localStorage.setItem('login_method', 'email');
    const userRes = await client.get('/users/me');
    const userWithMethod = { ...userRes.data, login_method: 'email' };
    setUser(userWithMethod);
    setLoading(false);
    return userWithMethod;
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
      localStorage.setItem('login_method', 'google');
      const userRes = await client.get('/users/me');
      const userWithMethod = { ...userRes.data, login_method: 'google' };
      setUser(userWithMethod);
      return { status: 'logged_in', user: userWithMethod };
    }
  };

  const logout = async () => {
    try {
      await client.post('/users/logout');
    } catch (err) {
      console.error("Logout failed", err);
    }
    localStorage.removeItem('login_method');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout, refreshUser: checkAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
