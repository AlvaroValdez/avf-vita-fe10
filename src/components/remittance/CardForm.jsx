import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getQuote, getTransactionRules } from '../../services/api';
import { formatNumberForDisplay, parseFormattedNumber, formatRate } from '../../utils/formatting';

// Lista de países de origen soportados por Vita Wallet (Pay-ins)
const ORIGIN_COUNTRIES = [
  { code: 'CL', name: 'Chile', currency: 'CLP' },
  { code: 'CO', name: 'Colombia', currency: 'COP' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'MX', name: 'México', currency: 'MXN' },
  { code: 'BR', name: 'Brasil', currency: 'BRL' },
  //{ code: 'PE', name: 'Perú', currency: 'PEN' }, // Verifica si PE tiene payin activo en tu cuenta
];

const CardForm = ({ onQuoteSuccess }) => {
  const { countries, loading: loadingCountries } = useAppContext();
  const { user } = useAuth();

  // --- NUEVO ESTADO: PAÍS DE ORIGEN ---
  const [originCountry, setOriginCountry] = useState('CL'); // Por defecto Chile
  const [originCurrency, setOriginCurrency] = useState('CLP');

  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [destCountry, setDestCountry] = useState('CO'); // Por defecto Colombia

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [minAmount, setMinAmount] = useState(5000);
  const [alertMessage, setAlertMessage] = useState('');
  const [limitError, setLimitError] = useState(false);

  // Manejar cambio de país de origen
  const handleOriginChange = (e) => {
    const code = e.target.value;
    setOriginCountry(code);
    const countryData = ORIGIN_COUNTRIES.find(c => c.code === code);
    setOriginCurrency(countryData ? countryData.currency : 'CLP');
    setQuote(null); // Resetear cotización al cambiar origen
  };

  // Cargar reglas (ahora depende del país de origen)
  useEffect(() => {
    const loadRules = async () => {
      try {
        // Obtenemos las reglas específicas para el país de origen seleccionado
        const res = await getTransactionRules(originCountry);
        if (res.ok && res.rules.length > 0) {
          const rule = res.rules[0];
          setMinAmount(rule.minAmount);
          setAlertMessage(rule.alertMessage);
        } else {
          // Valores por defecto si no hay reglas específicas
          setMinAmount(5000);
          setAlertMessage('');
        }
      } catch (e) {
        console.warn('No se pudieron cargar las reglas.', e);
      }
    };
    loadRules();
  }, [originCountry]);

  // Efecto principal: Cotización
  useEffect(() => {
    setError('');
    setLimitError(false);
    setQuote(null);

    if (amount <= 0 || !destCountry) return;

    // Validación Mínimo
    if (amount < minAmount) {
      setError(`El monto mínimo es $${formatNumberForDisplay(minAmount)} ${originCurrency}.`);
      setLimitError(true);
      return;
    }

    // Validación KYC (Límites)
    if (user) {
      const userLevel = user.kyc?.level || 1;
      // TODO: Idealmente estos límites deberían venir del backend por moneda
      // Por ahora usamos un aproximado o el valor crudo si la moneda es la misma
      const kycLimitCLP = { 1: 450000, 2: 4500000, 3: 50000000 };
      // Conversión simple o lógica de backend necesaria para multimoneda exacta
      const currentLimit = kycLimitCLP[userLevel] || 450000;

      // Nota: Esta validación es básica para CLP. Para otras monedas, 
      // el backend debería validar o deberíamos convertir el límite.
      // Si envías USD/COP, el número será diferente.
    }

    const debounceHandler = setTimeout(async () => {
      setLoading(true);
      try {
        // --- ENVIAMOS MONEDA DE ORIGEN AL BACKEND ---
        const response = await getQuote({
          amount,
          destCountry,
          origin: originCurrency // Nuevo parámetro
        });

        if (response.ok) {
          if (response.data.validations?.length > 0) {
            setError(response.data.validations.join(', '));
            setQuote(null);
          } else {
            setQuote(response.data);
          }
        } else {
          throw new Error(response.error || 'Error al cotizar.');
        }
      } catch (err) {
        setError(err.error || err.message || 'Error al cotizar.');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(debounceHandler);
  }, [amount, destCountry, originCountry, originCurrency, user, minAmount]);

  const handleAmountChange = (e) => {
    const parsedValue = parseFormattedNumber(e.target.value);
    setAmount(parsedValue);
    setDisplayAmount(e.target.value === '' ? '' : formatNumberForDisplay(parsedValue));
  };

  const handleNextStep = () => {
    if (limitError) return;
    if (!quote || error) {
      alert("Por favor, obtenga una cotización válida.");
      return;
    }
    // Pasamos el origen seleccionado al siguiente paso
    onQuoteSuccess({
      quoteData: quote,
      destCountry,
      originCountry, // <-- IMPORTANTE: Pasamos el país de origen (ej: 'CO')
      quoteTimestamp: Date.now()
    });
  };

  return (
    <Card className="p-4 shadow-lg border-0" style={{ borderRadius: '15px' }}>
      <Card.Body>
        <h4 className="mb-4 text-center fw-bold">Cotizar envío</h4>

        {alertMessage && <Alert variant="info" className="small py-2 mb-3 text-center">ℹ️ {alertMessage}</Alert>}

        <Form>
          {/* --- NUEVO SELECTOR DE ORIGEN --- */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="text-muted small">Envías desde</Form.Label>
                <Form.Select
                  value={originCountry}
                  onChange={handleOriginChange}
                  className="border-0 bg-light fw-bold"
                >
                  {ORIGIN_COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                  ))}
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
                >
                  {loadingCountries ? <option>Cargando...</option> : countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Label className="text-muted">Tú envías</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text" inputMode="numeric" placeholder="0"
                  value={displayAmount} onChange={handleAmountChange}
                  className={`border-0 bg-light py-2 ps-3 pe-0 ${error ? 'is-invalid' : ''}`}
                  style={{ minHeight: '50px', fontSize: '1.1rem' }}
                />
                {/* La moneda cambia según el origen */}
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">{originCurrency}</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col>
              <Form.Label className="text-muted">Ellos reciben</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text" readOnly placeholder="0"
                  value={quote ? formatNumberForDisplay(quote.amountOut) : '0'}
                  className="border-0 bg-light py-2 ps-3 pe-0"
                  style={{ minHeight: '50px', fontSize: '1.1rem' }}
                />
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">{quote ? quote.destCurrency : '---'}</InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>

          {loading && <div className="text-center my-2 text-muted small"><Spinner animation="border" size="sm" className="me-2" />Calculando...</div>}

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