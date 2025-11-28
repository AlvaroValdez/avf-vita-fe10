import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { createWithdrawal, createPaymentOrder, createDirectPaymentOrder, getQuote, saveBeneficiary, getPaymentMethods } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000;

const StepConfirm = ({ formData, fields, onBack, isFromFavorite }) => {
  const { quoteData, beneficiary, destCountry } = formData;
  const [currentQuote, setCurrentQuote] = useState(formData.quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  // Estados para Pago
  const [paymentMethod, setPaymentMethod] = useState('redirect');
  const [directMethods, setDirectMethods] = useState([]);
  const [selectedDirectMethod, setSelectedDirectMethod] = useState(null);
  const [directFormData, setDirectFormData] = useState({});
  const [directPaymentAvailable, setDirectPaymentAvailable] = useState(true);

  // 1. Refrescar Cotización
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await getQuote({ amount: formData.quoteData.amountIn, destCountry });
        if (response.ok) setCurrentQuote(response.data);
        else console.warn('No se pudo refrescar cotización');
      } catch (err) {
        console.error('Error refrescando quote:', err);
      } finally {
        setLoadingQuote(false);
      }
    };
    refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Timer
  useEffect(() => {
    if (loadingQuote) return;
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
  }, [loadingQuote]);

  // 3. Cargar Métodos de Pago Directo
  useEffect(() => {
    if (paymentMethod === 'direct' && directMethods.length === 0) {
      const loadMethods = async () => {
        try {
          const res = await getPaymentMethods('CL'); // Origen del pago (Chile)
          if (res.ok && res.data.payment_methods) {
            setDirectMethods(res.data.payment_methods);
            if (res.data.payment_methods.length > 0) setSelectedDirectMethod(res.data.payment_methods[0]);
          }
        } catch (e) {
          console.error("Pago directo no disponible:", e);
          setDirectPaymentAvailable(false);
          setPaymentMethod('redirect');
          alert("Pago directo no disponible temporalmente.");
        }
      };
      loadMethods();
    }
  }, [paymentMethod, directMethods.length]);

  const handleDirectFormChange = (e) => {
    setDirectFormData({ ...directFormData, [e.target.name]: e.target.value });
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validar form directo
      if (paymentMethod === 'direct' && selectedDirectMethod) {
        for (const field of selectedDirectMethod.required_fields) {
          if (field.required && !directFormData[field.name]) throw new Error(`Falta campo: ${field.label}`);
        }
      }

      // 1. Payout
      const withdrawalResult = await createWithdrawal({
        country: destCountry,
        currency: currentQuote.origin,
        amount: currentQuote.amountIn,
        ...beneficiary,
      });

      if (withdrawalResult.ok) {
        // 2. Guardar Favorito (Solo si no venía de uno y se marcó el check)
        if (saveAsFavorite && !isFromFavorite) {
          const nickname = `${beneficiary.beneficiary_first_name} ${beneficiary.beneficiary_last_name}`;
          saveBeneficiary({ nickname, country: destCountry, beneficiaryData: beneficiary }).catch(console.warn);
        }

        // 3. Pay-in
        let paymentOrderResult;
        if (paymentMethod === 'redirect') {
          paymentOrderResult = await createPaymentOrder({
            amount: currentQuote.amountIn,
            country: 'CL',
            orderId: withdrawalResult.data.order,
          });
        } else {
          paymentOrderResult = await createDirectPaymentOrder({
            amount: currentQuote.amountIn,
            country: 'CL',
            orderId: withdrawalResult.data.order,
            payer_details: directFormData,
            method_id: selectedDirectMethod?.method_id
          });
        }

        if (paymentOrderResult.ok) {
          const resData = paymentOrderResult.data || paymentOrderResult;
          const paymentUrl = resData.payment_url || resData.data?.attributes?.url || resData.url;
          if (paymentUrl) window.location.href = paymentUrl;
          else throw new Error('No se recibió URL de pago.');
        } else {
          throw new Error('Error al generar orden de pago.');
        }
      } else {
        throw new Error(withdrawalResult.details || 'Error al crear transacción.');
      }
    } catch (err) {
      let msg = err.message || "Error desconocido";
      if (err.details) msg = JSON.stringify(err.details);
      if (msg.includes('caducaron')) {
        msg = "La cotización ha vencido. Por favor actualiza.";
        setIsExpired(true);
      }
      setError(msg);
      setLoading(false);
    }
  };

  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const getFieldDetails = (k) => fields?.find(f => f.key === k);
  const getDisplayValue = (k, v) => {
    const field = getFieldDetails(k);
    if (field?.type === 'select' && field.options) {
      const opt = field.options.find(o => o.value === v);
      return opt ? opt.label : v;
    }
    return v;
  };

  if (isExpired) return <Card className="p-4 text-center"><Alert variant="danger">Cotización Expirada</Alert><Button onClick={onBack}>Volver</Button></Card>;

  const fullName = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`;

  return (
    <Card className="p-4 shadow-sm border-0">
      <Card.Body>
        <h4 className="mb-4">Resumen</h4>
        {loadingQuote ? <Spinner /> : (
          <Row className="mb-4">
            <Col md={6}>
              <div className="p-3 rounded bg-light">
                <span className="fw-bold fs-5">${formatNumberForDisplay(currentQuote.amountIn)} {currentQuote.origin}</span>
                <br /><small>Total a pagar</small>
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-2"><strong>Destinatario:</strong> {fullName}</div>
              {Object.entries(beneficiary).map(([key, value]) => {
                if (!value || key.includes('name')) return null;
                const field = getFieldDetails(key);
                return <div key={key}><small className="text-muted">{field?.name}:</small> {getDisplayValue(key, value)}</div>;
              })}
            </Col>
          </Row>
        )}

        <hr />

        <h5 className="mb-3">Método de Pago</h5>
        <Form>
          <div className="mb-3">
            <Form.Check type="radio" label="Pasarela Web" name="pm" checked={paymentMethod === 'redirect'} onChange={() => setPaymentMethod('redirect')} />
            <Form.Check type="radio" label="Pago Directo" name="pm" checked={paymentMethod === 'direct'} onChange={() => setPaymentMethod('direct')} disabled={!directPaymentAvailable} />
          </div>
          {paymentMethod === 'direct' && selectedDirectMethod && (
            <div className="p-3 bg-light rounded">
              <h6>{selectedDirectMethod.name}</h6>
              <Row>
                {selectedDirectMethod.required_fields.map(f => (
                  <Col md={6} key={f.name}>
                    <Form.Group className="mb-2"><Form.Label>{f.label}</Form.Label><Form.Control name={f.name} onChange={handleDirectFormChange} required={f.required} /></Form.Group>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Form>

        {/* Ocultar si ya viene de favorito */}
        {!isFromFavorite && (
          <Form.Group className="mb-3 mt-3 border-top pt-3">
            <Form.Check type="checkbox" label="Guardar favorito" checked={saveAsFavorite} onChange={(e) => setSaveAsFavorite(e.target.checked)} />
          </Form.Group>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading || isExpired} style={{ backgroundColor: 'var(--avf-secondary)' }}>
            {loading ? <Spinner size="sm" /> : `Pagar $${formatNumberForDisplay(currentQuote.amountIn)}`}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepConfirm;