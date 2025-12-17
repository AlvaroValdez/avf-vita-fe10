import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="mt-auto py-4" style={{ backgroundColor: 'var(--avf-primary)', color: 'white' }}>
      <Container>
        <Row>
          <Col md={6} className="text-center text-md-start">
            <p className="mb-0">&copy; {new Date().getFullYear()} AVF Remesas. Todos los derechos reservados.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <a href="#!" className="text-white me-3 text-decoration-none">Términos y Condiciones</a>
            <a href="#!" className="text-white text-decoration-none">Política de Privacidad</a>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;