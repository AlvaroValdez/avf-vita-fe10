import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
// Importamos getPaymentMethods en lugar de getDirectPaymentRequirements
import { createWithdrawal, createPaymentOrder, createDirectPaymentOrder, getQuote, saveBeneficiary, getPaymentMethods } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const QUOTE_VALIDITY_DURATION = 1.5 * 60 * 1000; // 90 segundos

const StepConfirm = ({ formData, fields, onBack }) => {
  const { quoteData, beneficiary, destCountry, quoteTimestamp } = formData;
  const [currentQuote, setCurrentQuote] = useState(formData.quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('redirect');

  // Estados para Pago Directo
  const [directMethods, setDirectMethods] = useState([]); // Lista de métodos
  const [selectedDirectMethod, setSelectedDirectMethod] = useState(null); // Método elegido (ID)
  const [directFormData, setDirectFormData] = useState({}); // Datos del formulario

  // 1. Refresco de Cotización (sin cambios)
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await getQuote({ amount: formData.quoteData.amountIn, destCountry });
        if (response.ok) setCurrentQuote(response.data);
        else setError('No se pudo actualizar la cotización.');
      } catch (err) { setError('Error de red al actualizar.'); }
      finally { setLoadingQuote(false); }
    };
    refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Timer (sin cambios)
  useEffect(() => {
    if (!currentQuote || loadingQuote) return;
    const ts = Date.now();
    setRemainingTime(QUOTE_VALIDITY_DURATION);
    const interval = setInterval(() => {
      const elapsed = Date.now() - ts;
      const left = QUOTE_VALIDITY_DURATION - elapsed;
      if (left <= 0) { clearInterval(interval); setRemainingTime(0); setIsExpired(true); }
      else setRemainingTime(left);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuote, loadingQuote]);

  // 3. CORRECCIÓN: Cargar métodos de pago reales según el país
  useEffect(() => {
    if (paymentMethod === 'direct' && directMethods.length === 0) {
      const loadMethods = async () => {
        try {
          // Llamamos al backend pasando el país (ej: 'CL')
          // NOTA: El pago directo suele ser en el país de origen del pago (Chile), no el destino.
          // Si el usuario paga en Chile, usamos 'CL'.
          const res = await getPaymentMethods('CL');

          if (res.ok && res.data.payment_methods) {
            setDirectMethods(res.data.payment_methods);
            // Seleccionar el primero por defecto
            if (res.data.payment_methods.length > 0) {
              setSelectedDirectMethod(res.data.payment_methods[0]);
            }
          }
        } catch (e) {
          console.error(e);
          setError('Error cargando métodos de pago disponibles.');
        }
      };
      loadMethods();
    }
  }, [paymentMethod]);

  const handleDirectFormChange = (e) => {
    setDirectFormData({ ...directFormData, [e.target.name]: e.target.value });
  };

  const handleMethodChange = (e) => {
    const methodId = e.target.value;
    const method = directMethods.find(m => m.method_id === methodId);
    setSelectedDirectMethod(method);
    setDirectFormData({}); // Limpiar formulario al cambiar método
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // Validar campos de pago directo
      if (paymentMethod === 'direct' && selectedDirectMethod) {
        for (const field of selectedDirectMethod.required_fields) {
          if (field.required && !directFormData[field.name]) {
            throw new Error(`El campo ${field.label} es obligatorio.`);
          }
        }
      }

      // Paso A: Withdrawal
      const withdrawalResult = await createWithdrawal({
        country: destCountry,
        currency: currentQuote.origin,
        amount: currentQuote.amountIn,
        ...beneficiary,
      });

      if (withdrawalResult.ok) {
        if (saveAsFavorite) {
          const nickname = `${beneficiary.beneficiary_first_name} ${beneficiary.beneficiary_last_name}`;
          saveBeneficiary({ nickname, country: destCountry, beneficiaryData: beneficiary }).catch(console.warn);
        }

        let paymentOrderResult;

        if (paymentMethod === 'redirect') {
          paymentOrderResult = await createPaymentOrder({
            amount: currentQuote.amountIn,
            country: 'CL',
            orderId: withdrawalResult.data.order,
          });
        } else {
          // PAGO DIRECTO REAL
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
          const paymentUrl = resData.payment_url || resData.data?.payment_url || resData.data?.attributes?.url || resData.url;

          if (paymentUrl) window.location.href = paymentUrl;
          else throw new Error('No se recibió URL de pago.');
        } else {
          throw new Error('Error al generar pago.');
        }
      } else {
        throw new Error(withdrawalResult.details || 'Error al crear transacción.');
      }
    } catch (err) {
      let msg = err.message || "Error desconocido";
      if (err.details) msg = JSON.stringify(err.details);
      setError(msg);
      setLoading(false);
    }
  };

  // ... (Helpers de UI sin cambios) ...
  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };
  const getFieldDetails = (k) => fields?.find(f => f.key === k);
  const getDisplayValue = (k, v) => { /* ... */ return v; };
  if (isExpired) return <Card className="p-4"><Alert variant="danger">Expirado</Alert><Button onClick={onBack}>Volver</Button></Card>;
  if (!quoteData) return null;

  const fullName = `${beneficiary.beneficiary_first_name} ${beneficiary.beneficiary_last_name}`;

  return (
    <Card className="p-4 shadow-sm border-0">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>
        <Row className="mb-4">
          <Col md={6}>
            <div className="p-3 rounded bg-light">
              <span className="fw-bold fs-5">${formatNumberForDisplay(currentQuote.amountIn)} {currentQuote.origin}</span>
              <br /><small>Total a pagar</small>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-2"><strong>Destinatario:</strong> {fullName}</div>
          </Col>
        </Row>

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
            <Form.Check
              type="radio" id="pay-direct" label="Pago Directo (Khipu / Transferencia)"
              name="paymentMethod" value="direct"
              checked={paymentMethod === 'direct'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>

          {/* --- FORMULARIO DINÁMICO DE PAGO DIRECTO --- */}
          {paymentMethod === 'direct' && directMethods.length > 0 && (
            <div className="p-3 border rounded bg-light mb-3">
              {/* Selector de Método si hay varios */}
              {directMethods.length > 1 && (
                <Form.Group className="mb-3">
                  <Form.Label>Selecciona medio de pago:</Form.Label>
                  <Form.Select onChange={handleMethodChange} value={selectedDirectMethod?.method_id}>
                    {directMethods.map(m => <option key={m.method_id} value={m.method_id}>{m.name}</option>)}
                  </Form.Select>
                </Form.Group>
              )}

              {selectedDirectMethod && (
                <>
                  <h6 className="text-primary mb-3">{selectedDirectMethod.description || selectedDirectMethod.name}</h6>
                  <Row>
                    {selectedDirectMethod.required_fields.map(field => (
                      <Col md={6} key={field.name}>
                        <Form.Group className="mb-3">
                          <Form.Label>{field.label}</Form.Label>
                          <Form.Control
                            type={field.type === 'string' ? 'text' : field.type}
                            name={field.name}
                            value={directFormData[field.name] || ''}
                            onChange={handleDirectFormChange}
                            required={field.required}
                          />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </div>
          )}
          {paymentMethod === 'direct' && directMethods.length === 0 && (
            <Alert variant="warning">Cargando métodos de pago...</Alert>
          )}
        </Form>

        {!isFromFavorite && (
          <Form.Group className="mb-3 mt-3">
            <Form.Check
              type="checkbox"
              label="Agregar a favoritos para futuros envíos"
              checked={saveAsFavorite}
              onChange={(e) => setSaveAsFavorite(e.target.checked)}
            />
          </Form.Group>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading || isExpired}
            style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
          >
            {loading ? <Spinner as="span" size="sm" /> : `Pagar $${formatNumberForDisplay(currentQuote.amountIn)}`}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepConfirm;