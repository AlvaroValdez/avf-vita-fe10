import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importación de las páginas
import Home from './pages/Home.jsx';
import Transactions from './pages/Transactions.jsx';
//import Login from './pages/Login.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';

// Importación de componentes de la interfaz
import AppNavbar from './components/ui/Navbar.jsx';

/**
 * Componente de orden superior para proteger rutas.
 * Si el usuario no está autenticado (no hay token), lo redirige a la página de login.
 * Si está autenticado, renderiza la ruta solicitada.
 */
const ProtectedRoute = () => {
  const { token } = useAuth();
  // <Outlet /> es un marcador de posición para los componentes hijos de la ruta
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * Componente que contiene el layout principal y la lógica de enrutamiento.
 * Se separa para que pueda acceder al contexto de autenticación.
 */
function AppContent() {
  return (
    <>
      <AppNavbar />
      <main>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          {/*<Route path="/login" element={<Login />} />*/}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          
          {/* Contenedor de Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/transactions" element={<Transactions />} />
            {/* Aquí se podrían añadir más rutas protegidas en el futuro, como /admin */}
          </Route>

        </Routes>
      </main>
    </>
  );
}

/**
 * Componente raíz de la aplicación.
 * Su única responsabilidad es proveer los contextos globales.
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;