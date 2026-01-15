// frontend/src/components/remittance/StepConfirm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Spinner, Alert, Form, Modal } from 'react-bootstrap';
import {
  createWithdrawal,
  createPaymentOrder,
  getQuote,
  saveBeneficiary,
  getPaymentMethods,
  getTransactionRules,
  uploadImage
} from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';
import ManualDeposit from './ManualDeposit';
import DirectPayForm from './DirectPayForm';

const QUOTE_VALIDITY_DURATION = 1.5 * 60 * 1000;

const COUNTRY_TO_CURRENCY = {
  CL: 'CLP', CO: 'COP', AR: 'ARS', MX: 'MXN', BR: 'BRL', PE: 'PEN', BO: 'BOB', US: 'USD'
};

function extractCheckoutUrlFromPaymentOrderResponse(resp) {
  const payload = resp?.data ?? resp;

  // Vita devuelve la URL en diferentes lugares según el flujo:
  // - Redirect: attributes.url (ej: "https://stage.vitawallet.io/s/Yxeu42")
  // - Legacy: checkoutUrl
  return payload?.attributes?.url ||
    payload?.checkoutUrl ||
    payload?.data?.attributes?.url ||
    null;
}

const StepConfirm = ({ formData, fields, onBack, isFromFavorite }) => {
  const navigate = useNavigate();
  const { quoteData, beneficiary, destCountry, originCountry } = formData;

  const safeOriginCurrency = useMemo(() => {
    return quoteData?.origin || COUNTRY_TO_CURRENCY[originCountry] || 'CLP';
  }, [quoteData?.origin, originCountry]);

  const safeDestCurrency = useMemo(() => {
    return quoteData?.dest || quoteData?.to || COUNTRY_TO_CURRENCY[destCountry] || 'COP';
  }, [quoteData, destCountry]);

  const [currentQuote, setCurrentQuote] = useState(quoteData);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  // --- LÓGICA DIRECT PAY ---
  const [paymentMethod, setPaymentMethod] = useState('direct'); // Default a Directo
  const [directMethods, setDirectMethods] = useState([]);
  const [selectedDirectMethod, setSelectedDirectMethod] = useState(null);
  const [directFormData, setDirectFormData] = useState({});
  const [directPaymentAvailable, setDirectPaymentAvailable] = useState(true);
  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [directPayOrderId, setDirectPayOrderId] = useState(null);

  // --- PAYMENT METHOD CONFIGURATION ---
  const [paymentConfig, setPaymentConfig] = useState({
    direct: { enabled: true, allowedProviders: [] },
    redirect: { enabled: true }
  });

  // 1) Cargar configuración de métodos de pago
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/transaction-rules?country=${originCountry}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        const rules = data?.rules?.[0];

        if (rules?.paymentMethods) {
          setPaymentConfig(rules.paymentMethods);
          console.log('[StepConfirm] Payment config loaded:', rules.paymentMethods);
        }
      } catch (error) {
        console.error('[StepConfirm] Error fetching payment config:', error);
        // Keep defaults
      }
    };

    if (originCountry) {
      fetchPaymentConfig();
    }
  }, [originCountry]);

  // 2) Refrescar Quote
  useEffect(() => {
    const refreshQuote = async () => {
      try {
        setLoadingQuote(true);
        const response = await getQuote({
          amount: quoteData?.amount,
          destCountry,
          origin: safeOriginCurrency,
          originCountry
        });
        if (response?.ok) setCurrentQuote(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuote(false);
      }
    };
    refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Timer Expiración
  useEffect(() => { /* ... lógica de timer igual ... */ }, [loadingQuote]);

  // 4) Cargar Métodos Directos (Ej: Khipu/Webpay para Chile)
  useEffect(() => {
    if (safeOriginCurrency === 'BOB') return;
    if (paymentMethod === 'direct' && directMethods.length === 0) {
      const loadMethods = async () => {
        try {
          const countryCode = originCountry || 'CL';
          console.log('[StepConfirm] Cargando métodos para país:', countryCode);

          const res = await getPaymentMethods(countryCode);
          console.log('[StepConfirm] Respuesta completa:', res);

          const methods = res?.data?.payment_methods || res?.payment_methods || res?.data || [];
          console.log('[StepConfirm] Métodos extraídos:', methods);
          console.log('[StepConfirm] Cantidad de métodos:', methods.length);

          if (res?.ok && Array.isArray(methods) && methods.length > 0) {
            // Filter methods based on allowedProviders
            const allowed = paymentConfig?.direct?.allowedProviders || [];
            console.log('[StepConfirm] Allowed providers configured:', allowed);

            const filteredMethods = allowed.length > 0
              ? methods.filter(method =>
                allowed.some(provider =>
                  method.name.toLowerCase().includes(provider.toLowerCase()) ||
                  method.provider?.toLowerCase().includes(provider.toLowerCase())
                )
              )
              : methods;  // Show all if no specific filter configured

            console.log('[StepConfirm] Allowed providers:', allowed);
            console.log('[StepConfirm] Filtered methods:', filteredMethods.map(m => m.name));

            if (filteredMethods.length > 0) {
              setDirectMethods(filteredMethods);
              setSelectedDirectMethod(filteredMethods[0]);
              console.log('[StepConfirm] ✅ Métodos cargados:', filteredMethods.map(m => m.name));
            } else {
              console.warn('[StepConfirm] ⚠️ No hay métodos después del filtro');
              throw new Error('Sin métodos permitidos');
            }
          } else {
            console.warn('[StepConfirm] ⚠️ No se encontraron métodos válidos');
            throw new Error('Sin métodos directos');
          }
        } catch (e) {
          console.warn('[StepConfirm] ❌ Error cargando métodos:', e);
          setDirectPaymentAvailable(false);
          setPaymentMethod('redirect');
        }
      };
      loadMethods();
    }
  }, [paymentMethod, originCountry, safeOriginCurrency, directMethods.length, paymentConfig]);

  const handleDirectFormChange = (e) => {
    setDirectFormData({ ...directFormData, [e.target.name]: e.target.value });
  };

  async function maybeSaveFavorite() { /* ... igual ... */ }

  // 4) CONFIRMAR Y PAGAR
  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validar campos requeridos de Direct Pay (si aplica)
      if (paymentMethod === 'direct' && selectedDirectMethod) {
        for (const field of (selectedDirectMethod.required_fields || [])) {
          if (field.required && !directFormData[field.name]) {
            throw new Error(`Falta completar: ${field.label}`);
          }
        }
      }

      // 0. Subir QR del beneficiario si existe (Flow Bolivia)
      let qrUrl = null;
      if (beneficiary.beneficiaryQrFile) {
        console.log('[StepConfirm] Subiendo QR del beneficiario...');
        const formDataImg = new FormData();
        formDataImg.append('image', beneficiary.beneficiaryQrFile);

        try {
          const uploadRes = await uploadImage(formDataImg);
          qrUrl = uploadRes.url;
          console.log('[StepConfirm] QR subido:', qrUrl);
        } catch (uploadErr) {
          console.error('Error subiendo QR:', uploadErr);
          // Opcional: ¿Fallar o continuar sin QR?
          // throw new Error('Error al subir el código QR. Inténtalo de nuevo.');
        }
      }

      // A. Crear Transaction en DB con estado pending_payment
      // Generamos un orderId único para esta transacción
      const orderId = `ORD-${Date.now()}`;

      console.log('[StepConfirm] Creando transacción en DB...');
      console.log('[StepConfirm] Current Quote:', currentQuote);
      console.log('[StepConfirm] rateTracking:', currentQuote.rateTracking);
      console.log('[StepConfirm] amountsTracking:', currentQuote.amountsTracking);
      console.log('[StepConfirm] feeAudit:', currentQuote.feeAudit);

      const transactionPayload = {
        order: orderId,
        country: destCountry,
        currency: safeOriginCurrency,
        amount: currentQuote.amount,
        fee: currentQuote.fee || 0,
        feePercent: currentQuote.feePercent || 0,
        feeOriginAmount: currentQuote.feeOriginAmount || 0,
        ...beneficiary,
        // Eliminamos el archivo del payload para no enviarlo al backend en el campo beneficiary
        beneficiaryQrFile: undefined,
        beneficiaryQrContent: undefined,
        status: 'pending_payment',
        payinStatus: 'pending',
        payoutStatus: 'pending',
        purpose: formData.purpose || 'EPFAMT', // Código correcto VITA para "Family maintenance"
        purpose_comentary: formData.purpose_comentary || 'Family maintenance',

        // Metadata extendida con QR
        metadata: {
          beneficiary_qr_url: qrUrl,
          qr_raw_data: beneficiary.beneficiaryQrContent || null
        },

        // 📊 Tracking Data (Spread Model)
        rateTracking: currentQuote.rateTracking || null,
        amountsTracking: currentQuote.amountsTracking || null,
        feeAudit: currentQuote.feeAudit || null
      };

      const transactionResponse = await createWithdrawal(transactionPayload);
      if (!transactionResponse?.ok) {
        throw new Error(transactionResponse?.error || 'Error creando transacción');
      }

      console.log('[StepConfirm] ✅ Transacción creada en DB:', orderId);

      // B. Crear Payment Order en Vita con metadata del beneficiario
      const orderPayload = {
        amount: currentQuote.clpAmount || currentQuote.amount, // ✅ Para flujos manuales (BOB), enviamos el equivalente en CLP
        country: originCountry || 'CL',
        orderId: orderId,
        metadata: {
          transaction_id: orderId,
          beneficiary: {
            type: beneficiary.beneficiary_type || 'person',
            first_name: beneficiary.beneficiary_first_name,
            last_name: beneficiary.beneficiary_last_name,
            email: beneficiary.beneficiary_email,
            document_type: beneficiary.beneficiary_document_type,
            document_number: beneficiary.beneficiary_document_number,
            account_type_bank: beneficiary.account_type_bank || 'savings',
            account_bank: beneficiary.account_bank,
            bank_code: beneficiary.bank_code
          },
          destination: {
            country: destCountry,
            currency: safeDestCurrency,
            amount: currentQuote.amountToReceive
          }
        }
      };

      console.log('[StepConfirm] Creando Payment Order en Vita...');
      const po = await createPaymentOrder(orderPayload);
      if (!po?.ok) throw new Error(po?.error || 'Error creando orden de pago');

      const vitaOrderId = po?.data?.id || po?.raw?.id || po?.raw?.data?.id;
      console.log('[StepConfirm] ✅ Payment Order creado:', vitaOrderId);

      // C. Actualizar Transaction con vitaPaymentOrderId
      // (Esto se podría hacer en el backend, pero lo hacemos aquí por simplicidad)
      // En producción, considera mover esto al backend

      // D. Determinar si el método soporta DirectPay o requiere Redirect
      const checkoutUrl = extractCheckoutUrlFromPaymentOrderResponse(po);

      console.log('[StepConfirm] Payment method:', paymentMethod);
      console.log('[StepConfirm] Selected method:', selectedDirectMethod?.name, selectedDirectMethod?.code);
      console.log('[StepConfirm] Checkout URL:', checkoutUrl);
      console.log('[StepConfirm] Vita Order ID:', vitaOrderId);

      // ⚠️ CAMBIO IMPORTANTE: Vita SIEMPRE devuelve checkout_url
      // Pero si el usuario seleccionó DirectPay (Fintoc), debemos ignorarlo
      // y usar DirectPay en su lugar

      const methodSupportsDirectPay = selectedDirectMethod?.code &&
        ['fintoc', 'pse', 'nequi', 'daviplata'].includes(selectedDirectMethod.code.toLowerCase());

      console.log('[StepConfirm] Method supports DirectPay:', methodSupportsDirectPay);
      console.log('[StepConfirm] Evaluando condición:',
        'paymentMethod:', paymentMethod,
        'methodSupportsDirectPay:', methodSupportsDirectPay,
        'Resultado:', paymentMethod === 'direct' && methodSupportsDirectPay);

      if (paymentMethod === 'direct' && methodSupportsDirectPay) {
        // PRIORIDAD 1: Usar DirectPay (ignorar checkout_url)
        console.log('[StepConfirm] ✅ Usando DirectPay (ignorando checkout_url)');
        if (!vitaOrderId) throw new Error('No se recibió ID de orden Vita');

        await maybeSaveFavorite();
        setDirectPayOrderId(vitaOrderId);
        setShowDirectPayModal(true);
        setLoading(false);
        return;
      }

      // E. Flujo Redirect (Webpay, Khipu, etc.)
      // Si hay checkout_url, SIEMPRE redirigir (incluso si seleccionó "direct")
      if (checkoutUrl) {
        console.log('[StepConfirm] ✅ Usando Redirect');
        await maybeSaveFavorite();
        console.log('[StepConfirm] Redirigiendo a:', checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No se recibió URL de pago ni método DirectPay válido');
      }

    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FLUJO MANUAL: Si la cotización es manual, mostrar ManualDeposit directamente
  // EXCEPCIÓN: Chile -> Bolivia usa flujo Vita (Alyto) aunque la tasa sea manual
  const isChileToBolivia = originCountry === 'CL' && destCountry === 'BO';

  if (!isChileToBolivia && (currentQuote?.isManual || currentQuote?.provider === 'internal_manual' || currentQuote?.feeIncludedInRate)) {
    console.log('[StepConfirm] ✅ Renderizando flujo manual (anchor) para:', safeOriginCurrency);
    return (
      <ManualDeposit
        formData={formData}
        onBack={onBack}
        onFinish={() => navigate('/transactions')}
      />
    );
  }

  // ... Renderizado igual que antes ...
  // (Mantén el return tal cual estaba, solo asegúrate de importar las dependencias arriba)
  // ...

  // Render simplificado para el ejemplo (copia el return de tu archivo anterior o mantén el tuyo)
  // Solo asegúrate de que el MODAL use DirectPayForm
  return (
    <Card className="p-4 shadow-sm border-0">
      {/* ... Parte visual del resumen ... */}
      <Card.Body>
        {/* ... */}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Formulario de Selección de Método */}
        <Form>
          <div className="mb-3">
            {paymentConfig?.direct?.enabled && directPaymentAvailable && (
              <Form.Check type="radio" label="Pago Directo (Recomendado)" name="pm"
                checked={paymentMethod === 'direct'} onChange={() => setPaymentMethod('direct')} />
            )}
            {paymentConfig?.redirect?.enabled && (
              <Form.Check type="radio" label="Pasarela Web" name="pm"
                checked={paymentMethod === 'redirect'} onChange={() => setPaymentMethod('redirect')} />
            )}
            {!paymentConfig?.direct?.enabled && !paymentConfig?.redirect?.enabled && (
              <Alert variant="warning">
                No hay métodos de pago disponibles para este país.
              </Alert>
            )}
          </div>

          {/* Campos Dinámicos de Direct Pay */}
          {paymentMethod === 'direct' && directMethods.length > 0 && (
            <div className="p-3 bg-light rounded mb-3">
              {/* Selector de Método DirectPay */}
              {directMethods.length > 1 && (
                <Form.Group className="mb-3">
                  <Form.Label>Selecciona el método de pago</Form.Label>
                  <Form.Select
                    value={directMethods.indexOf(selectedDirectMethod)}
                    onChange={(e) => setSelectedDirectMethod(directMethods[parseInt(e.target.value)])}
                  >
                    {directMethods.map((method, index) => (
                      <option key={index} value={index}>
                        {method.name} - {method.description || ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              {/* Mostrar método seleccionado */}
              {directMethods.length === 1 && (
                <h6 className="mb-3">{selectedDirectMethod?.name}</h6>
              )}

              {/* Campos requeridos del método */}
              <Row>
                {(selectedDirectMethod?.required_fields || []).map(field => (
                  <Col md={12} key={field.name}>
                    <Form.Group className="mb-2">
                      <Form.Label>{field.label}</Form.Label>
                      <Form.Control
                        type={field.type}
                        name={field.name}
                        value={directFormData[field.name] || ''}
                        onChange={handleDirectFormChange}
                        placeholder={field.placeholder}
                      />
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Form>

        <div className="d-flex justify-content-between gap-3 mt-4">
          <Button
            variant="outline-secondary"
            onClick={onBack}
            disabled={loading}
            className="flex-shrink-0"
          >
            Atrás
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-grow-1 text-white fw-bold"
            variant="primary"
          >
            {loading ? <Spinner size="sm" /> : 'Ir a Pagar'}
          </Button>
        </div>
      </Card.Body>

      <Modal show={showDirectPayModal} onHide={() => setShowDirectPayModal(false)} backdrop="static" centered>
        <Modal.Header closeButton><Modal.Title>Finalizar Pago</Modal.Title></Modal.Header>
        <Modal.Body>
          {directPayOrderId && (
            <DirectPayForm
              paymentOrderId={directPayOrderId}
              method={selectedDirectMethod}
              initialData={directFormData}
              onSuccess={() => navigate('/transactions')}
              onError={(e) => setError(e)}
            />
          )}
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default StepConfirm;