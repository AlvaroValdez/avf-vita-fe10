// frontend/src/components/remittance/StepConfirm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import {
  createWithdrawal,
  createPaymentOrder,
  createDirectPaymentOrder,
  getQuote,
  saveBeneficiary,
  getPaymentMethods
} from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';
import ManualDeposit from './ManualDeposit';

const QUOTE_VALIDITY_DURATION = 1.5 * 60 * 1000; // 90 segundos

const COUNTRY_TO_CURRENCY = {
  CL: 'CLP',
  CO: 'COP',
  AR: 'ARS',
  MX: 'MXN',
  BR: 'BRL',
  PE: 'PEN',
  BO: 'BOB',
  US: 'USD'
};

// ✅ Extractor simplificado: confía en el backend
function extractCheckoutUrlFromPaymentOrderResponse(resp) {
  const payload = resp?.data ?? resp;

  // El backend ya devuelve checkoutUrl construida correctamente
  return payload?.checkoutUrl || null;
}


const StepConfirm = ({ formData, fields, onBack, isFromFavorite }) => {
  const { quoteData, beneficiary, destCountry, originCountry } = formData;

  const safeOriginCurrency = useMemo(() => {
    return quoteData?.origin || COUNTRY_TO_CURRENCY[originCountry] || 'CLP';
  }, [quoteData?.origin, originCountry]);

  const [currentQuote, setCurrentQuote] = useState(quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('direct'); // ✅ DirectPay como predeterminado

  const [directMethods, setDirectMethods] = useState([]);
  const [selectedDirectMethod, setSelectedDirectMethod] = useState(null);
  const [directFormData, setDirectFormData] = useState({});
  const [directPaymentAvailable, setDirectPaymentAvailable] = useState(true);

  // 1) Refrescar cotización al cargar
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);

        const response = await getQuote({
          amount: quoteData?.amountIn,
          destCountry,
          origin: safeOriginCurrency,
          originCountry
        });

        if (response?.ok) {
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

  // 2) Timer expiración
  useEffect(() => {
    if (loadingQuote) return;

    const startTimestamp = Date.now();
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

  // 3) Métodos pago directo (solo si aplica)
  useEffect(() => {
    // Bolivia usa flujo manual, no DirectPay
    if (safeOriginCurrency === 'BOB') return;

    if (paymentMethod === 'direct' && directMethods.length === 0) {
      const loadMethods = async () => {
        try {
          const countryCode = originCountry || 'CL';
          const res = await getPaymentMethods(countryCode);

          // soporte flexible
          const methods =
            res?.data?.payment_methods ||
            res?.payment_methods ||
            res?.data ||
            res;

          if (res?.ok && Array.isArray(methods)) {
            setDirectMethods(methods);
            if (methods.length > 0) setSelectedDirectMethod(methods[0]);
          } else {
            throw new Error('Pago directo: formato de métodos no esperado.');
          }
        } catch (e) {
          console.error('Pago directo no disponible:', e);
          setDirectPaymentAvailable(false);
          setPaymentMethod('redirect');
          console.warn('⚠️ Cambiando a pasarela web (redirect) como fallback');
        }
      };
      loadMethods();
    }
  }, [paymentMethod, originCountry, safeOriginCurrency, directMethods.length]);

  const handleDirectFormChange = (e) => {
    setDirectFormData({ ...directFormData, [e.target.name]: e.target.value });
  };

  async function maybeSaveFavorite() {
    if (!saveAsFavorite || isFromFavorite) return;
    try {
      const nickname = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`.trim();
      await saveBeneficiary({
        nickname: nickname || 'Beneficiario',
        country: destCountry,
        beneficiaryData: beneficiary
      });
    } catch (e) {
      console.warn('No se pudo guardar favorito (no bloqueante):', e);
    }
  }

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validación de required_fields si el pago es directo
      if (paymentMethod === 'direct' && selectedDirectMethod) {
        for (const field of (selectedDirectMethod.required_fields || [])) {
          if (field.required && !directFormData[field.name]) {
            throw new Error(`Falta completar el campo: ${field.label}`);
          }
        }
      }

      // 1) Crear Withdrawal (solo para registrar la intención / payload en tu BE)
      await createWithdrawal({
        country, currency, amount,
        fee: currentQuote.fee,           // ← Agregado
        feePercent: currentQuote.feePercent,  // ← Agregado
        feeOriginAmount: currentQuote.feeOriginAmount, // ← Agregado
        ...beneficiary
      });

      if (!w?.ok) {
        throw new Error(w?.error || 'Error al crear la transacción.');
      }

      // Si tu BE algún día devuelve checkoutUrl directo acá, lo usamos:
      const directCheckout = w?.data?.checkoutUrl || w?.data?.checkout_url;
      if (directCheckout) {
        await maybeSaveFavorite();
        window.location.href = directCheckout;
        return;
      }

      // 2) Crear Payment Order (Pay-in) — el checkoutUrl correcto debe venir de esta respuesta
      const orderPayload = {
        amount: currentQuote.amountIn,
        country: originCountry || 'CL',
        orderId: w?.data?.order,
      };

      const po = await createPaymentOrder(orderPayload);
      if (!po?.ok) throw new Error(po?.error || 'No se pudo generar la orden de pago.');

      // 3) Si el usuario eligió "direct", ejecutar direct_payment (marca blanca)
      if (paymentMethod === 'direct') {
        const vitaOrderId = (po?.raw?.id || po?.raw?.data?.id || po?.data?.id);
        if (!vitaOrderId) {
          throw new Error('No se recibió el id de la orden de pago (Vita) para ejecutar pago directo.');
        }

        const exec = await createDirectPaymentOrder({
          vitaOrderId,
          payment_data: directFormData
        });

        if (!exec?.ok) {
          throw new Error(exec?.error || 'No se pudo ejecutar el pago directo.');
        }

        // En direct, Vita puede devolver un redirect igual
        const execUrl =
          exec?.data?.checkoutUrl ||
          exec?.data?.redirect_url ||
          exec?.data?.url ||
          exec?.data?.raw?.checkout_url ||
          exec?.data?.raw?.redirect_url ||
          exec?.data?.raw?.url;

        if (execUrl) {
          await maybeSaveFavorite();
          window.location.href = execUrl;
          return;
        }
        // Si no hay URL, igual lo dejamos como success “en plataforma”
        await maybeSaveFavorite();
        window.location.href = `/payment-success?orderId=${encodeURIComponent(orderPayload.orderId)}`;
        return;
      }

      // 4) Redirect normal: sacar checkoutUrl de po
      const checkoutUrl = extractCheckoutUrlFromPaymentOrderResponse(po);
      if (!checkoutUrl) {
        console.error('Respuesta Vita sin URL:', po);
        throw new Error('No se recibió la URL para completar el pago.');
      }

      await maybeSaveFavorite();
      window.location.href = checkoutUrl;
    } catch (err) {
      let msg = err?.message || 'Error desconocido';
      if (err?.details) msg = typeof err.details === 'string' ? err.details : JSON.stringify(err.details);

      if (msg.toLowerCase().includes('caducaron')) {
        msg = 'La cotización ha vencido. Por favor actualiza.';
        setIsExpired(true);
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getFieldDetails = (k) => fields?.find((f) => f.key === k);
  const getDisplayValue = (k, v) => {
    const field = getFieldDetails(k);
    if (field?.type === 'select' && field.options) {
      const opt = field.options.find((o) => o.value === v);
      return opt ? opt.label : v;
    }
    return v;
  };

  // --- RENDER ---

  // Caso manual Bolivia (Anchor)
  if (safeOriginCurrency === 'BOB') {
    return (
      <ManualDeposit
        formData={{ ...formData, quoteData: currentQuote, originCountry }}
        onFinish={() => (window.location.href = '/transactions')}
        onBack={onBack}
      />
    );
  }

  // Caso expirado
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

  const fullName = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`.trim();

  return (
    <Card className="p-4 shadow-sm border-0">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>

        {loadingQuote ? (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p>Actualizando cotización...</p>
          </div>
        ) : (
          <Row>
            <Col md={6} className="mb-4 mb-md-0">
              <h5>Detalles:</h5>
              <div className="p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Total a enviar:</span>
                  <span className="fw-bold fs-5">
                    {`$ ${formatNumberForDisplay(currentQuote.amountIn)} ${currentQuote.origin}`}
                  </span>
                </div>

                <small className="text-muted d-block text-center mb-2">
                  Tasa de cambio: 1 {currentQuote.destCurrency} = ${formatRate(1 / currentQuote.rateWithMarkup)} {currentQuote.origin}
                </small>

                <div className="d-flex justify-content-between align-items-center fw-bold">
                  <span>Total a recibir:</span>
                  <span className="fs-5">
                    {`$ ${formatNumberForDisplay(currentQuote.amountOut)} ${currentQuote.destCurrency}`}
                  </span>
                </div>
              </div>
            </Col>

            <Col md={6}>
              <h5>Beneficiario:</h5>
              <div className="mb-2">
                <small className="text-muted d-block">Nombre</small>
                <span className="fw-medium">{fullName}</span>
              </div>

              {Object.entries(beneficiary).map(([key, value]) => {
                if (!value || key.includes('name') || key === 'onComplete') return null;
                const field = getFieldDetails(key);
                const label = field ? field.name : key;
                return (
                  <div key={key} className="mb-2">
                    <small className="text-muted d-block">{label}:</small>
                    <span className="fw-medium">{getDisplayValue(key, value)}</span>
                  </div>
                );
              })}
            </Col>
          </Row>
        )}

        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <hr className="my-4" />

        <h5 className="mb-3">Método de Pago</h5>
        <Form>
          <div className="mb-3">
            <Form.Check
              type="radio"
              id="pay-redirect"
              label="Pasarela Web (Redirección)"
              name="paymentMethod"
              value="redirect"
              checked={paymentMethod === 'redirect'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <Form.Check
              type="radio"
              id="pay-direct"
              label="Pago Directo (Marca Blanca)"
              name="paymentMethod"
              value="direct"
              checked={paymentMethod === 'direct'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={!directPaymentAvailable}
            />
          </div>

          {paymentMethod === 'direct' && selectedDirectMethod && (
            <div className="p-3 border rounded bg-light mb-3">
              <h6 className="text-primary mb-3">
                {selectedDirectMethod.description || selectedDirectMethod.name}
              </h6>
              <Row>
                {(selectedDirectMethod.required_fields || []).map((field) => (
                  <Col md={6} key={field.name}>
                    <Form.Group className="mb-3">
                      <Form.Label>{field.label}</Form.Label>
                      <Form.Control
                        type={field.type || 'text'}
                        name={field.name}
                        onChange={handleDirectFormChange}
                        required={field.required}
                        value={directFormData[field.name] || ''}
                      />
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Form>

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

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>
            Atrás
          </Button>

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
