import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { getTransactions } from '../services/api';
import { formatNumberForDisplay } from '../utils/formatting';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { orderId: paramOrderId } = useParams();

  // Support both path param and query param
  // If orderId has a ? inside (due to old malformed URL), we try to clean it just in case, 
  // though the new path-based approach prevents this.
  let rawOrderId = paramOrderId || searchParams.get('orderId');
  if (rawOrderId && rawOrderId.includes('?')) {
    rawOrderId = rawOrderId.split('?')[0];
  }
  const orderId = rawOrderId;

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;

    const fetchTx = async () => {
      try {
        setLoading(true);
        // Search by order ID string
        const res = await getTransactions({ order: orderId });
        if (res?.transactions?.length > 0) {
          setTransaction(res.transactions[0]);
        }
      } catch (e) {
        console.error('Error fetching transaction:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [orderId]);

  const getStatusBadge = (status) => {
    const map = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      rejected: 'danger'
    };
    const variant = map[status] || 'secondary';
    return <Badge bg={variant}>{status}</Badge>;
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="p-4 border-0 shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="text-center">
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
          <h3 style={{ color: 'var(--avf-primary)' }} className="mb-3">¡Pago Recibido!</h3>
          <p className="text-muted mb-4">
            Hemos recibido tu solicitud. Tu envío está en proceso.
          </p>

          {loading ? (
            <Spinner animation="border" variant="primary" />
          ) : transaction ? (
            <div className="bg-light p-3 rounded text-start">
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">ID:</span>
                <span className="fw-bold">{orderId}</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Monto Enviado:</span>
                <span className="fw-bold">
                  $ {formatNumberForDisplay(transaction.amount)} {transaction.currency}
                </span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Beneficiario:</span>
                <span className="fw-bold">
                  {transaction.beneficiary_first_name} {transaction.beneficiary_last_name}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Estado:</span>
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          ) : (
            orderId && (
              <div className="bg-light p-3 rounded mt-4">
                <span className="d-block text-muted">ID de Orden</span>
                <strong style={{ color: 'var(--avf-primary)', fontSize: '1.1rem' }}>{orderId}</strong>
              </div>
            )
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