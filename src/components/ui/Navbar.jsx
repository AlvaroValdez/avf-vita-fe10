import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

import logo from '../../assets/images/logo.png';
import logoWhite from '../../assets/images/logo-white.png';

const AppNavbar = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Estilos condicionales según autenticación
  const isLogged = !!token;
  const navbarBg = isLogged ? 'primary' : 'white';
  const logoSrc = isLogged ? logoWhite : logo;
  const navbarVariant = isLogged ? 'dark' : 'light';

  return (
    <Navbar bg={navbarBg} variant={navbarVariant} expand="false" className={`shadow-sm py-2 fixed-top ${isLogged ? 'text-white' : ''}`}>
      <Container className="px-3" fluid="xl">
        {/* IZQUIERDA: LOGO */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-auto p-0 m-0">
          <img src={logoSrc} alt="Alyto" style={{ height: '35px', objectFit: 'contain' }} />
        </Navbar.Brand>

        {/* DERECHA: Íconos y menú */}
        <div className="d-flex align-items-center gap-3">

          {/* Si está logueado, mostrar íconos adicionales a la derecha */}
          {isLogged && (
            <>
              {/* 👁️ Ocultar Saldos (Visual / Placeholder por ahora) */}
              <i className="bi bi-eye text-white fs-5" style={{ cursor: 'pointer' }}></i>

              {/* 🔔 Campana de Notificaciones */}
              <NotificationBell color="white" />
            </>
          )}

          {/* 🍔 Menú Hamburguesa */}
          {!isLogged ? (
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 px-1" />
          ) : (
            <Navbar.Toggle aria-controls="logged-navbar-nav" className="border-0 px-1 text-white shadow-none" >
              <i className="bi bi-list fs-2 text-white"></i>
            </Navbar.Toggle>
          )}
        </div>

        {/* CONTENIDO DEL MENÚ DESPLEGABLE */}
        {/* 1. Menú para GUESTS */}
        {!isLogged && (
          <Navbar.Collapse id="basic-navbar-nav" className="pt-3">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className="mb-2">Iniciar Sesión</Nav.Link>
              <Nav.Link as={Link} to="/register" className="mb-2">Registrarse</Nav.Link>
              <Button as={Link} to="/" variant="primary" className="fw-bold mt-2">
                Cotizar Envíos
              </Button>
            </Nav>
          </Navbar.Collapse>
        )}

        {/* 2. Menú para USUARIOS LOGUEADOS (Hamburguesa) */}
        {isLogged && (
          <Navbar.Collapse id="logged-navbar-nav" className="pt-3">
            <Nav className="ms-auto text-end bg-primary pb-3 border-top border-light mt-2 pt-2">
              <div className="text-white-50 small mb-2 text-uppercase">Opciones de {user?.name}</div>

              {/* Solo se muestran accesos que no están en el bottom bar u opciones avanzadas */}
              <Nav.Link as={Link} to="/profile" className="text-white py-2">
                <i className="bi bi-person me-2"></i> Mi Perfil
              </Nav.Link>
              <Nav.Link as={Link} to="/favorites" className="text-white py-2">
                <i className="bi bi-star me-2"></i> Mis Contactos
              </Nav.Link>

              {/* Admin Links */}
              {user?.role === 'admin' && (
                <>
                  <hr className="text-white-50 my-2" />
                  <div className="text-white-50 small mb-2 text-uppercase d-flex justify-content-end align-items-center">
                    Módulo Admin <i className="bi bi-shield-lock ms-2"></i>
                  </div>
                  <Nav.Link as={Link} to="/admin/treasury" className="text-white py-2">Tesorería</Nav.Link>
                  <Nav.Link as={Link} to="/admin/rules" className="text-white py-2">Reglas</Nav.Link>
                  <Nav.Link as={Link} to="/admin/markup" className="text-white py-2">Márgenes</Nav.Link>
                  <Nav.Link as={Link} to="/admin/users" className="text-white py-2">Usuarios</Nav.Link>
                  <Nav.Link as={Link} to="/admin/kyc" className="text-warning fw-bold py-2">Revisar KYC</Nav.Link>
                </>
              )}

              <hr className="text-white-50 my-2" />
              <Nav.Link onClick={handleLogout} className="text-danger fw-bold py-2">
                <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        )}

      </Container>
    </Navbar>
  );
};

export default AppNavbar;
