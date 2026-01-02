
import React from 'react';
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import RemittanceSteps from '../components/remittance/RemittanceSteps';
import { useAuth } from '../context/AuthContext';
import homeBackgroundImage from '../assets/home-background.jpg';

// URLs de los assets
const googlePlayUrl = 'https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png';
const appStoreUrl = 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg';

const Home = () => {
  const { token, user } = useAuth();

  // --- VIEW: LOGGED IN (ALYTO DASHBOARD) ---
  if (token) {
    return (
      <Container className="py-4">
        {/* Header / Greeting */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="text-muted fw-normal mb-0">Hola,</h5>
            <h2 className="fw-bold">{user?.name?.split(' ')[0] || 'Usuario'} 👋</h2>
          </div>
          <div className="position-relative">
            <i className="bi bi-bell fs-4 text-primary"></i>
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </div>
        </div>

        {/* Balance Card (Component 2 - Focal Point) */}
        <div className="card card-balance p-4 mb-4 position-relative overflow-hidden">
          <div className="position-relative z-1">
            <div className="d-flex justify-content-between align-items-start text-white-50">
              <small className="text-uppercase fw-bold letter-spacing-1">Saldo Total</small>
              <i className="bi bi-eye"></i>
            </div>
            <h1 className="display-4 fw-bold mt-2 mb-3">$ 0.00 <small className="fs-6">CLP</small></h1>
            <div className="d-flex gap-2">
              <span className="badge bg-white bg-opacity-25 fw-normal px-3 py-2 rounded-pill border border-white border-opacity-10">
                <i className="bi bi-shield-check me-2"></i>Protegido por Stellar
              </span>
            </div>
          </div>
          {/* Decorative Circle */}
          <div className="position-absolute rounded-circle bg-white opacity-10" style={{ width: 300, height: 300, top: -100, right: -100 }}></div>
        </div>

        {/* Dashboard Content Grid (Desktop) */}
        <Row>
          <Col lg={8}>
            {/* Transactions List (Component 2/3) */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0">Movimientos Recientes</h5>
              <Link to="/transactions" className="text-decoration-none small fw-bold">Ver todos</Link>
            </div>

            <div className="card p-3 mb-4">
              {/* Placeholder de transacciones para demo */}
              <div className="list-group list-group-flush">
                <div className="list-group-item border-0 px-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-send text-danger"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">Envío a Juan Pérez</h6>
                      <small className="text-muted">Hoy, 10:23 AM</small>
                    </div>
                  </div>
                  <div className="text-end">
                    <h6 className="mb-0 fw-bold text-danger">- $50,000 CLP</h6>
                    <small className="badge bg-success-subtle text-success rounded-pill">Completado</small>
                  </div>
                </div>

                <div className="list-group-item border-0 px-0 py-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{ width: 48, height: 48 }}>
                      <i className="bi bi-wallet2 text-success"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">Carga de Saldo</h6>
                      <small className="text-muted">Ayer, 04:15 PM</small>
                    </div>
                  </div>
                  <div className="text-end">
                    <h6 className="mb-0 fw-bold text-success">+ $100,000 CLP</h6>
                    <small className="badge bg-success-subtle text-success rounded-pill">Aprobado</small>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Side Content (Chart Placeholder for Desktop) */}
          <Col lg={4} className="d-none d-lg-block">
            <div className="card p-4 h-100">
              <h5 className="fw-bold mb-4">Estadísticas</h5>
              <div className="d-flex align-items-center justify-content-center flex-grow-1 bg-light rounded" style={{ minHeight: 200 }}>
                <div className="text-center text-muted">
                  <i className="bi bi-pie-chart-fill fs-1 mb-2 d-block"></i>
                  <span>Resumen de gastos</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Floating Action Button for Mobile maybe? Or stick to Top Actions */}
      </Container>
    );
  }

  // --- VIEW: GUEST (LANDING PAGE) ---
  return (
    <>
      {/* ... (Existing Landing Page Code) ... */}
      <div
        style={{
          backgroundImage: `url(${homeBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '600px', // Altura mínima para que quepa todo
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          color: 'white'
        }}
      >
        {/* Overlay oscuro para legibilidad */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 0 }}></div>

        {/* Contenido PRINCIPAL: Texto + Formulario en la misma fila */}
        <Container className="py-5 position-relative" style={{ zIndex: 1 }}>
          <Row className="align-items-center">

            {/* Columna Izquierda: Texto Promocional */}
            <Col lg={6} className="pe-lg-5 mb-5 mb-lg-0">
              <h1 className="display-4 fw-bold mb-4">
                Envía dinero totalmente Online con <span className="text-accent">Alyto</span>
              </h1>
              <p className="lead mb-5 opacity-75">
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

            {/* Columna Derecha: FORMULARIO (Flotando sobre la imagen) */}
            <Col lg={6}>
              <RemittanceSteps />
            </Col>

          </Row>
        </Container>
      </div>

      {/* --- SECCIÓN FEATURES (Optimizada para Alyto) --- */}
      <Container className="my-5">
        <Row className="g-4">
          <Col md={4}>
            <div className="card h-100 p-4 border-0 shadow-sm text-center">
              <i className="bi bi-shield-lock-fill fs-1 text-primary mb-3"></i>
              <h4>Seguro</h4>
              <p className="text-muted">Tu dinero protegido con tecnología blockchain y Vita Wallet.</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="card h-100 p-4 border-0 shadow-sm text-center">
              <i className="bi bi-lightning-fill fs-1 text-accent mb-3"></i>
              <h4>Rápido</h4>
              <p className="text-muted">Envíos instantáneos a múltiples destinos en Latinoamérica.</p>
            </div>
          </Col>
          <Col md={4}>
            <div className="card h-100 p-4 border-0 shadow-sm text-center">
              <i className="bi bi-phone-fill fs-1 text-primary mb-3"></i>
              <h4>Fácil</h4>
              <p className="text-muted">Interfaz intuitiva diseñada para tu comodidad desde cualquier dispositivo.</p>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Home;