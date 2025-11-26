import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col, InputGroup, Button, Spinner, Alert } from 'react-bootstrap';
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

  // Efecto para obtener la cotización (SIN lógica de temporizador)
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
    onQuoteSuccess({ quoteData: quote, destCountry, quoteTimestamp: Date.now() });
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
                <Form.Control
                  type="text" 
                  inputMode="numeric"
                  placeholder="0"
                  value={displayAmount} 
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
            <div className="mt-3 p-3 bg-light rounded" style={{ fontSize: '0.9rem' }}>
              {/* --- SOLO MOSTRAMOS LA TASA FINAL Y EL TOTAL --- */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted">Tasa de cambio:</span>
                {/* Usamos rateWithMarkup que ya incluye tu ganancia */}
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
              disabled={!quote || loading}
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)', color: 'white', borderRadius: '10px' }}
              className="py-3 fw-bold fs-6"
            >
              {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                    Cotizando...
                  </>
                ) : (
                  'Continuar'
                )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CardForm;