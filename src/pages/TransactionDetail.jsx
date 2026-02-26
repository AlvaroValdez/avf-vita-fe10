import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, ListGroup, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getTransactionById, approveDeposit } from '../services/api';
import { formatNumberForDisplay } from '../utils/formatting';

// Flag imports
import clFlag from '../assets/flags/cl.svg';
import peFlag from '../assets/flags/pe.svg';
import coFlag from '../assets/flags/co.svg';
import arFlag from '../assets/flags/ar.svg';
import mxFlag from '../assets/flags/mx.svg';
import brFlag from '../assets/flags/br.svg';
import usFlag from '../assets/flags/us.svg';
import boFlag from '../assets/flags/bo.svg';

const flagMap = {
  CL: clFlag, PE: peFlag, CO: coFlag, AR: arFlag,
  MX: mxFlag, BR: brFlag, US: usFlag, BO: boFlag,
};

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
              {/* Resumen Superior Estilo Recibo */}
              {(() => {
                // Derive display values from the correct schema fields
                const originCurrency = transaction.amountsTracking?.originCurrency || transaction.currency || 'CLP';
                const destCurrency = transaction.amountsTracking?.destCurrency ||
                  (transaction.country === 'BO' ? 'BOB' :
                    transaction.country === 'PE' ? 'PEN' :
                      transaction.country === 'CO' ? 'COP' :
                        transaction.country === 'AR' ? 'ARS' :
                          transaction.country === 'MX' ? 'MXN' :
                            transaction.country === 'BR' ? 'BRL' : 'USD');

                // The rate: how many origin units is 1 dest unit worth (e.g. 1 BOB = 110.5 CLP)
                const alytoRate = transaction.rateTracking?.alytoRate
                  || transaction.vitaResponse?.exchange_rate
                  || transaction.fxRate;

                // Destination amount: what the beneficiary receives
                const destAmount = transaction.amountsTracking?.destReceiveAmount
                  || transaction.vitaResponse?.estimated_amount;

                return (
                  <div className="p-4 mb-4 bg-white border" style={{ borderRadius: '12px', borderColor: '#e9ecef' }}>
                    {/* Row 1: Total a enviar */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-secondary fw-bold" style={{ fontSize: '0.95rem' }}>Total a enviar:</span>
                      <div className="d-flex align-items-center">
                        <img src={clFlag} alt="CL" style={{ width: '22px', height: '22px', marginRight: '8px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span className="fw-medium text-dark" style={{ fontSize: '1.05rem', letterSpacing: '-0.3px' }}>
                          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(transaction.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Tasa de referencia */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-secondary fw-bold" style={{ fontSize: '0.95rem' }}>Tasa de referencia:</span>
                      <div className="d-flex align-items-center text-muted">
                        <i className="bi bi-stack me-2 small"></i>
                        <span className="small fw-medium text-nowrap" style={{ fontSize: '0.85rem' }}>
                          {alytoRate
                            ? `1 ${destCurrency} = ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 4 }).format(alytoRate)} ${originCurrency}`
                            : '---'}
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Total a recibir */}
                    {destAmount && (
                      <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: '#e9ecef' }}>
                        <span className="fw-bold" style={{ color: '#00A89D', fontSize: '0.95rem' }}>Total a recibir:</span>
                        <div className="d-flex align-items-center">
                          <img
                            src={flagMap[transaction.country] || usFlag}
                            alt={transaction.country}
                            style={{ width: '24px', height: '24px', marginRight: '8px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span className="fw-bold fs-5" style={{ color: '#00A89D', letterSpacing: '-0.3px' }}>
                            {new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(destAmount)} {destCurrency}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Datos del Beneficiario - Clean Layout */}
              <div className="px-1 mt-2">
                {/* Beneficiario: solo mostrar si hay nombre o razón social */}
                {(transaction.beneficiary_first_name || transaction.beneficiary_last_name || transaction.company_name) && (
                  <div className="mb-3">
                    <div className="text-secondary fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Beneficiario:</div>
                    <div className="text-dark fw-medium fs-6">
                      {[transaction.beneficiary_first_name, transaction.beneficiary_last_name, transaction.company_name].filter(Boolean).join(' ')}
                    </div>
                  </div>
                )}

                {/* Email: solo si fue ingresado */}
                {transaction.beneficiary_email && (
                  <div className="mb-3">
                    <div className="text-secondary fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Email:</div>
                    <div className="text-dark fw-medium fs-6">{transaction.beneficiary_email}</div>
                  </div>
                )}

                {transaction.withdrawalPayload?.beneficiary_bank_name && (
                  <div className="mb-3">
                    <div className="text-secondary fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Banco:</div>
                    <div className="text-dark fw-medium fs-6">{transaction.withdrawalPayload.beneficiary_bank_name}</div>
                  </div>
                )}

                {transaction.withdrawalPayload?.beneficiary_bank_account && (
                  <div className="mb-3">
                    <div className="text-secondary fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Nro de cuenta:</div>
                    <div className="text-dark fw-medium fs-6 font-monospace">{transaction.withdrawalPayload.beneficiary_bank_account}</div>
                  </div>
                )}

                {transaction.withdrawalPayload?.account_type && (
                  <div className="mb-3">
                    <div className="text-secondary fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Tipo de cuenta:</div>
                    <div className="text-dark fw-medium fs-6 text-capitalize">
                      {transaction.withdrawalPayload.account_type === 'checking' ? 'Cuenta Corriente' :
                        transaction.withdrawalPayload.account_type === 'savings' ? 'Cuenta de Ahorros' :
                          transaction.withdrawalPayload.account_type}
                    </div>
                  </div>
                )}

                <div className="mb-1 mt-4">
                  <div className="text-secondary fw-bold mb-1" style={{ fontSize: '0.9rem' }}>Transfer ID:</div>
                  <div className="d-flex align-items-center">
                    <div className="text-muted small font-monospace me-2 text-break">{transaction._id}</div>
                    <i
                      className="bi bi-copy text-primary"
                      style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                      title="Copiar ID"
                      onClick={() => {
                        navigator.clipboard.writeText(transaction._id);
                        alert('Transfer ID copiado al portapapeles');
                      }}
                    ></i>
                  </div>
                </div>
              </div>
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

              {/* 📄 Comprobante de Pago */}
              {transaction.proofOfPayment && (
                <div className="mt-4 pt-4 border-top">
                  <h6 className="text-primary mb-3">📄 Comprobante Bancario</h6>
                  <Alert variant="success" className="mb-2">
                    <small>
                      <strong>✅ Pago Completado</strong><br />
                      El administrador confirmó que tu transferencia fue ejecutada exitosamente.
                    </small>
                  </Alert>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    href={transaction.proofOfPayment}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🔍 Ver Comprobante Bancario
                  </Button>
                </div>
              )}
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
