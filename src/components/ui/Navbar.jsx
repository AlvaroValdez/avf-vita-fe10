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
    <Navbar bg={navbarBg} variant={navbarVariant} expand="false" className={`shadow-sm py-3 fixed-top ${isLogged ? 'text-white' : ''}`}>
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
            <Nav className="ms-auto text-end bg-primary pb-4 border-top border-light mt-3 shadow-lg rounded-bottom">

              {/* Cabecera de Perfil en el Menú */}
              <div className="d-flex align-items-center justify-content-end mb-3 pt-4 px-4 bg-dark bg-opacity-10">
                <div className="text-end me-3 pb-3">
                  <div className="text-white fw-bold" style={{ fontSize: '1.15rem' }}>{user?.name}</div>
                  <div className="text-white-50 small">{user?.email}</div>
                </div>
                <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold border border-2 border-white mb-3 shadow" style={{ width: 50, height: 50, fontSize: '1.4rem' }}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>

              {/* Opciones Principales */}
              <div className="px-4 mt-2">
                <Nav.Link as={Link} to="/profile" className="text-white py-2 d-flex justify-content-end align-items-center fs-6">
                  Mi Perfil <i className="bi bi-person-badge ms-3 fs-5"></i>
                </Nav.Link>
                <Nav.Link as={Link} to="/favorites" className="text-white py-2 d-flex justify-content-end align-items-center fs-6">
                  Mis Contactos <i className="bi bi-star ms-3 fs-5"></i>
                </Nav.Link>
                <Nav.Link as={Link} to="/transactions" className="text-white py-2 d-flex justify-content-end align-items-center fs-6">
                  Historial de Envíos <i className="bi bi-card-list ms-3 fs-5"></i>
                </Nav.Link>
              </div>

              {/* Admin Links */}
              {user?.role === 'admin' && (
                <div className="bg-dark bg-opacity-25 mt-3 pt-3 pb-3 px-4 rounded-start ms-4">
                  <div className="text-white-50 small mb-3 text-uppercase fw-bold d-flex justify-content-end align-items-center" style={{ letterSpacing: '1px' }}>
                    Gestión Admin <i className="bi bi-shield-lock-fill ms-2"></i>
                  </div>
                  <Nav.Link as={Link} to="/admin/treasury" className="text-white py-2 d-flex justify-content-end align-items-center">Tesorería <i className="bi bi-safe ms-3"></i></Nav.Link>
                  <Nav.Link as={Link} to="/admin/rules" className="text-white py-2 d-flex justify-content-end align-items-center">Reglas <i className="bi bi-sliders ms-3"></i></Nav.Link>
                  <Nav.Link as={Link} to="/admin/markup" className="text-white py-2 d-flex justify-content-end align-items-center">Márgenes <i className="bi bi-percent ms-3"></i></Nav.Link>
                  <Nav.Link as={Link} to="/admin/users" className="text-white py-2 d-flex justify-content-end align-items-center">Usuarios <i className="bi bi-people ms-3"></i></Nav.Link>
                  <Nav.Link as={Link} to="/admin/kyc" className="text-warning fw-bold py-2 d-flex justify-content-end align-items-center">Revisar KYC <i className="bi bi-person-vcard ms-3"></i></Nav.Link>
                </div>
              )}

              {/* Botón Cerrar Sesión Destacado */}
              <div className="px-4 mt-4 mb-2">
                <Button variant="danger" className="w-100 fw-bold d-flex justify-content-center align-items-center py-2 shadow-sm rounded-pill" onClick={handleLogout}>
                  <i className="bi bi-power me-2 fs-5"></i> Cerrar Sesión de Forma Segura
                </Button>
              </div>

            </Nav>
          </Navbar.Collapse>
        )}

      </Container>
    </Navbar>
  );
};

export default AppNavbar;
