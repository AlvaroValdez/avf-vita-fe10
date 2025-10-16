import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { createWithdrawal } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const StepConfirm = ({ formData, fields, onBack }) => {
  const { quoteData, beneficiary, destCountry } = formData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);

  // --- NEW TIMER LOGIC ---
  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!quoteTimestamp) return;

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - quoteTimestamp;
      const timeLeft = QUOTE_VALIDITY_DURATION - elapsedTime;

      if (timeLeft <= 0) {
        clearInterval(interval);
        setRemainingTime(0);
        setIsExpired(true); // Mark the quote as expired
      } else {
        setRemainingTime(timeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quoteTimestamp]);

  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // --- FUNCIONES DE AYUDA PARA OBTENER NOMBRES Y VALORES LEGIBLES ---
  const getFieldDetails = (key) => fields.find(f => f.key === key);

  const getDisplayValue = (key) => {
    const value = beneficiary[key];
    const field = getFieldDetails(key);
    if (field?.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      return option ? option.label : value;
    }
    return value;
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Paso A: Crear el Withdrawal
      const withdrawalResult = await createWithdrawal({
        country: destCountry,
        currency: quoteData.origin,
        amount: quoteData.amountIn,
        ...beneficiary,
      });

      // Paso B: Crear la Orden de Pago
      if (withdrawalResult.ok) {
        const paymentOrderResult = await createPaymentOrder({
          amount: quoteData.amountIn,
          country: 'CL',
          orderId: withdrawalResult.data.order,
        });

        // Paso C: Redirigir al usuario
        if (paymentOrderResult.ok) {
          window.location.href = paymentOrderResult.data.data.payment_url;
        } else {
          throw new Error('No se pudo generar el link de pago.');
        }
      } else {
        throw new Error('No se pudo crear la transacción inicial.');
      }
    } catch (err) {
      const errorDetails = err.details ? JSON.stringify(err.details) : (err.error || err.message);
      setError(`Error al procesar el envío: ${errorDetails}`);
      setLoading(false);
    }
  };

  if (transactionResult) {
    const txId = transactionResult.id || transactionResult.uuid || transactionResult.transaction?.id || 'N/A';

    return (
      <Card className="p-4 text-center border-0 shadow-sm">
        <Card.Body>
          {/* Icono de éxito */}
          <div 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: '#28a745', // Un verde éxito estándar
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '40px'
            }}
          >
            ✓
          </div>

          <h3 style={{ color: 'var(--avf-primary)' }}>¡Envío Realizado con Éxito!</h3>
          <p className="text-muted">Tu envío ha sido procesado y está en camino.</p>
          
          <div className="bg-light p-3 rounded mt-4">
            <span className="d-block text-muted">ID de Transacción</span>
            <strong style={{ color: 'var(--avf-primary)', fontSize: '1.1rem' }}>{txId}</strong>
          </div>

          <div className="d-grid mt-4">
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
            >
              Realizar otro envío
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!quoteData || !beneficiary) {
    return (
      <Card className="p-4">
        <Card.Body>
          <Alert variant="warning">Faltan datos para confirmar la transacción. Por favor, vuelve al inicio.</Alert>
          <Button variant="outline-secondary" onClick={() => window.location.href = '/'}>Volver al Inicio</Button>
        </Card.Body>
      </Card>
    );
  }

  //Combinamos nombre y apellido para una mejor visualización
  const fullName = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`.trim();

  return (
    <Card className="p-4">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>

        {/* --- NUEVO LAYOUT DE RESUMEN --- */}
        <ListGroup variant="flush">
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Beneficiario:</span>
            <span className="fw-bold text-end">{fullName}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">{getFieldDetails('beneficiary_document_number')?.name || 'Cédula/ID'}:</span>
            <span className="fw-bold text-end">{beneficiary.beneficiary_document_number}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Banco Destino:</span>
            <span className="fw-bold text-end">{getDisplayValue('bank_code')}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Tipo de Cuenta:</span>
            <span className="fw-bold text-end">{getDisplayValue('account_type_bank')}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Número de Cuenta:</span>
            <span className="fw-bold text-end">{beneficiary.account_bank}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Monto enviado ({quoteData.origin}):</span>
            <span className="fw-bold text-end">$ {formatNumberForDisplay(quoteData.amountIn)}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Tipo de cambio aplicado:</span>
            <span className="fw-bold text-end">{formatRate(quoteData.rateWithMarkup)}</span>
          </ListGroup.Item>
          <ListGroup.Item className="px-0 d-flex justify-content-between">
            <span className="text-muted">Monto a recibir ({quoteData.destCurrency}):</span>
            <span className="fw-bold text-end">$ {formatNumberForDisplay(quoteData.amountOut)}</span>
          </ListGroup.Item>
        </ListGroup>

        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Volver</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading}
            style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
          >
            {loading ? <Spinner as="span" size="sm" /> : 'Confirmar y Enviar'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepConfirm;