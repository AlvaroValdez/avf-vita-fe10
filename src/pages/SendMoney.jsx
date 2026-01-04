import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import RemittanceSteps from '../components/remittance/RemittanceSteps';
import logo from '../assets/images/logo.png';

const SendMoney = () => {
    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col lg={8}>
                    <div className="text-center mb-4">
                        <Image src={logo} alt="Alyto" fluid style={{ maxHeight: '80px' }} />
                    </div>
                    {/* Title is already inside CardForm? No, CardForm has "Cotizar envío". We can remove "Enviar Dinero" h2 here or keep it.
                User image shows "Enviar Dinero" h2, then Card with Logo (removed) + "Cotizar envío".
                Let's keep h2 or maybe remove it if they want logo ON TOP of card. 
                The user drew a red line ABOVE the card.
            */}
                    <RemittanceSteps />
                </Col>
            </Row>
        </Container>
    );
};

export default SendMoney;
