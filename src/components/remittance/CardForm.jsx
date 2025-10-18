import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, ListGroup, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import { getQuote } from '../../services/api';
import { formatNumberForDisplay, parseFormattedNumber, formatRate } from '../../utils/formatting';

// Duración de la validez de la cotización en milisegundos (ej: 2 minutos)
const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000;

const CardForm = ({ onQuoteSuccess }) => {
  const { countries, loading: loadingCountries } = useAppContext();
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState(''); // Estado para mostrar el monto formateado
  const [destCountry, setDestCountry] = useState('CO');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [quoteTimestamp, setQuoteTimestamp] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);

  const fetchQuote = async () => {
    if (amount <= 0 || !destCountry) return;

    setLoading(true);
    setError('');
    setQuote(null);
    setQuoteTimestamp(null);
    setRemainingTime(null);

    try {
      const response = await getQuote({ amount, destCountry });
      if (response.ok) {
        if (response.data.validations && response.data.validations.length > 0) {
          setError(response.data.validations.join(', '));
        } else {
          setQuote(response.data);
          setQuoteTimestamp(Date.now()); // Inicia el temporizador
        }
      }
    } catch (err) {
      setError(err.error || 'No se pudo obtener la cotización.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quoteTimestamp) return;

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - quoteTimestamp;
      const timeLeft = QUOTE_VALIDITY_DURATION - elapsedTime;

      if (timeLeft <= 0) {
        clearInterval(interval);
        setRemainingTime(0);
        setError('La cotización ha expirado.');
        setQuote(null);
        setQuoteTimestamp(null);
      } else {
        setRemainingTime(timeLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quoteTimestamp]);

  useEffect(() => {
    const debounceHandler = setTimeout(() => {
      if (amount > 0 && destCountry) {
        fetchQuote();
      }
    }, 800);
    return () => clearTimeout(debounceHandler);
  }, [amount, destCountry]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    // Permite al usuario escribir, pero actualiza el estado numérico sin puntos
    const parsedValue = parseFormattedNumber(rawValue);
    setAmount(parsedValue);
    // Actualiza el estado de visualización con el formato de miles
    setDisplayAmount(rawValue === '' ? '' : formatNumberForDisplay(parsedValue));
  };

  const handleNextStep = () => {
    if (!quote || error) {
      alert("Por favor, obtenga una cotización válida y vigente antes de continuar.");
      return;
    }
    onQuoteSuccess({ quoteData: quote, destCountry, quoteTimestamp: Date.now() });
  };

  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <Card className="p-4 shadow-lg border-0" style={{ borderRadius: '15px' }}>
      <Card.Body>
        <h4 className="mb-4 text-center fw-bold">Cotizar envío</h4>
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
                {/* --- INPUT CON FORMATO DE MILES --- */}
                <Form.Control
                  type="text" // Cambiado a text para permitir el formato
                  inputMode="numeric" // Ayuda a teclados móviles
                  placeholder="0"
                  value={displayAmount} // Muestra el valor formateado
                  onChange={handleAmountChange}
                  className="border-0 bg-light py-2 ps-3 pe-0"
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

          {loading && <div className="text-center my-2"><Spinner size="sm" /> Cotizando...</div>}
          
          {quote && (
            <>
              {/* --- SECCIÓN DE DETALLES CON ESTILO ARMONIZADO --- */}
              <div className="mt-3 p-3 bg-light rounded" style={{ fontSize: '0.9rem' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Tasa de cambio (Vita):</span>
                  <span>1 {quote.destCurrency} = {formatRate(1 / quote.baseRate)} {quote.origin}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Comisión AVF:</span>
                  <span>{quote.markupPercent}%</span>
                </div>
                <div className="d-flex justify-content-between fw-bold">
                  <span>Nuestra Tasa (Tasa Final):</span>
                  <span>1 {quote.destCurrency} = {formatRate(1 / quote.rateWithMarkup)} {quote.origin}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between fw-bold fs-6" style={{ color: 'var(--avf-primary)' }}>
                  <span>Total a pagar:</span>
                  <span>{formatNumberForDisplay(quote.amountIn)} {quote.origin} *</span>
                </div>
              </div>
            </>
          )}

          {error && <Alert variant="danger" className="text-center small py-2 mt-3">{error}</Alert>}
          
          {quote && remainingTime > 0 && (
            <div className="text-center text-muted small mt-2">
              Cotización válida por: <strong style={{ color: remainingTime < 60000 ? '#dc3545' : 'inherit' }}>{formatTime(remainingTime)}</strong>
            </div>
          )}

          <div className="d-grid mt-4">
            {remainingTime === 0 && error ? (
              <Button 
                onClick={fetchQuote} 
                variant="outline-primary"
                style={{ color: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
              >
                Actualizar Cotización
              </Button>
            ) : (
              <Button 
                onClick={handleNextStep} 
                disabled={!quote || loading}
                style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)', color: 'white', borderRadius: '10px' }}
                className="py-3 fw-bold fs-6" // Ajustado para un botón más estándar
              >
                Continuar
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CardForm;