import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

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

import Favorites from './pages/Favorites.jsx';
import Profile from './pages/Profile.jsx';

import AppNavbar from './components/ui/Navbar.jsx';
import Footer from './components/ui/Footer.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AdminRoute from './components/auth/AdminRoute.jsx';

function ProtectedRouteWrapper() {
  return <ProtectedRoute><Outlet /></ProtectedRoute>;
}

function AdminRouteWrapper() {
  return <AdminRoute><Outlet /></AdminRoute>;
}

function AppContent() {
  return (
    <div className="d-flex flex-column min-vh-100">
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
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/favorites" element={<Favorites />} />
          </Route>

          {/* Rutas Protegidas (Admin) */}
          <Route element={<AdminRouteWrapper />}>
            <Route path="/admin/markup" element={<AdminMarkup />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/kyc" element={<AdminKyc />} />
            <Route path="/admin/rules" element={<AdminRules />} />
            <Route path="/admin/treasury" element={<AdminTreasury />} />
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
