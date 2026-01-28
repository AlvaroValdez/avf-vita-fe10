import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import SessionWarningModal from './components/SessionWarningModal';

// Páginas
import Home from './pages/Home.jsx';
import Transactions from './pages/Transactions.jsx';
import TransactionDetail from './pages/TransactionDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import AdminMarkup from './pages/AdminMarkup.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminKyc from './pages/AdminKyc.jsx';
import AdminRules from './pages/AdminRules.jsx';
import AdminTreasury from './pages/AdminTreasury.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import Profile from './pages/Profile.jsx';
import Favorites from './pages/Favorites.jsx';
import DirectPaymentPage from './pages/DirectPaymentPage.jsx';
import SendMoney from './pages/SendMoney.jsx';

// Componentes UI
// Componentes UI
import Toaster from './components/ui/Toaster.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

const ProtectedRouteWrapper = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRouteWrapper = () => {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
};

function AppContent() {
  const { token } = useAuth();

  // Hook de inactividad - solo activo si hay sesión
  const { showWarning, timeRemaining, extendSession, handleLogout } = useInactivityTimeout();

  return (
    <MainLayout>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-success/:orderId" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled/:orderId" element={<PaymentSuccess />} /> {/* Handle cancel redirect */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Rutas Protegidas (Usuario) */}
        <Route element={<ProtectedRouteWrapper />}>
          <Route path="/send" element={<SendMoney />} /> {/* ✅ NUEVO: Ruta para enviar dinero */}
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/direct-payment/:orderId" element={<DirectPaymentPage />} />
        </Route>

        {/* Rutas Protegidas (Admin) */}
        <Route element={<AdminRouteWrapper />}>
          <Route path="/admin/markup" element={<AdminMarkup />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/kyc" element={<AdminKyc />} />
          <Route path="/admin/rules" element={<AdminRules />} />
          <Route path="/admin/treasury" element={<AdminTreasury />} /> {/* ✅ NUEVO */}
        </Route>

      </Routes>
      <Toaster />

      {/* Modal de advertencia de sesión - solo si hay token */}
      {token && (
        <SessionWarningModal
          show={showWarning}
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
      )}
    </MainLayout>
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
