import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';
import homeBackground from '../assets/home-background.jpg';
// URLs de los assets (sin cambios)
const googlePlayUrl = 'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png';
const appStoreUrl = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

const Home = () => {
  return (
    <>
      {/* --- SECCIÓN HERO CON IMAGEN DE FONDO Y FORMULARIO INTEGRADO --- */}
      <div 
        style={{
          backgroundImage: `url(${homeBackground})`,  
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '600px', // Aumentamos un poco la altura para dar espacio
          display: 'flex',
          alignItems: 'center',
          position: 'relative', 
          color: 'white' 
        }}
      >
        {/* Overlay oscuro */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}></div>

        {/* Contenido sobre la imagen y el overlay */}
        <Container className="py-5 position-relative" style={{ zIndex: 1 }}>
          <Row className="align-items-center"> {/* Alineación vertical */}
            
            {/* Columna Izquierda: Texto y Botones */}
            <Col lg={6} className="pe-lg-5"> {/* Ocupa la mitad izquierda */}
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

            {/* --- CORRECCIÓN: Columna Derecha: Formulario de Remesas --- */}
            <Col lg={6}> {/* Ocupa la mitad derecha */}
              <RemittanceSteps /> {/* El formulario ahora está aquí */}
            </Col>

          </Row>
        </Container>
      </div>

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