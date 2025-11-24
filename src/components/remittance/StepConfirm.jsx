import React, { useState, useEffect } from 'react';
// --- CORRECCIÓN: Se añade 'Form' a los imports ---
import { Card, Button, Row, Col, Spinner, Alert, ListGroup, Form } from 'react-bootstrap';
import { createWithdrawal, createPaymentOrder, getQuote, saveBeneficiary } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000; // 2 minutos

const StepConfirm = ({ formData, fields, onBack }) => {
  const { quoteData, beneficiary, destCountry, quoteTimestamp } = formData;
  
  // Estado para la cotización (refrescada)
  const [currentQuote, setCurrentQuote] = useState(formData.quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  
  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false); // Estado para el checkbox

  // Efecto para refrescar la cotización
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await getQuote({ amount: formData.quoteData.amountIn, destCountry });
        if (response.ok) {
          setCurrentQuote(response.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para el temporizador
  useEffect(() => {
    if (!currentQuote || loadingQuote) return;

    const quoteTimestamp = Date.now();
    setRemainingTime(QUOTE_VALIDITY_DURATION);

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

  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const getFieldDetails = (key) => fields?.find(f => f.key === key);
  
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

        // --- CORRECCIÓN Y DEBUGGING ---
        console.log('📦 Respuesta completa de Orden de Pago:', paymentOrderResult);

        if (paymentOrderResult.ok) {
          // Extraemos los datos crudos que vienen del backend
          const responseData = paymentOrderResult.data;

          // Buscamos la URL en las posibles ubicaciones según la estructura de Vita
          // 1. Directamente en la data (data.payment_url)
          // 2. Dentro de un objeto data (data.data.payment_url)
          // 3. Dentro de attributes (data.data.attributes.payment_url) <-- Muy probable
          const paymentUrl = responseData.payment_url || 
                             responseData.data?.payment_url || 
                             responseData.data?.attributes?.payment_url;

          if (paymentUrl) {
            console.log('🚀 Redirigiendo a:', paymentUrl);
            window.location.href = paymentUrl;
          } else {
            console.error('❌ No se encontró la URL de pago en la respuesta:', responseData);
            throw new Error('La respuesta de Vita Wallet no contiene la URL de pago.');
          }
        } else {
          throw new Error('No se pudo generar el link de pago.');
        }
      } else {
        throw new Error(withdrawalResult.details || withdrawalResult.error || 'No se pudo crear la transacción inicial.');
      }
    } catch (err) {
       const errorDetails = err.details ? (typeof err.details === 'object' ? JSON.stringify(err.details) : err.details) : (err.message || err.error || 'Error desconocido');
       setError(`Error al procesar el envío: ${errorDetails}`);
       setLoading(false);
    }
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
          <div className="text-center p-5"><Spinner animation="border" /> <p>Actualizando cotización...</p></div>
        ) : (
          <>
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

            {/* --- CHECKBOX DE FAVORITOS --- */}
            <Form.Group className="mb-3 mt-4 pt-3 border-top">
                <Form.Check
                    type="checkbox"
                    id="save-favorite-check"
                    label="Guardar este beneficiario en mis favoritos para futuros envíos"
                    checked={saveAsFavorite}
                    onChange={(e) => setSaveAsFavorite(e.target.checked)}
                />
            </Form.Group>
          </>
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