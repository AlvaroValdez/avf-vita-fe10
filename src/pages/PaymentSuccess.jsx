import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  // Hook para leer los parámetros de la URL, como ?orderId=ORD-123
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <Container className="d-flex justify-content-center align-items-center text-center" style={{ minHeight: '80vh' }}>
      <Card className="p-4 border-0 shadow-sm" style={{ maxWidth: '500px' }}>
        <Card.Body>
          <div 
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              backgroundColor: '#28a745', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto', fontSize: '40px'
            }}
          >
            ✓
          </div>
          <h3 style={{ color: 'var(--avf-primary)' }}>¡Pago Recibido!</h3>
          <p className="text-muted">
            Hemos recibido la confirmación de tu pago. Tu envío ya está en proceso.
          </p>
          
          {orderId && (
            <div className="bg-light p-3 rounded mt-4">
              <span className="d-block text-muted">ID de Orden</span>
              <strong style={{ color: 'var(--avf-primary)', fontSize: '1.1rem' }}>{orderId}</strong>
            </div>
          )}

          <div className="d-grid mt-4">
            <Button 
              as={Link} 
              to="/transactions"
              style={{ backgroundColor: 'var(--avf-primary)', borderColor: 'var(--avf-primary)' }}
            >
              Ver Mis Transacciones
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentSuccess;