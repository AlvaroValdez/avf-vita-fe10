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
    // Estilo similar al de Afex: fondo blanco, sombra ligera
    <Navbar bg="white" expand="lg" className="mb-4 shadow-sm py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ color: 'var(--avf-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>
          Alyto
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Links principales a la izquierda (futuro) */}
          <Nav className="me-auto">
            {/* Aquí podríamos añadir links como "Servicios", "Empresa", etc. */}
          </Nav>
          
          {/* Links y botones a la derecha */}
          <Nav className="ms-auto align-items-center">
            {/* Siempre visible */}
            <Nav.Link as={Link} to="/" className="me-3">Enviar Dinero</Nav.Link>
            
            {token ? (
              // Si el usuario está logueado
              <>
                <Nav.Link as={Link} to="/transactions" className="me-3">Mis Transacciones</Nav.Link>
                {/* Podríamos añadir un link al perfil o admin si es admin */}
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={handleLogout} 
                >
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              // Si el usuario NO está logueado (Diseño Afex)
              <>
                <Nav.Link as={Link} to="/login" className="me-3">Iniciar Sesión</Nav.Link>
                <Button 
                  as={Link} 
                  to="/register" // Asumiendo que tendremos una ruta de registro
                  variant="success" 
                  size="sm"
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }} // Verde similar a Afex
                >
                  Crear Cuenta
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;