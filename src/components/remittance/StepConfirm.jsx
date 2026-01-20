// frontend/src/components/remittance/StepConfirm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import {
  createWithdrawal,
  getQuote,
  saveBeneficiary,
  uploadImage
} from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';
import ManualDeposit from './ManualDeposit';

const QUOTE_VALIDITY_DURATION = 1.5 * 60 * 1000;

const COUNTRY_TO_CURRENCY = {
  CL: 'CLP', CO: 'COP', AR: 'ARS', MX: 'MXN', BR: 'BRL', PE: 'PEN', BO: 'BOB', US: 'USD'
};

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

  // Refrescar Quote
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

  // Timer Expiración
  useEffect(() => {
    if (loadingQuote) return;
    const timer = setTimeout(() => setIsExpired(true), QUOTE_VALIDITY_DURATION);
    return () => clearTimeout(timer);
  }, [loadingQuote]);

  async function maybeSaveFavorite() {
    if (!saveAsFavorite) return;
    try {
      await saveBeneficiary(beneficiary);
      console.log('[StepConfirm] Beneficiario guardado como favorito');
    } catch (err) {
      console.error('Error guardando favorito:', err);
    }
  }

  // CONFIRMAR Y PAGAR - FLUJO SIMPLIFICADO FINTOC
  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
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
        }
      }

      // 1. Crear transacción - El backend se encarga de TODO
      // - Valida saldo (si está habilitado)
      // - Crea Fintoc Widget Link
      // - Prepara withdrawal diferido
      const orderId = `ORD-${Date.now()}`;

      console.log('[StepConfirm] Creando transacción con Fintoc...');
      console.log('[StepConfirm] Current Quote:', currentQuote);

      const transactionPayload = {
        order: orderId,
        country: destCountry,
        currency: safeOriginCurrency,
        amount: currentQuote.amount,
        fee: currentQuote.fee || 0,
        feePercent: currentQuote.feePercent || 0,
        feeOriginAmount: currentQuote.feeOriginAmount || 0,
        ...beneficiary,
        // Eliminamos el archivo del payload
        beneficiaryQrFile: undefined,
        beneficiaryQrContent: undefined,
        purpose: formData.purpose || 'EPFAMT',
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

      // ✅ El backend ahora retorna directamente el checkoutUrl de Fintoc
      const response = await createWithdrawal(transactionPayload);

      console.log('[StepConfirm] Respuesta del backend:', response);

      if (!response?.ok) {
        // Manejar error de tesorería (saldo insuficiente)
        if (response?.code === 'INSUFFICIENT_TREASURY_FUNDS') {
          throw new Error(
            `No hay fondos suficientes en tesorería. ` +
            `Requerido: $${response.details?.required?.toLocaleString()} CLP, ` +
            `Disponible: $${response.details?.available?.toLocaleString()} CLP. ` +
            `La transacción quedó en espera.`
          );
        }
        throw new Error(response?.error || 'Error creando transacción');
      }

      // 2. Obtener URL del widget de Fintoc
      const checkoutUrl = response?.data?.checkoutUrl;
      const fintocPaymentIntentId = response?.data?.fintocPaymentIntentId;

      console.log('[StepConfirm] ✅ Transacción creada:', orderId);
      console.log('[StepConfirm] Fintoc Payment Intent:', fintocPaymentIntentId);
      console.log('[StepConfirm] Checkout URL:', checkoutUrl);

      if (!checkoutUrl) {
        throw new Error('No se recibió URL de pago del backend');
      }

      // 3. Guardar favorito si aplica
      await maybeSaveFavorite();

      // 4. Redirigir al widget de Fintoc
      console.log('[StepConfirm] Redirigiendo a Fintoc Widget...');
      window.location.href = checkoutUrl;

    } catch (err) {
      console.error('[StepConfirm] Error:', err);
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

  return (
    <Card className="p-4 shadow-sm border-0">
      <Card.Body>
        {/* Resumen de la transacción */}
        <h5 className="mb-4">📋 Confirmar Envío</h5>

        {loadingQuote && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" /> Actualizando cotización...
          </div>
        )}

        {isExpired && (
          <Alert variant="warning">
            ⚠️ La cotización ha expirado. Por favor, regresa y solicita una nueva.
          </Alert>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Información sobre el método de pago */}
        <Alert variant="info" className="mb-3">
          <small>
            <strong>💳 Pago seguro con Fintoc</strong><br />
            Serás redirigido a nuestra pasarela de pago segura para completar la transacción.
          </small>
        </Alert>

        {/* Checkbox favorito */}
        {!isFromFavorite && (
          <Form.Check
            type="checkbox"
            label="💾 Guardar beneficiario como favorito"
            checked={saveAsFavorite}
            onChange={(e) => setSaveAsFavorite(e.target.checked)}
            className="mb-3"
          />
        )}

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
            disabled={loading || isExpired}
            className="flex-grow-1 text-white fw-bold"
            variant="primary"
          >
            {loading ? <Spinner size="sm" /> : 'Ir a Pagar'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StepConfirm;