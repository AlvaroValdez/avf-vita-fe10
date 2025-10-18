import React from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';

// URLs de los assets para los botones de las tiendas
const googlePlayUrl = 'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png';
const appStoreUrl = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

const Home = () => {
  return (
    // Añadimos padding vertical más generoso
    <Container className="my-5 py-5">
      <Row className="align-items-center">
        {/* --- Columna Izquierda: Título, Descarga y Placeholder Gráfico --- */}
        <Col lg={6} className="pe-lg-5"> {/* Añadimos padding a la derecha */}
          <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--avf-primary)' }}>
            Envía dinero totalmente Online con <span style={{ color: 'var(--avf-secondary)' }}>AVF Remesas</span>
          </h1>
          <p className="lead mb-5">
            Desde nuestra web, envía dinero 100% online con la seguridad.
          </p>

          {/* Sección Descarga de App (sin cambios) */}
          <div className="mb-5">
            <h5 style={{ color: 'var(--avf-primary)' }}>Descarga nuestra App</h5>
            <div className="d-flex align-items-center mt-3">
              <a href="#" className="me-3">
                <Image src={googlePlayUrl} alt="Descargar en Google Play" style={{ height: '45px' }} />
              </a>
              <a href="#">
                <Image src={appStoreUrl} alt="Descargar en App Store" style={{ height: '45px' }} />
              </a>
            </div>
          </div>

          {/* Placeholder para elementos gráficos (simulando Afex) */}
          <div className="d-none d-lg-block" style={{ height: '100px', backgroundColor: '#e9ecef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>
            Placeholder Gráfico
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