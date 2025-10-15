import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, apiClient } from '../services/api'; // Import apiClient to set auth headers

// 1. Create the context
const AuthContext = createContext();

// 2. Create the Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Initialize token from localStorage to persist session across page reloads
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Effect to update the API client's headers whenever the token changes
  useEffect(() => {
    if (token) {
      // Set the Authorization header for all future API requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      // Remove the Authorization header if logged out
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  /**
   * Handles the user login process.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<boolean>} True if login is successful.
   */
  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });
      if (response.ok) {
        setToken(response.token);
        setUser(response.user);
        return true;
      }
      // This line is important for catching login failures in the component
      throw new Error(response.error || 'Login failed due to an unknown error.');
    } catch (error) {
      console.error("Login process failed:", error);
      throw error; // Re-throw the error so the component can display it
    }
  };

  /**
   * Handles the user logout process.
   */
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // The values to be shared with consuming components
  const value = { token, user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for easy access to the AuthContext.
 * @returns {object} The authentication context value.
 */
export const useAuth = () => {
  return useContext(AuthContext);
};