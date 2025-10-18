import React from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';

// URLs de los assets para los botones de las tiendas
const googlePlayUrl = 'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png';
const appStoreUrl = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

const Home = () => {
  return (
    <>
      {/* --- SECCIÓN PRINCIPAL CON IMAGEN DE FONDO --- */}
      <div 
        style={{
          backgroundImage: "url('assets/home-background.jpg')", 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: '600px', // Ajusta esta altura según prefieras
          display: 'flex',
          alignItems: 'center',
          position: 'relative', // Necesario para el overlay
        }}
      >
        {/* Overlay para oscurecer la imagen y mejorar la legibilidad del texto */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // Ajusta la opacidad (0.4 = 40% oscuro)
          }}
        ></div>

        <Container className="my-5 py-5 position-relative" style={{ zIndex: 1 }}> {/* zIndex para asegurar que el contenido esté sobre el overlay */}
          <Row className="align-items-center">
            {/* Columna Izquierda: Título y Descarga de App */}
            <Col lg={6} className="pe-lg-5 text-white"> {/* Texto blanco para contraste */}
              <h1 className="display-4 fw-bold mb-4">
                Envía dinero totalmente Online con <span style={{ color: 'var(--avf-secondary)' }}>Alyto</span>
              </h1>
              <p className="lead mb-5">
                Envía dinero 100% online con Alyto con la seguridad y respaldo de AV Finance.
              </p>

              <div className="mb-5">
                <h5 className="text-white">Descarga nuestra App</h5> {/* Título de descarga blanco */}
                <div className="d-flex align-items-center mt-3">
                  <a href="#" className="me-3">
                    <Image src={googlePlayUrl} alt="Descargar en Google Play" style={{ height: '45px' }} />
                  </a>
                  <a href="#">
                    <Image src={appStoreUrl} alt="Descargar en App Store" style={{ height: '45px' }} />
                  </a>
                </div>
              </div>

              <div className="d-none d-lg-block" style={{ height: '100px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                Placeholder Gráfico
              </div>
            </Col>

            {/* Columna Derecha: Formulario de Cotización */}
            <Col lg={6}>
              <RemittanceSteps />
            </Col>
          </Row>
        </Container>
      </div>

      {/* --- SECCIÓN INFERIOR (EJ: TU WALLET, REALIZAR ENVÍO, etc.) --- */}
      {/* Puedes añadir más secciones aquí si las tienes, o dejar el espacio para futuras adiciones */}
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col md={8}>
            {/* Aquí puedes poner otras secciones como "Tu Wallet", "Realizar Envío" */}
            <div className="p-4 bg-light border rounded mb-4">
              <h4 className="text-primary">Tu Wallet</h4>
              <p>Conectando con Vita Wallet API... 🔄</p>
            </div>
            <div className="p-4 bg-light border rounded">
              <h4 className="text-primary">Realizar envío</h4>
              <p>Gestiona tus remesas fácilmente.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home;