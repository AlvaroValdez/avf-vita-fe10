import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useAuth();
  // Si hay token, renderiza el componente hijo (Outlet), si no, redirige al login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;