import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        <Navbar.Brand as={Link} to="/" className="fw-bold text-dark">
          AV Finance
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">

          <Nav className="me-auto">
            {token && (
              <>
                <Nav.Link as={Link} to="/transactions" className="me-3">Transacciones</Nav.Link>
                <Nav.Link as={Link} to="/profile" className="me-3">Perfil</Nav.Link>
              </>
            )}
          </Nav>

          <Nav>
            {token ? (
              <>
                {user?.role === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/admin/markup" className="me-3">Admin Markup</Nav.Link>
                    <Nav.Link as={Link} to="/admin/users" className="me-3">Admin Usuarios</Nav.Link>
                    <Nav.Link as={Link} to="/admin/rules" className="me-3">Reglas</Nav.Link>
                    <Nav.Link as={Link} to="/admin/treasury" className="me-3">Tesorería</Nav.Link>
                    <Nav.Link as={Link} to="/admin/kyc" className="me-3 fw-bold text-warning">Revisar KYC</Nav.Link>
                  </>
                )}

                <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
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
