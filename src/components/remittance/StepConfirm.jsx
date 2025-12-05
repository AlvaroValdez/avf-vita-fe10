import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { createWithdrawal, createPaymentOrder, createDirectPaymentOrder, getQuote, saveBeneficiary, getPaymentMethods } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';
import ManualDeposit from './ManualDeposit';

const QUOTE_VALIDITY_DURATION = 1.5 * 60 * 1000; // 90 segundos

const StepConfirm = ({ formData, fields, onBack, isFromFavorite }) => {
  // Desestructuramos los datos recibidos del paso anterior
  const { quoteData, beneficiary, destCountry, originCountry, quoteTimestamp } = formData;

  // Estados
  const [currentQuote, setCurrentQuote] = useState(quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Timer
  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Favoritos y Pagos
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('redirect');
  const [directMethods, setDirectMethods] = useState([]);
  const [selectedDirectMethod, setSelectedDirectMethod] = useState(null);
  const [directFormData, setDirectFormData] = useState({});
  const [directPaymentAvailable, setDirectPaymentAvailable] = useState(true);

  // 1. Refrescar Cotización al cargar (CRÍTICO: Incluye 'origin')
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);
        // CORRECCIÓN: Enviamos 'origin' para que el backend calcule bien la tasa (ej: BOB->CLP o CLP->COP)
        const origin = originCountry || currentQuote.origin || 'CLP';
        const response = await getQuote({
          amount: currentQuote.amountIn,
          destCountry,
          origin: origin
        });

        if (response.ok) {
          setCurrentQuote(response.data);
        } else {
          console.warn('No se pudo refrescar cotización, usando anterior.');
        }
      } catch (err) {
        console.error('Error refrescando quote:', err);
      } finally {
        setLoadingQuote(false);
      }
    };
    refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Timer de Expiración
  useEffect(() => {
    if (loadingQuote) return;

    const startTimestamp = Date.now(); // Reiniciamos el contador al refrescar
    setRemainingTime(QUOTE_VALIDITY_DURATION);
    setIsExpired(false);

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTimestamp;
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

  // 3. Cargar Métodos de Pago (Dinámico según País de Origen)
  useEffect(() => {
    // Si es Manual (BO), no cargamos métodos de Vita
    if (originCountry === 'BO' || currentQuote.origin === 'BOB') return;

    if (paymentMethod === 'direct' && directMethods.length === 0) {
      const loadMethods = async () => {
        try {
          // Cargamos métodos para el país donde está el usuario (Origen)
          const countryCode = originCountry || 'CL';
          const res = await getPaymentMethods(countryCode);

          if (res.ok && res.data.payment_methods) {
            setDirectMethods(res.data.payment_methods);
            if (res.data.payment_methods.length > 0) {
              setSelectedDirectMethod(res.data.payment_methods[0]);
            }
          }
        } catch (e) {
          console.error("Pago directo no disponible:", e);
          setDirectPaymentAvailable(false);
          setPaymentMethod('redirect');
          // No mostramos alert para no interrumpir, solo deshabilitamos la opción visualmente si se desea
        }
      };
      loadMethods();
    }
  }, [paymentMethod, originCountry, currentQuote.origin, directMethods.length]);

  const handleDirectFormChange = (e) => {
    setDirectFormData({ ...directFormData, [e.target.name]: e.target.value });
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validar formulario de pago directo
      if (paymentMethod === 'direct' && selectedDirectMethod) {
        for (const field of selectedDirectMethod.required_fields) {
          if (field.required && !directFormData[field.name]) {
            throw new Error(`Falta completar el campo: ${field.label}`);
          }
        }
      }

      // 1. Crear Payout (Withdrawal)
      const withdrawalResult = await createWithdrawal({
        country: destCountry,
        currency: currentQuote.origin,
        amount: currentQuote.amountIn,
        ...beneficiary,
      });

      if (withdrawalResult.ok) {
        // 2. Guardar Favorito (si corresponde)
        if (saveAsFavorite && !isFromFavorite) {
          const nickname = `${beneficiary.beneficiary_first_name} ${beneficiary.beneficiary_last_name}`;
          // Guardamos en segundo plano (no bloqueante)
          saveBeneficiary({ nickname, country: destCountry, beneficiaryData: beneficiary }).catch(console.warn);
        }

        // 3. Crear Orden de Pago (Pay-in)
        let paymentOrderResult;

        // Datos base para la orden
        const orderPayload = {
          amount: currentQuote.amountIn,
          country: originCountry || 'CL', // País del pagador
          orderId: withdrawalResult.data.order,
        };

        if (paymentMethod === 'redirect') {
          paymentOrderResult = await createPaymentOrder(orderPayload);
        } else {
          // Inyectamos datos extra para Direct Payment
          paymentOrderResult = await createDirectPaymentOrder({
            ...orderPayload,
            payer_details: directFormData,
            method_id: selectedDirectMethod?.method_id
          });
        }

        if (paymentOrderResult.ok) {
          // Búsqueda inteligente de la URL de pago
          const resData = paymentOrderResult.data || paymentOrderResult;
          const paymentUrl =
            resData.data?.attributes?.url ||
            resData.data?.payment_url ||
            resData.payment_url ||
            resData.url;

          if (paymentUrl) {
            window.location.href = paymentUrl;
          } else {
            console.error("Respuesta Vita sin URL:", resData);
            throw new Error('No se recibió la URL para completar el pago.');
          }
        } else {
          throw new Error('No se pudo generar la orden de pago.');
        }
      } else {
        throw new Error(withdrawalResult.details || withdrawalResult.error || 'Error al crear la transacción.');
      }
    } catch (err) {
      let msg = err.message || "Error desconocido";
      if (err.details) msg = typeof err.details === 'string' ? err.details : JSON.stringify(err.details);

      if (msg.toLowerCase().includes('caducaron')) {
        msg = "La cotización ha vencido. Por favor actualiza.";
        setIsExpired(true);
      }
      setError(msg);
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---

  // 1. Caso Anchor Manual (Bolivia)
  if (originCountry === 'BO' || currentQuote.origin === 'BOB') {
    return (
      <ManualDeposit
        formData={{ ...formData, quoteData: currentQuote }}
        onFinish={() => window.location.href = '/transactions'}
        onBack={onBack}
      />
    );
  }

  // 2. Caso Expirado
  if (isExpired) {
    return (
      <Card className="p-4 text-center shadow-sm border-0">
        <Card.Body>
          <div className="text-warning mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
          <h4 className="text-danger">Cotización Expirada</h4>
          <p className="text-muted">El tiempo de validez de la tasa ha finalizado.</p>
          <Button variant="primary" onClick={onBack}>Volver a Cotizar</Button>
        </Card.Body>
      </Card>
    );
  }

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

  const fullName = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`.trim();

  return (
    <Card className="p-4 shadow-sm border-0">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>

        {loadingQuote ? (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Actualizando tasa de cambio...</p>
          </div>
        ) : (
          <Row className="mb-4">
            <Col md={6}>
              <div className="p-3 rounded bg-light mb-3 mb-md-0">
                <div className="d-flex justify-content-between mb-2">
                  <span>Monto a enviar:</span>
                  <span className="fw-bold">{formatNumberForDisplay(currentQuote.amountIn)} {currentQuote.origin}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 text-muted small">
                  <span>Tasa:</span>
                  <span>1 {currentQuote.destCurrency} = {formatRate(1 / currentQuote.rateWithMarkup)} {currentQuote.origin}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fw-bold fs-5 text-primary">
                  <span>Total a recibir:</span>
                  {/* Aquí mostramos el monto calculado corregido */}
                  <span>{formatNumberForDisplay(currentQuote.amountOut)} {currentQuote.destCurrency}</span>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <h6 className="text-primary">Datos del Beneficiario</h6>
              <div className="mb-2"><strong>Nombre:</strong> {fullName}</div>
              {Object.entries(beneficiary).map(([key, value]) => {
                if (!value || key.includes('name') || key === 'onComplete') return null;
                const field = getFieldDetails(key);
                // Solo mostramos campos relevantes (banco, cuenta, email)
                if (!field) return null;
                return <div key={key} className="small mb-1"><span className="text-muted">{field.name}:</span> {getDisplayValue(key, value)}</div>;
              })}
            </Col>
          </Row>
        )}

        <hr />

        <h5 className="mb-3">Método de Pago</h5>
        <Form>
          <div className="mb-3">
            <Form.Check
              type="radio" id="pay-redirect" label="Pasarela Web (Redirección)"
              name="paymentMethod" value="redirect"
              checked={paymentMethod === 'redirect'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            {/* Solo mostramos la opción Directa si está disponible y no falló la carga */}
            <Form.Check
              type="radio" id="pay-direct" label="Pago Directo (Marca Blanca)"
              name="paymentMethod" value="direct"
              checked={paymentMethod === 'direct'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={!directPaymentAvailable}
            />
          </div>

          {paymentMethod === 'direct' && selectedDirectMethod && (
            <div className="p-3 border rounded bg-light mb-3">
              <h6 className="text-primary mb-3">{selectedDirectMethod.description || selectedDirectMethod.name}</h6>
              <Row>
                {selectedDirectMethod.required_fields.map(field => (
                  <Col md={6} key={field.name}>
                    <Form.Group className="mb-3">
                      <Form.Label>{field.label}</Form.Label>
                      <Form.Control
                        type={field.type}
                        name={field.name}
                        onChange={handleDirectFormChange}
                        required={field.required}
                      />
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Form>

        {/* Ocultar checkbox si ya viene de favorito */}
        {!isFromFavorite && (
          <Form.Group className="mb-3 mt-3 border-top pt-3">
            <Form.Check
              type="checkbox"
              label="Guardar en Mis Favoritos"
              checked={saveAsFavorite}
              onChange={(e) => setSaveAsFavorite(e.target.checked)}
            />
          </Form.Group>
        )}

        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading || loadingQuote || isExpired}
            style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
            className="px-4 fw-bold"
          >
            {loading ? <Spinner as="span" size="sm" /> : `Pagar ${formatNumberForDisplay(currentQuote.amountIn)} ${currentQuote.origin}`}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepConfirm;