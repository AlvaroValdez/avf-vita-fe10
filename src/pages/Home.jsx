import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';

// URLs de los assets para los botones de las tiendas
const googlePlayUrl = 'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png';
const appStoreUrl = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

const Home = () => {
  return (
    <>
      {/* --- SECCIÓN HERO CON IMAGEN DE FONDO Y OVERLAY CORRECTOS --- */}
      <div 
        style={{
          // Imagen de fondo (puedes cambiar la URL si deseas)
          backgroundImage: 'url("https://images.unsplash.com/photo-1544717305-ad2d0115064e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '450px', // Altura mínima de la sección
          display: 'flex',
          alignItems: 'center',
          position: 'relative', // Necesario para el overlay
          color: 'white' // Texto blanco por defecto
        }}
      >
        {/* Overlay oscuro para legibilidad */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Overlay oscuro
          }}
        ></div>

        {/* Contenido sobre la imagen y el overlay */}
        <Container className="py-5 position-relative" style={{ zIndex: 1 }}>
          <Row>
            {/* Columna Izquierda: Texto y Botones */}
            <Col lg={7} className="pe-lg-5">
              <h1 className="display-4 fw-bold mb-4">
                Envía dinero totalmente Online con <span style={{ color: 'var(--avf-secondary)' }}>AVF Remesas</span>
              </h1>
              <p className="lead mb-5">
                Desde nuestra web, envía dinero 100% online con la seguridad y respaldo de Vita Wallet.
              </p>
              <div className="mb-5">
                <h5 className="text-white">Descarga nuestra App</h5>
                <div className="d-flex align-items-center mt-3">
                  <a href="#" className="me-3"><Image src={googlePlayUrl} alt="Google Play" style={{ height: '45px' }} /></a>
                  <a href="#"><Image src={appStoreUrl} alt="App Store" style={{ height: '45px' }} /></a>
                </div>
              </div>
            </Col>
            {/* El formulario ya NO está en esta sección */}
          </Row>
        </Container>
      </div>

      {/* --- SECCIÓN SEPARADA PARA EL FORMULARIO DE REMESAS --- */}
      <Container className="my-5">
        <Row className="justify-content-center">
            {/* El formulario se renderiza aquí */}
            <Col lg={6}>
              <RemittanceSteps />
            </Col>
        </Row>
      </Container>

      {/* --- SECCIÓN INFERIOR PLACEHOLDER (sin cambios) --- */}
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <div className="p-4 bg-light border rounded mb-4"><h4>Tu Wallet</h4><p>...</p></div>
            <div className="p-4 bg-light border rounded"><h4>Realizar envío</h4><p>...</p></div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home;