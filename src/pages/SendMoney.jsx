import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';

const SendMoney = () => {
    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4">Enviar Dinero</h2>
            <Row className="justify-content-center">
                <Col lg={8}>
                    <RemittanceSteps />
                </Col>
            </Row>
        </Container>
    );
};

export default SendMoney;
