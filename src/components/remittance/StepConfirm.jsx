import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { createWithdrawal, createPaymentOrder } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000; // 2 minutos

const StepConfirm = ({ formData, fields, onBack }) => {
  const { quoteData, beneficiary, destCountry, quoteTimestamp } = formData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  
  // Estados para el temporizador
  const [remainingTime, setRemainingTime] = useState(QUOTE_VALIDITY_DURATION);
  const [isExpired, setIsExpired] = useState(false);

  // Efecto para el contador regresivo
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

  const handleConfirm = async () => { /* ... (código sin cambios) */ };
  const getFieldDetails = (key) => { /* ... (código sin cambios) */ };
  const getDisplayValue = (field, value) => { /* ... (código sin cambios) */ };

  // --- RENDERIZADO DEL COMPONENTE ---

  if (transactionResult) { /* ... (código sin cambios) */ }

  if (isExpired) {
    return (
      <Card className="p-4 text-center">
        <Card.Body>
          <Alert variant="danger">
            <Alert.Heading>¡Tu cotización ha expirado!</Alert.Heading>
            <p>Para asegurar la mejor tasa de cambio, las cotizaciones son válidas por un tiempo limitado. Por favor, vuelve al inicio para cotizar nuevamente.</p>
          </Alert>
          <Button variant="outline-primary" onClick={onBack}>
            Volver
          </Button>
        </Card.Body>
      </Card>
    );
  }

  if (!quoteData || !beneficiary) { /* ... (código sin cambios) */ }
  
  const fullName = `${beneficiary.beneficiary_first_name || ''} ${beneficiary.beneficiary_last_name || ''}`.trim();

  return (
    <Card className="p-4">
      <Card.Body>
        <h4 className="mb-4">Resumen de la transacción</h4>
        {/* ... (código del resumen de la transacción sin cambios) ... */}

        {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

        <div className="d-flex justify-content-between mt-4">
          <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
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