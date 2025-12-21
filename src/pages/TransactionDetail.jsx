import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, ListGroup, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getTransactionById, approveDeposit } from '../services/api';
import { formatNumberForDisplay } from '../utils/formatting';

const TransactionDetail = () => {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [approveSuccess, setApproveSuccess] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await getTransactionById(id);
        if (response.ok) {
          setTransaction(response.transaction);
        }
      } catch (err) {
        setError(err.error || 'Error al cargar el detalle.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('¿Aprobar este depósito y enviar a Vita?')) return;

    setApproving(true);
    setApproveError('');
    try {
      const res = await approveDeposit(transaction._id);
      if (res.ok) {
        setApproveSuccess(true);
        // Refresh transaction
        const updated = await getTransactionById(id);
        if (updated.ok) setTransaction(updated.transaction);
      } else {
        setApproveError(res.error || 'Error al aprobar');
      }
    } catch (err) {
      setApproveError(err.message || 'Error al aprobar');
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'succeeded': return <Badge bg="success">Completado</Badge>;
      case 'pending': return <Badge bg="warning" text="dark">Pendiente</Badge>;
      case 'failed': return <Badge bg="danger">Fallido</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Construye el timeline basado en la fecha de creación y los eventos IPN
  const renderTimeline = () => {
    if (!transaction) return null;

    // Evento 1: Solicitud creada (siempre existe)
    const events = [
      {
        title: 'Solicitud Recibida',
        date: new Date(transaction.createdAt),
        status: 'completed',
        description: 'La orden fue creada en nuestro sistema.'
      }
    ];

    // Evento 2: Pago del Usuario (Pay-in)
    // Si el estado ya no es pending inicial o si hay IPNs, asumimos que pagó
    // (Para mayor precisión, deberíamos buscar un IPN específico de 'payment_order.succeeded', pero por ahora simplificamos)
    if (transaction.status !== 'pending' || transaction.ipnEvents?.length > 0) {
      events.push({
        title: 'Pago Recibido',
        date: transaction.ipnEvents?.[0]?.createdAt ? new Date(transaction.ipnEvents[0].createdAt) : new Date(transaction.createdAt), // Aproximación
        status: 'completed',
        description: 'Confirmamos la recepción de tus fondos.'
      });
    } else {
      events.push({
        title: 'Esperando Pago',
        status: 'current',
        description: 'Debes completar el pago para continuar.'
      });
    }

    // Evento 3: Envío al Beneficiario (Payout)
    // Buscamos en los IPNs si hay un evento de éxito o fallo
    const finalEvent = transaction.ipnEvents?.find(e => e.type === 'payment.succeeded' || e.type === 'payment.failed');

    if (finalEvent) {
      events.push({
        title: finalEvent.type === 'payment.succeeded' ? 'Envío Completado' : 'Envío Fallido',
        date: new Date(finalEvent.createdAt),
        status: finalEvent.type === 'payment.succeeded' ? 'completed' : 'error',
        description: finalEvent.type === 'payment.succeeded'
          ? 'El dinero ha sido enviado a la cuenta destino.'
          : 'Hubo un problema con el envío.'
      });
    } else if (transaction.status === 'succeeded') {
      // Fallback por si el estado se actualizó pero no tenemos el IPN a mano
      events.push({ title: 'Envío Completado', status: 'completed', date: new Date(transaction.updatedAt) });
    } else {
      events.push({ title: 'En Proceso de Envío', status: 'waiting', description: 'Estamos procesando el envío internacional.' });
    }

    return (
      <div className="timeline mt-4">
        {events.map((ev, index) => (
          <div key={index} className={`timeline-item ${ev.status}`}>
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <h6 className="fw-bold mb-1">{ev.title}</h6>
              {ev.date && <small className="text-muted d-block mb-1">{ev.date.toLocaleString()}</small>}
              <p className="text-muted small mb-0">{ev.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <Container className="text-center p-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert><Button as={Link} to="/transactions">Volver</Button></Container>;

  return (
    <Container className="my-5">
      {approveSuccess && <Alert variant="success" className="mb-3">Depósito aprobado exitosamente</Alert>}
      {approveError && <Alert variant="danger" className="mb-3">{approveError}</Alert>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Detalle de Transacción</h3>
        <div>
          {transaction?.status === 'pending_verification' && (
            <Button
              variant="success"
              size="sm"
              className="me-2"
              disabled={approving}
              onClick={handleApprove}
            >
              {approving ? <Spinner size="sm" animation="border" /> : 'Aprobar Depósito'}
            </Button>
          )}
          <Button as={Link} to="/transactions" variant="outline-secondary" size="sm">Volver al Historial</Button>
        </div>
      </div>

      <Row>
        {/* Columna Izquierda: Resumen y Datos */}
        <Col lg={7} className="mb-4">
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <span className="text-muted">Orden #{transaction.order}</span>
              {getStatusBadge(transaction.status)}
            </Card.Header>
            <Card.Body>
              <div className="p-3 bg-light rounded mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Monto Enviado:</span>
                  <span className="fw-bold fs-5">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}</span>
                </div>

                {/*Detalles de Comisión */}
                {transaction.feePercent && transaction.feePercent > 0 && (
                  <>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted">Comisión ({transaction.feePercent}%):</span>
                      <span className="text-warning fw-bold">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(transaction.fee || 0)}
                      </span>
                    </div>
                    {transaction.feeOriginAmount > 0 && transaction.currency !== 'CLP' && (
                      <div className="text-end">
                        <small className="text-muted">
                          ({new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2 }).format(transaction.feeOriginAmount)} {transaction.currency})
                        </small>
                      </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                      <span className="text-muted fw-bold">Total Debitado:</span>
                      <span className="fw-bold">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(
                          (transaction.currency === 'CLP' ? transaction.amount : 0) + (transaction.fee || 0)
                        )} CLP
                      </span>
                    </div>
                  </>
                )}
              </div>

              <h6 className="text-primary mb-3">Datos del Beneficiario</h6>
              <ListGroup variant="flush" className="small">
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Nombre:</span>
                  <strong>{transaction.beneficiary_first_name} {transaction.beneficiary_last_name} {transaction.company_name}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Email:</span>
                  <strong>{transaction.beneficiary_email}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>País Destino:</span>
                  <strong>{transaction.country}</strong>
                </ListGroup.Item>

                {/* Monto en moneda destino */}
                {transaction.vitaResponse?.estimated_amount && (
                  <ListGroup.Item className="px-0 d-flex justify-content-between bg-success bg-opacity-10">
                    <span className="text-success fw-bold">Monto Recibido:</span>
                    <strong className="text-success">
                      {new Intl.NumberFormat('es-CL', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(transaction.vitaResponse.estimated_amount)}
                      {' '}
                      {transaction.country === 'CO' ? 'COP' :
                        transaction.country === 'PE' ? 'PEN' :
                          transaction.country === 'AR' ? 'ARS' :
                            transaction.country === 'MX' ? 'MXN' : 'USD'}
                    </strong>
                  </ListGroup.Item>
                )}

                {/*Banco destino */}
                {transaction.withdrawalPayload?.beneficiary_bank_name && (
                  <ListGroup.Item className="px-0 d-flex justify-content-between">
                    <span>Banco:</span>
                    <strong>{transaction.withdrawalPayload.beneficiary_bank_name}</strong>
                  </ListGroup.Item>
                )}

                {transaction.withdrawalPayload?.beneficiary_bank_account && (
                  <ListGroup.Item className="px-0 d-flex justify-content-between">
                    <span>Cuenta:</span>
                    <strong className="font-monospace">{transaction.withdrawalPayload.beneficiary_bank_account}</strong>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Columna Derecha: Timeline de Estados */}
        <Col lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
              <h5 className="mb-0 text-primary">Seguimiento</h5>
            </Card.Header>
            <Card.Body>
              {renderTimeline()}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estilos CSS en línea para el Timeline (puedes moverlo a un archivo CSS) */}
      <style>{`
        .timeline { position: relative; border-left: 2px solid #e9ecef; margin-left: 10px; padding-left: 20px; }
        .timeline-item { position: relative; margin-bottom: 30px; }
        .timeline-item:last-child { margin-bottom: 0; }
        .timeline-marker { 
            position: absolute; top: 0; left: -26px; width: 14px; height: 14px; border-radius: 50%; 
            background: #fff; border: 2px solid #adb5bd; 
        }
        .timeline-item.completed .timeline-marker { background: #28a745; border-color: #28a745; }
        .timeline-item.current .timeline-marker { background: #0d6efd; border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.2); }
        .timeline-item.error .timeline-marker { background: #dc3545; border-color: #dc3545; }
        .timeline-content { padding-bottom: 10px; }
      `}</style>
    </Container>
  );
};

export default TransactionDetail;
