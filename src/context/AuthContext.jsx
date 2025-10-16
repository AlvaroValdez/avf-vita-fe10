import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, apiClient } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      if (response.ok) {
        setToken(response.token);
        setUser(response.user);
        return true;
      }
      throw new Error(response.error || 'Login failed.');
    } catch (error) {
      console.error("Login process failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = { token, user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};