import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas
import Home from './pages/Home.jsx';
import Transactions from './pages/Transactions.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import AdminMarkup from './pages/AdminMarkup.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminKyc from './pages/AdminKyc.jsx'; // Asumiendo que creamos esto
import AdminRules from './pages/AdminRules.jsx'; // Asumiendo que creamos esto
import VerifyEmail from './pages/VerifyEmail.jsx';
import Profile from './pages/Profile.jsx';
import Favorites from './pages/Favorites.jsx'; // <-- ESTA ES LA LÍNEA QUE FALTABA

// Componentes
import AppNavbar from './components/ui/Navbar.jsx';
import Footer from './components/ui/Footer.jsx';

// Wrapper para Rutas Protegidas de Usuario
const ProtectedRouteWrapper = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// Wrapper para Rutas Protegidas de Administrador
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
          <Route path="/register" element={<Register />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Rutas Protegidas (Usuario) */}
          <Route element={<ProtectedRouteWrapper />}>
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<Transactions />} /> {/* Detalle (reutiliza componente o crea uno nuevo) */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} /> {/* Ruta de Favoritos */}
          </Route>

          {/* Rutas Protegidas (Admin) */}
          <Route element={<AdminRouteWrapper />}>
            <Route path="/admin/markup" element={<AdminMarkup />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/kyc" element={<AdminKyc />} />
            <Route path="/admin/rules" element={<AdminRules />} />
          </Route>
        </Routes>
      </main>
      <Footer />
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