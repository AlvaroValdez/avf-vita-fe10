import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, ListGroup, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import { getQuote } from '../../services/api';
import { formatNumberForDisplay, parseFormattedNumber, formatRate } from '../../utils/formatting';

// Duración de la validez de la cotización en milisegundos (ej: 2 minutos)
// Lo reducimos para ser más conservadores y evitar el error.
const QUOTE_VALIDITY_DURATION = 2 * 60 * 1000;

const CardForm = ({ onQuoteSuccess }) => {
  const { countries, loading: loadingCountries } = useAppContext();
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [destCountry, setDestCountry] = useState('CO');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para gestionar el temporizador de expiración
  const [quoteTimestamp, setQuoteTimestamp] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);

  // Efecto para obtener la cotización
  useEffect(() => {
    if (amount <= 0 || !destCountry) {
        setQuote(null);
        return;
    }
  
    const debounceHandler = setTimeout(async () => {
        setLoading(true);
        setError('');  
        try {
            const response = await getQuote({ amount, destCountry });
            if (response.ok) {
                if (response.data.validations && response.data.validations.length > 0) {
                    setError(response.data.validations.join(', '));
                    setQuote(null);
                } else {
                    setQuote(response.data);
                }
            }
        } catch (err) {
            setError(err.error || 'No se pudo obtener la cotización.');
            setQuote(null);
        } finally {
            setLoading(false);
        }
    }, 800);
  
    return () => clearTimeout(debounceHandler);
  }, [amount, destCountry]);
  
  const handleNextStep = () => {
    if (!quote || error) {
        alert("Por favor, obtenga una cotización válida y vigente antes de continuar.");
        return;
    }
    onQuoteSuccess({ quoteData: quote, destCountry });
  };

  const handleAmountChange = (e) => {
    const parsedValue = parseFormattedNumber(e.target.value);
    setAmount(parsedValue);
    setDisplayAmount(e.target.value === '' ? '' : formatNumberForDisplay(parsedValue));
  };
  
  const formatTime = (ms) => {
    if (ms === null || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <Card className="p-4">
      <Card.Body>
        <Card.Title as="h5" className="mb-4">Cotizar envío</Card.Title>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Enviar dinero a</Form.Label>
            <Form.Select value={destCountry} onChange={(e) => setDestCountry(e.target.value)} disabled={loadingCountries}>
              {loadingCountries ? <option>Cargando países...</option> : countries.map(country => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Monto a enviar</Form.Label>
                <InputGroup>
                  <Form.Control type="text" inputMode="numeric" placeholder="50.000" value={displayAmount} onChange={handleAmountChange} />
                  <InputGroup.Text>CLP</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Monto a recibir</Form.Label>
                <InputGroup>
                  <Form.Control type="text" readOnly placeholder="Calculado" value={quote ? formatNumberForDisplay(quote.amountOut) : ''} />
                  <InputGroup.Text>{quote ? quote.destCurrency : '---'}</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>

          {loading && <div className="text-center my-2"><Spinner size="sm" /> Cotizando...</div>}
          
          {quote && (
            <>
              <ListGroup variant="flush" className="my-3 small">
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span>Tasa de cambio (Vita):</span>
                  <span>1 {quote.destCurrency} = {formatRate(1 / quote.baseRate)} {quote.origin}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0">
                  <span>Comisión AVF:</span>
                  <span>{quote.markupPercent}%</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0 fw-bold">
                  <span>Nuestra Tasa (Tasa Final):</span>
                  <span>1 {quote.destCurrency} = {formatRate(1 / quote.rateWithMarkup)} {quote.origin}</span>
                </ListGroup.Item>
              </ListGroup>
              <p className="fw-bold mt-2">Total a pagar: {formatNumberForDisplay(quote.amountIn)} {quote.origin} *</p>
            </>
          )}

          {error && <Alert variant="danger" className="text-center small py-2 mt-3">{error}</Alert>}
          
          {quote && remainingTime > 0 && (
            <div className="text-center text-muted small mt-2">
              Cotización válida por: <strong style={{ color: remainingTime < 60000 ? '#dc3545' : 'inherit' }}>{formatTime(remainingTime)}</strong>
            </div>
          )}

          <div className="d-grid mt-4">
            <Button 
              onClick={handleNextStep} 
              disabled={!quote || loading}
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
            >
              Continuar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CardForm;