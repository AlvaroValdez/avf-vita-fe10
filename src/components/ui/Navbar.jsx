import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AppNavbar = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ color: 'var(--avf-primary)', fontWeight: 'bold' }}>
          AVF Remesas
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">Enviar Dinero</Nav.Link>
            
            {token ? (
              <>
                <Nav.Link as={Link} to="/transactions">Mis Transacciones</Nav.Link>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="ms-2"
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;