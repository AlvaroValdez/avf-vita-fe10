import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { createWithdrawal, createPaymentOrder, getQuote } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000; // 2 minutos

const StepConfirm = ({ formData, fields, onBack }) => {
  // Estado para la cotización, que se actualizará al cargar el componente
  const [currentQuote, setCurrentQuote] = useState(formData.quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);

  const { beneficiary, destCountry } = formData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  
  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Efecto para refrescar la cotización al cargar el componente
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await getQuote({ amount: formData.quoteData.amountIn, destCountry });
        if (response.ok) {
          setCurrentQuote(response.data); // Actualiza al nuevo precio
        } else {
          setError('No se pudo actualizar la cotización. Los precios pueden ser inexactos.');
        }
      } catch (err) {
        setError('Error de red al actualizar la cotización.');
      } finally {
        setLoadingQuote(false);
      }
    };
    
    refreshQuote();
  }, [formData.quoteData.amountIn, destCountry]);

  // Efecto para el temporizador, se activa después de refrescar la cotización
  useEffect(() => {
    if (!currentQuote || loadingQuote) return;

    const quoteTimestamp = Date.now();
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
  }, [currentQuote, loadingQuote]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const withdrawalResult = await createWithdrawal({
        country: destCountry,
        currency: currentQuote.origin,
        amount: currentQuote.amountIn,
        ...beneficiary,
      });

      if (withdrawalResult.ok) {
        const paymentOrderResult = await createPaymentOrder({
          amount: currentQuote.amountIn,
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

  if (isExpired) {
    return (
      <Card className="p-4 text-center">
        <Card.Body>
          <Alert variant="danger">
            <Alert.Heading>¡Tu cotización ha expirado!</Alert.Heading>
            <p>Por favor, vuelve para obtener una nueva tasa de cambio.</p>
          </Alert>
          <Button variant="outline-primary" onClick={onBack}>
            Volver
          </Button>
        </Card.Body>
      </Card>
    );
  }

  const fullName = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`.trim();

  return (
    <Card className="p-4">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>
        
        {loadingQuote ? (
          <div className="text-center p-5">
            <Spinner animation="border" />
            <p className="mt-2">Actualizando cotización...</p>
          </div>
        ) : (
          <Row>
            <Col md={6} className="mb-4 mb-md-0">
              <h5>Detalles:</h5>
              <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Total a enviar:</span>
                  <span className="fw-bold fs-5">{`$ ${formatNumberForDisplay(currentQuote.amountIn)} ${currentQuote.origin}`}</span>
                </div>
                <small className="text-muted d-block text-center mb-2">
                  Tasa de cambio: 1 {currentQuote.destCurrency} = ${formatRate(1 / currentQuote.rateWithMarkup)} {currentQuote.origin}
                </small>
                <div className="d-flex justify-content-between align-items-center fw-bold">
                  <span>Total a recibir:</span>
                  <span className="fs-5">{`$ ${formatNumberForDisplay(currentQuote.amountOut)} ${currentQuote.destCurrency}`}</span>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <h5>Beneficiario:</h5>
              <div className="mb-2"><small className="text-muted d-block">Nombre</small><span className="fw-medium">{fullName}</span></div>
              {Object.entries(beneficiary).map(([key, value]) => {
                if (!value || key.includes('name')) return null;
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
        )}
        
        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            disabled={loading || loadingQuote || isExpired}
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