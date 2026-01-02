import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import logo from '../../assets/images/logo.png';

const AppNavbar = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-dark d-flex align-items-center">
          <img src={logo} alt="Alyto" style={{ height: '40px' }} className="me-2" />
          {/* Alyto */}
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">

          {/* Links principales */}
          <Nav className="me-auto">
            {/* Público */}
            {!token && (
              <>
                <Nav.Link as={Link} to="/" className="me-3">Inicio</Nav.Link>
              </>
            )}

            {/* Usuario logueado */}
            {token && (
              <>
                {/* ✅ HABILITADO: acceso al flujo principal */}
                <Nav.Link as={Link} to="/" className="me-3">Cotizar / Enviar</Nav.Link>

                <Nav.Link as={Link} to="/transactions" className="me-3">Transacciones</Nav.Link>
                <Nav.Link as={Link} to="/profile" className="me-3">Perfil</Nav.Link>
                <Nav.Link as={Link} to="/favorites" className="me-3">Favoritos</Nav.Link>
              </>
            )}
          </Nav>

          {/* Área derecha (CTA + Admin + Auth) */}
          <Nav className="align-items-lg-center">
            {token ? (
              <>
                {/* ✅ CTA destacado para enviar (estilo Alyto) */}
                <Button
                  as={Link}
                  to="/"
                  variant="primary"
                  className="me-2 fw-bold text-primary"
                >
                  Enviar ahora
                </Button>

                {/* Admin */}
                {user?.role === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/admin/treasury" className="me-3">Tesorería</Nav.Link>
                    <Nav.Link as={Link} to="/admin/rules" className="me-3">Reglas</Nav.Link>
                    <Nav.Link as={Link} to="/admin/markup" className="me-3">Markup</Nav.Link>
                    <Nav.Link as={Link} to="/admin/users" className="me-3">Usuarios</Nav.Link>
                    <Nav.Link as={Link} to="/admin/kyc" className="me-3 fw-bold text-warning">Revisar KYC</Nav.Link>
                  </>
                )}

                <Button variant="outline-primary" size="sm" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                {/* ✅ CTA público: cotizar lleva al home */}
                <Button
                  as={Link}
                  to="/"
                  variant="primary"
                  className="me-2 fw-bold text-primary"
                >
                  Cotizar
                </Button>

                <Nav.Link as={Link} to="/login" className="me-3">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Registro</Nav.Link>
              </>
            )}
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
