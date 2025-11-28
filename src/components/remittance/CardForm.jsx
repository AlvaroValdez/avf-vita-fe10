import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getQuote, getTransactionRules } from '../../services/api';
import { formatNumberForDisplay, parseFormattedNumber, formatRate } from '../../utils/formatting';

const CardForm = ({ onQuoteSuccess }) => {
  const { countries, loading: loadingCountries } = useAppContext();
  const { user } = useAuth();

  // Estados del formulario
  const [amount, setAmount] = useState(0); // Valor numérico puro para cálculos
  const [displayAmount, setDisplayAmount] = useState(''); // Valor formateado para el input
  const [destCountry, setDestCountry] = useState('CO');

  // Estados de datos y UI
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados de Reglas y Límites
  const [minAmount, setMinAmount] = useState(5000); // Valor por defecto seguro
  const [alertMessage, setAlertMessage] = useState('');
  const [limitError, setLimitError] = useState(false);

  // 1. Cargar reglas de transacción al montar o cambiar país
  useEffect(() => {
    const loadRules = async () => {
      try {
        // Asumimos origen CL por ahora. En el futuro esto podría ser dinámico.
        const res = await getTransactionRules('CL');
        if (res.ok && res.rules.length > 0) {
          const rule = res.rules[0];
          setMinAmount(rule.minAmount);
          setAlertMessage(rule.alertMessage);
        }
      } catch (e) {
        console.warn('No se pudieron cargar las reglas de transacción.', e);
      }
    };
    loadRules();
  }, []); // Podríamos añadir [originCountry] si fuera dinámico

  // 2. Efecto principal: Validación y Cotización (Debounce)
  useEffect(() => {
    // Resetear errores al cambiar inputs
    setError('');
    setLimitError(false);
    setQuote(null);

    // Validaciones inmediatas
    if (amount <= 0 || !destCountry) return;

    // Validación de Monto Mínimo (Regla de Negocio)
    if (amount < minAmount) {
      setError(`El monto mínimo de envío es $${formatNumberForDisplay(minAmount)} CLP.`);
      setLimitError(true); // Bloqueante pero no es error de KYC
      return;
    }

    // Validación de Límites KYC (Solo si hay usuario logueado)
    if (user) {
      const userLevel = user.kyc?.level || 1;
      // Límites hardcoded como fallback o podrías traerlos de getTransactionRules también
      const kycLimits = { 1: 450000, 2: 4500000, 3: 50000000 };
      const currentLimit = kycLimits[userLevel] || 450000;

      if (amount > currentLimit) {
        setError(`El monto excede tu límite de Nivel ${userLevel} ($${formatNumberForDisplay(currentLimit)} CLP).`);
        setLimitError(true); // Bloqueante por KYC
        return;
      }
    }

    // Si pasa las validaciones locales, iniciamos el debounce para la API
    const debounceHandler = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await getQuote({ amount, destCountry });
        if (response.ok) {
          if (response.data.validations?.length > 0) {
            setError(response.data.validations.join(', '));
            setQuote(null);
          } else {
            setQuote(response.data);
          }
        } else {
          throw new Error(response.error || 'Error al obtener cotización.');
        }
      } catch (err) {
        setError(err.error || err.message || 'No se pudo obtener la cotización.');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    }, 800); // Espera 800ms de inactividad

    return () => clearTimeout(debounceHandler);
  }, [amount, destCountry, user, minAmount]);

  // Manejador del input de monto
  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const parsedValue = parseFormattedNumber(rawValue);
    setAmount(parsedValue);
    setDisplayAmount(rawValue === '' ? '' : formatNumberForDisplay(parsedValue));
  };

  const handleNextStep = () => {
    if (limitError) return;
    if (!quote || error) {
      alert("Por favor, obtenga una cotización válida antes de continuar.");
      return;
    }
    onQuoteSuccess({ quoteData: quote, destCountry, quoteTimestamp: Date.now() });
  };

  return (
    <Card className="p-4 shadow-lg border-0" style={{ borderRadius: '15px' }}>
      <Card.Body>
        <h4 className="mb-4 text-center fw-bold">Cotizar envío</h4>

        {alertMessage && (
          <Alert variant="info" className="small py-2 mb-3 text-center">
            ℹ️ {alertMessage}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="text-muted">Enviar dinero a</Form.Label>
            <Form.Select
              value={destCountry}
              onChange={(e) => setDestCountry(e.target.value)}
              disabled={loadingCountries}
              className="border-0 bg-light py-2 px-3"
              style={{ minHeight: '50px', fontSize: '1.1rem' }}
            >
              <option value="">Selecciona un país</option>
              {loadingCountries ? <option disabled>Cargando...</option> : countries.map(country => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Label className="text-muted">Monto a enviar</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  className={`border-0 bg-light py-2 ps-3 pe-0 ${error ? 'is-invalid' : ''}`}
                  style={{ minHeight: '50px', fontSize: '1.1rem' }}
                />
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">CLP</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col>
              <Form.Label className="text-muted">Monto a recibir</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  readOnly
                  placeholder="Calculado"
                  value={quote ? formatNumberForDisplay(quote.amountOut) : '0'}
                  className="border-0 bg-light py-2 ps-3 pe-0"
                  style={{ minHeight: '50px', fontSize: '1.1rem' }}
                />
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">{quote ? quote.destCurrency : '---'}</InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>

          {loading && (
            <div className="text-center my-2 text-muted small">
              <Spinner animation="border" size="sm" className="me-2" />
              Calculando mejor tasa...
            </div>
          )}

          {quote && !loading && !error && (
            <div className="mt-3 p-3 bg-light rounded" style={{ fontSize: '0.9rem' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Tasa de cambio:</span>
                <span className="fw-bold">1 {quote.destCurrency} = {formatRate(1 / quote.rateWithMarkup)} {quote.origin}</span>
              </div>

              <hr className="my-2" />

              <div className="d-flex justify-content-between fw-bold fs-6" style={{ color: 'var(--avf-primary)' }}>
                <span>Total a pagar:</span>
                <span>{formatNumberForDisplay(quote.amountIn)} {quote.origin} *</span>
              </div>
            </div>
          )}

          {error && <Alert variant="danger" className="text-center small py-2 mt-3">{error}</Alert>}

          {/* Link para subir de nivel si el error es por límite de KYC */}
          {limitError && user && error.includes('límite') && (
            <div className="text-center mt-2">
              <Link to="/profile" className="text-decoration-none fw-bold" style={{ color: 'var(--avf-secondary)' }}>
                Aumentar mis límites &rarr;
              </Link>
            </div>
          )}

          <div className="d-grid mt-4">
            <Button
              onClick={handleNextStep}
              disabled={!quote || loading || !!error}
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)', color: 'white', borderRadius: '10px' }}
              className="py-3 fw-bold fs-6"
            >
              {loading ? 'Calculando...' : 'Continuar'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CardForm;