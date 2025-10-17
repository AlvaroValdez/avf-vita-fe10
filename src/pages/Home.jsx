import React from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';

// URLs de los assets para los botones de las tiendas
const googlePlayUrl = 'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png';
const appStoreUrl = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

const Home = () => {
  return (
    <Container className="my-5">
      <Row className="align-items-center">
        {/* --- Columna Izquierda: Título y Descarga de App --- */}
        <Col lg={6}>
          <h1 className="display-4 fw-bold" style={{ color: 'var(--avf-primary)' }}>
            Envía dinero totalmente Online con <span style={{ color: 'var(--avf-secondary)' }}>AVF Remesas</span>
          </h1>
          <p className="lead my-4">
            Desde nuestra web, envía dinero 100% online.
          </p>

          {/* --- NUEVA SECCIÓN: DESCARGA DE APP --- */}
          <div className="mt-5">
            <h5 style={{ color: 'var(--avf-primary)' }}>Descarga nuestra App</h5>
            <div className="d-flex align-items-center mt-3">
              <a href="#" className="me-3">
                <Image src={googlePlayUrl} alt="Descargar en Google Play" style={{ height: '50px' }} />
              </a>
              <a href="#">
                <Image src={appStoreUrl} alt="Descargar en App Store" style={{ height: '50px' }} />
              </a>
            </div>
          </div>
        </Col>

        {/* --- Columna Derecha: Formulario de Cotización --- */}
        <Col lg={6}>
          <RemittanceSteps />
        </Col>
      </Row>
    </Container>
  );
};

export default Home;