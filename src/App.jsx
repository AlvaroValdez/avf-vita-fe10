import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Páginas
import Home from './pages/Home.jsx';
import Transactions from './pages/Transactions.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx'; // Asegúrate que esta página exista
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import AdminMarkup from './pages/AdminMarkup.jsx';
import AdminUsers from './pages/AdminUsers.jsx';

// Componentes
import AppNavbar from './components/ui/Navbar.jsx';
import Footer from './components/ui/Footer.jsx';

// Wrapper para Rutas Protegidas de Usuario
const ProtectedRouteWrapper = () => {
  const { token } = useAuth(); // Obtiene solo el token
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// Wrapper para Rutas Protegidas de Administrador (VERIFICADO)
const AdminRouteWrapper = () => {
    const { user, token } = useAuth(); // Obtiene user y token
    if (!token) {
        console.log("AdminRouteWrapper: No token, redirecting to login");
        return <Navigate to="/login" replace />;
    }
    if (user?.role !== 'admin') {
        console.log("AdminRouteWrapper: User is not admin, redirecting to home. User:", user);
        return <Navigate to="/" replace />;
    }
    console.log("AdminRouteWrapper: Access granted. User:", user);
    return <Outlet />; // Permite el acceso
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

          {/* Rutas Protegidas (Usuario) */}
          <Route element={<ProtectedRouteWrapper />}>
            <Route path="/transactions" element={<Transactions />} />
          </Route>

          {/* Rutas Protegidas (Admin) */}
          <Route element={<AdminRouteWrapper />}>
            <Route path="/admin/markup" element={<AdminMarkup />} />
            <Route path="/admin/users" element={<AdminUsers />} />
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