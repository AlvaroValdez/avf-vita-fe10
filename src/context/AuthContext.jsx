import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, apiClient } from '../services/api';
import { clearPushToken } from '../hooks/usePushNotifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    // --- LOGGING DETALLADO ---
    console.log('[AuthContext] useEffect ejecutado. Token actual:', token);
    if (token) {
      // Verifica que el token tenga el formato JWT esperado (tres partes separadas por puntos)
      if (typeof token === 'string' && token.split('.').length === 3) {
        console.log('[AuthContext] Token válido detectado, estableciendo cabecera Authorization.');
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token); // Guarda solo si es válido
      } else {
        console.error('[AuthContext] ¡ERROR! Token inválido o malformado detectado en estado:', token);
        // Opcional: Limpiar token inválido
        // logout();
      }
    } else {
      console.log('[AuthContext] No hay token, eliminando cabecera Authorization.');
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      if (response.ok) {
        // --- LOGGING DETALLADO ---
        console.log('[AuthContext] Login exitoso. Token recibido:', response.token);
        console.log('[AuthContext] Datos de usuario recibidos:', response.user);

        const userData = response.user;
        localStorage.setItem('token', response.token); // Guarda ANTES de actualizar estado
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setToken(response.token); // Actualiza estado DESPUÉS de guardar
        return true;
      }
      throw new Error(response.error || 'Login failed.');
    } catch (error) {
      console.error("Login process failed:", error);
      throw error;
    }
  };

  // --- NUEVA FUNCIÓN PARA ACTUALIZAR SESIÓN SIN RELOGIN ---
  const updateUserSession = (userData) => {
    setUser(userData); // Actualiza estado en memoria
    // Actualiza localStorage para persistencia
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    clearPushToken().catch(() => { }); // 🔔 Eliminar token FCM al salir
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = { token, user, login, logout, updateUserSession };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};