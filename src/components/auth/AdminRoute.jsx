import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute = () => {
  const { user, token } = useAuth();

  // Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token pero el rol no es 'admin', redirige al home
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Si es admin, permite el acceso
  return <Outlet />;
};

export default AdminRoute;