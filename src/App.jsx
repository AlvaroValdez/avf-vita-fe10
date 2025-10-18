import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas
import Home from './pages/Home.jsx';
import Transactions from './pages/Transactions.jsx';
import Login from './pages/Login.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import AdminMarkup from './pages/AdminMarkup.jsx';

// Componentes
import AppNavbar from './components/ui/Navbar.jsx';
import Footer from './components/ui/Footer.jsx'; // <-- LA IMPORTACIÓN QUE FALTABA
import AdminRoute from './components/auth/AdminRoute.jsx'; // Asumiendo que existe
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'; // Asumiendo que existe

// Componente para proteger rutas de usuario
const ProtectedRouteWrapper = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// Componente para proteger rutas de admin
const AdminRouteWrapper = () => {
    const { user, token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/" replace />;
    return <Outlet />;
};


function AppContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppNavbar />
      <main className="flex-grow-1">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* Rutas Protegidas (Usuario) */}
          <Route element={<ProtectedRouteWrapper />}>
            <Route path="/transactions" element={<Transactions />} />
          </Route>

          {/* Rutas Protegidas (Admin) */}
          <Route element={<AdminRouteWrapper />}>
            <Route path="/admin/markup" element={<AdminMarkup />} />
          </Route>
        </Routes>
      </main>
      <Footer /> {/* Esta línea necesita la importación para funcionar */}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;