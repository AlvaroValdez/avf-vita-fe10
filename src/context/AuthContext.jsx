import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, apiClient } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // --- CORRECCIÓN: Lee el usuario y el token desde localStorage al iniciar ---
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

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
        const userWithRole = { ...response.user, role: 'admin' }; // Simulación de rol

        // --- CORRECCIÓN: Guarda el usuario y el token ---
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(userWithRole));
        
        setToken(response.token);
        setUser(userWithRole);
        return true;
      }
      throw new Error(response.error || 'Login failed.');
    } catch (error) {
      console.error("Login process failed:", error);
      throw error;
    }
  };

  const logout = () => {
    // --- CORRECCIÓN: Limpia el usuario y el token ---
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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