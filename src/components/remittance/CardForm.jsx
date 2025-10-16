import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, ListGroup, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import { getQuote } from '../../services/api';
import { formatNumberForDisplay, parseFormattedNumber, formatRate } from '../../utils/formatting';

const CardForm = ({ onQuoteSuccess }) => {
  const { countries, loading: loadingCountries } = useAppContext();
  const [amount, setAmount] = useState(0);
  const [displayAmount, setDisplayAmount] = useState('');
  const [destCountry, setDestCountry] = useState('CO');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (amount <= 0 || !destCountry) {
      setQuote(null);
      setError('');
      return;
    }

    const debounceHandler = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getQuote({ amount, destCountry });
        if (response.ok) {
          if (response.data.validations?.length > 0) {
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

  const handleAmountChange = (e) => {
    const parsedValue = parseFormattedNumber(e.target.value);
    setAmount(parsedValue);
    setDisplayAmount(e.target.value === '' ? '' : formatNumberForDisplay(parsedValue));
  };

  const handleNextStep = () => {
    if (!quote || error) {
      alert("Por favor, obtenga una cotización válida antes de continuar.");
      return;
    }
    // Al continuar, pasamos la cotización y la marca de tiempo actual
    onQuoteSuccess({ quoteData: quote, destCountry, quoteTimestamp: Date.now() });
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