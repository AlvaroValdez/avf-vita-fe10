import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getQuote, getTransactionRules, getEnabledOrigins } from '../../services/api';
import { formatNumberForDisplay, parseFormattedNumber, formatRate } from '../../utils/formatting';

const CardForm = ({ onQuoteSuccess }) => {
  const { countries, loading: loadingCountries } = useAppContext();
  const { user } = useAuth();

  // --- Origin States ---
  const [originCountries, setOriginCountries] = useState([]);
  const [loadingOrigins, setLoadingOrigins] = useState(true);
  const [originCountry, setOriginCountry] = useState('CL'); // Default origin
  const [originCurrency, setOriginCurrency] = useState('CLP');

  // Form States
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [destCountry, setDestCountry] = useState('CO');

  // Data & UI States
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Rules & Limits States
  const [minAmount, setMinAmount] = useState(5000);
  const [alertMessage, setAlertMessage] = useState('');
  const [limitError, setLimitError] = useState(false);

  // 1. Load Enabled Origin Countries
  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        const res = await getEnabledOrigins();
        if (res.ok) {
          // --- CORRECCIÓN: Siempre actualizamos el estado, incluso si está vacío ---
          setOriginCountries(res.origins);

          // Verificamos si el país seleccionado actualmente (por defecto 'CL') sigue activo
          const currentIsActive = res.origins.find(o => o.code === originCountry);

          if (!currentIsActive) {
            // Si no está activo, intentamos seleccionar el primero de la lista
            if (res.origins.length > 0) {
              setOriginCountry(res.origins[0].code);
              setOriginCurrency(res.origins[0].currency);
            } else {
              // Si no hay ningún país activo, limpiamos la selección
              setOriginCountry('');
              setOriginCurrency('');
            }
          }
        }
      } catch (e) {
        console.error('Error cargando países de origen:', e);
        // Solo usamos fallback si hay un error de red real, no si la lista viene vacía
        // setOriginCountries([{ code: 'CL', name: 'Chile', currency: 'CLP' }]); 
      } finally {
        setLoadingOrigins(false);
      }
    };
    fetchOrigins();
  }, []); // Se ejecuta al montar

  // 2. Load Transaction Rules when Origin Changes
  useEffect(() => {
    const loadRules = async () => {
      try {
        const res = await getTransactionRules(originCountry);
        if (res.ok && res.rules.length > 0) {
          const rule = res.rules[0];
          setMinAmount(rule.minAmount);
          setAlertMessage(rule.alertMessage);
        } else {
          setMinAmount(5000);
          setAlertMessage('');
        }
      } catch (e) {
        console.warn('Could not load transaction rules.', e);
      }
    };
    if (originCountry) loadRules();
  }, [originCountry]);

  // 3. Handle Origin Change
  const handleOriginChange = (e) => {
    const code = e.target.value;
    setOriginCountry(code);
    const selected = originCountries.find(c => c.code === code);
    if (selected) setOriginCurrency(selected.currency);
    setQuote(null);
    setError('');
  };

  // 4. Main Effect: Validation & Quote Fetching
  useEffect(() => {
    setError('');
    setLimitError(false);
    setQuote(null);

    if (amount <= 0 || !destCountry) return;

    // Min Amount Validation
    if (amount < minAmount) {
      setError(`El monto mínimo es $${formatNumberForDisplay(minAmount)} ${originCurrency}.`);
      setLimitError(true);
      return;
    }

    // KYC Limit Validation
    if (user) {
      const userLevel = user.kyc?.level || 1;
      // TODO: Fetch limits from backend based on currency
      const kycLimitsCLP = { 1: 450000, 2: 4500000, 3: 50000000 };
      let currentLimit = kycLimitsCLP[userLevel] || 450000;

      // Simple approximation for non-CLP currencies (for UX only, backend validates strictly)
      if (originCurrency !== 'CLP') {
        if (originCurrency === 'USD') currentLimit = currentLimit / 900;
        // Add logic for other currencies as needed
      }

      if (amount > currentLimit) {
        setError(`El monto excede tu límite de Nivel ${userLevel} ($${formatNumberForDisplay(currentLimit)} ${originCurrency}).`);
        setLimitError(true);
        return;
      }
    }

    const debounceHandler = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await getQuote({
          amount,
          destCountry,
          origin: originCurrency
        });

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
    }, 800);

    return () => clearTimeout(debounceHandler);
  }, [amount, destCountry, originCountry, originCurrency, user, minAmount]);

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
    onQuoteSuccess({
      quoteData: quote,
      destCountry,
      originCountry,
      quoteTimestamp: Date.now()
    });
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
          {/* Country Selection Row */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="text-muted small">Envías desde</Form.Label>
                <Form.Select
                  value={originCountry}
                  onChange={handleOriginChange}
                  disabled={loadingOrigins || originCountries.length === 0} // Deshabilitar si no hay opciones
                  className="border-0 bg-light fw-bold"
                  style={{ minHeight: '50px', fontSize: '1.0rem' }}
                >
                  {loadingOrigins ? (
                    <option>Cargando...</option>
                  ) : originCountries.length === 0 ? (
                    <option value="">No disponible</option> // Mensaje si todo está desactivado
                  ) : (
                    originCountries.map(c => (
                      <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                    ))
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="text-muted small">Reciben en</Form.Label>
                <Form.Select
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  disabled={loadingCountries}
                  className="border-0 bg-light fw-bold"
                  style={{ minHeight: '50px', fontSize: '1.0rem' }}
                >
                  {loadingCountries ? <option>Cargando...</option> : countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Amount Inputs Row */}
          <Row className="mb-3">
            <Col>
              <Form.Label className="text-muted">Tú envías</Form.Label>
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
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">{originCurrency}</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col>
              <Form.Label className="text-muted">Ellos reciben</Form.Label>
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

          {/* Upgrade Link if Limit Error */}
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
              {loading ? 'Cotizando...' : 'Continuar'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CardForm;