import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';

const Home = () => {
  return (
    <Container className="my-5">
      <Row className="align-items-center">
        <Col lg={6}>
          <h1 className="display-4 fw-bold" style={{ color: 'var(--avf-primary)' }}>
            Envía dinero totalmente Online con <span style={{ color: 'var(--avf-secondary)' }}>AVF Remesas</span>
          </h1>
          <p className="lead my-4">
            Desde nuestra web, envía dinero 100% online con la seguridad y respaldo de Vita Wallet.
          </p>
        </Col>
        <Col lg={6}>
          <RemittanceSteps />
        </Col>
      </Row>
    </Container>
  );
};

export default Home;