import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importa el hook

const AppNavbar = () => {
  // Asegúrate de extraer 'user' y 'token' aquí
  const { token, user, logout } = useAuth(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" style={{ color: 'var(--avf-primary)', fontWeight: 'bold', fontSize: '1.5rem' }}>
          AVF Remesas
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto"></Nav> {/* Placeholder para links izquierdos */}
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/" className="me-3">Enviar Dinero</Nav.Link>
            
            {token ? (
              <> {/* Usuario logueado */}
                <Nav.Link as={Link} to="/transactions" className="me-3">Mis Transacciones</Nav.Link>
                <Nav.Link as={Link} to="/profile" className="me-3 fw-bold" style={{ color: 'var(--avf-secondary)' }}>Mi Perfil</Nav.Link>
                {/* Mostramos link a Admin si es admin */}
                {user?.role === 'admin' && ( // Verifica el rol usando 'user'
                   <>
                     <Nav.Link as={Link} to="/admin/markup" className="me-3">Admin Markup</Nav.Link> 
                     <Nav.Link as={Link} to="/admin/users" className="me-3">Admin Usuarios</Nav.Link> 
                   </>
                )}
                <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <> {/* Usuario NO logueado */}
                <Nav.Link as={Link} to="/login" className="me-3">Iniciar Sesión</Nav.Link>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="success" 
                  size="sm"
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
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