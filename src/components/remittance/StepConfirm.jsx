import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { createWithdrawal, createPaymentOrder } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000; // 2 minutos

const StepConfirm = ({ formData, fields, onBack }) => {
  const { quoteData, beneficiary, destCountry, quoteTimestamp } = formData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  
  const [remainingTime, setRemainingTime] = useState(QUOTE_VALIDITY_DURATION);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!quoteTimestamp) return;
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - quoteTimestamp;
      const timeLeft = QUOTE_VALIDITY_DURATION - elapsedTime;
      if (timeLeft <= 0) {
        clearInterval(interval);
        setRemainingTime(0);
        setIsExpired(true);
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

  const getFieldDetails = (key) => fields.find(f => f.key === key);
  
  const getDisplayValue = (field, value) => {
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
      const withdrawalResult = await createWithdrawal({
        country: destCountry,
        currency: quoteData.origin,
        amount: quoteData.amountIn,
        ...beneficiary,
      });

      if (withdrawalResult.ok) {
        const paymentOrderResult = await createPaymentOrder({
          amount: quoteData.amountIn,
          country: 'CL',
          orderId: withdrawalResult.data.order,
        });

        if (paymentOrderResult.ok) {
          window.location.href = paymentOrderResult.data.data.payment_url;
        } else {
          throw new Error('No se pudo generar el link de pago.');
        }
      } else {
        throw new Error('No se pudo crear la transacción inicial.');
      }
    } catch (err) {
      const errorDetails = err.details ? (typeof err.details === 'object' ? JSON.stringify(err.details) : err.details) : (err.error || err.message);
      setError(`Error al procesar el envío: ${errorDetails}`);
      setLoading(false);
    }
  };
  
  // --- RENDERIZADO DEL COMPONENTE ---

  if (isExpired) {
    return (
      <Card className="p-4 text-center">
        <Card.Body>
          <Alert variant="danger">
            <Alert.Heading>¡Tu cotización ha expirado!</Alert.Heading>
            <p>Por favor, vuelve al inicio para cotizar nuevamente.</p>
          </Alert>
          <Button variant="outline-primary" onClick={onBack}>
            Volver
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (!quoteData || !beneficiary) {
    return (
      <Card className="p-4"><Card.Body><Alert variant="warning">Faltan datos para confirmar.</Alert></Card.Body></Card>
    );
  }

  return (
    <Card className="p-4">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>
        
        {/* --- JSX DEL RESUMEN RESTAURADO --- */}
        <Row>
          <Col md={6} className="mb-4 mb-md-0">
            <h5>Detalles:</h5>
            <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Total a enviar:</span>
                <span className="fw-bold fs-5">{`$ ${formatNumberForDisplay(quoteData.amountIn)} ${quoteData.origin}`}</span>
              </div>
              <small className="text-muted d-block text-center mb-2">
                Tasa de cambio: 1 {quoteData.destCurrency} = ${formatRate(1 / quoteData.rateWithMarkup)} {quoteData.origin}
              </small>
              <div className="d-flex justify-content-between align-items-center fw-bold">
                <span>Total a recibir:</span>
                <span className="fs-5">{`$ ${formatNumberForDisplay(quoteData.amountOut)} ${quoteData.destCurrency}`}</span>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <h5>Beneficiario:</h5>
            {Object.entries(beneficiary).map(([key, value]) => {
              if (!value) return null;
              const fieldDetails = getFieldDetails(key);
              const label = fieldDetails ? fieldDetails.name : key;
              const displayValue = getDisplayValue(fieldDetails, value);
              return (
                <div key={key} className="mb-2">
                  <small className="text-muted d-block">{label}:</small>
                  <span className="fw-medium">{displayValue}</span>
                </div>
              );
            })}
          </Col>
        </Row>

        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} // <-- ACCIÓN DEL BOTÓN RESTAURADA
            disabled={loading || isExpired}
            style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
          >
            {loading ? <Spinner as="span" size="sm" /> : `Confirmar envío (${formatTime(remainingTime)})`}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepConfirm;