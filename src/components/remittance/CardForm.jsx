import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { getQuote } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';

const CardForm = ({ onNext }) => {
  const { countries, loading: loadingCountries, error: countriesError } = useAppContext();
  const [destCountry, setDestCountry] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Efecto para obtener la cotización cuando cambian los campos relevantes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!destCountry || amountIn <= 0) {
        setQuoteData(null);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await getQuote({ amount: amountIn, destCountry });
        if (response.ok) {
          setQuoteData(response.data);
          if (response.data.validations && response.data.validations.length > 0) {
            setError(response.data.validations.join(', '));
          }
        } else {
          setError(response.error || 'Error al obtener la cotización.');
        }
      } catch (err) {
        setError('Error de red o servidor al cotizar.');
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
      fetchQuote();
    }, 500); // Debounce para evitar llamadas excesivas a la API

    return () => {
      clearTimeout(handler);
    };
  }, [destCountry, amountIn]);

  const handleNext = () => {
    if (quoteData && !error) {
      onNext({ destCountry, amountIn, quoteData });
    } else if (!destCountry || amountIn <= 0) {
      setError('Por favor, selecciona un país y un monto para cotizar.');
    } else if (error) {
      setError('Por favor, corrige los errores antes de continuar.');
    }
  };

  const currentOriginCurrency = 'CLP'; // Fijo por ahora
  const currentDestCurrency = quoteData?.destCurrency || '???';

  return (
    <Card className="p-4 shadow-lg border-0" style={{ borderRadius: '15px' }}> {/* Sombra y bordes redondeados */}
      <Card.Body>
        <h4 className="mb-4 text-center fw-bold">Cotizar envío</h4> {/* Título centrado y en negrita */}
        <Form>
          {/* Campo País Destino */}
          <Form.Group className="mb-3">
            <Form.Label className="text-muted">Enviar dinero a</Form.Label> {/* Etiqueta más sutil */}
            <Form.Select 
              value={destCountry} 
              onChange={(e) => setDestCountry(e.target.value)} 
              disabled={loadingCountries}
              className="border-0 bg-light py-2 px-3" // Sin borde, fondo ligero, padding
              style={{ minHeight: '50px', fontSize: '1.1rem' }} // Altura y tamaño de fuente
            >
              <option value="">Selecciona un país</option>
              {loadingCountries ? (
                <option disabled>Cargando países...</option>
              ) : (
                countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>

          {/* Monto a enviar / Monto a recibir */}
          <Row className="mb-3">
            <Col>
              <Form.Label className="text-muted">Monto a enviar</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  placeholder="0"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  className="border-0 bg-light py-2 ps-3 pe-0"
                  style={{ minHeight: '50px', fontSize: '1.1rem' }}
                />
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">{currentOriginCurrency}</InputGroup.Text>
              </InputGroup>
            </Col>
            <Col>
              <Form.Label className="text-muted">Monto a recibir</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  readOnly
                  value={quoteData?.amountOut ? formatNumberForDisplay(quoteData.amountOut) : '0'}
                  className="border-0 bg-light py-2 ps-3 pe-0"
                  style={{ minHeight: '50px', fontSize: '1.1rem' }}
                />
                <InputGroup.Text className="bg-light border-0 fw-bold fs-6">{currentDestCurrency}</InputGroup.Text>
              </InputGroup>
            </Col>
          </Row>

          {/* Detalles de la Cotización */}
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
                <hr className="my-2" /> {/* Línea separadora */}
                <div className="d-flex justify-content-between fw-bold fs-6" style={{ color: 'var(--avf-primary)' }}>
                  <span>Total a pagar:</span>
                  <span>{formatNumberForDisplay(quote.amountIn)} {quote.origin} *</span>
                </div>
              </div>
            </>
          )}

          {error && <Alert variant="danger" className="mt-4 text-center">{error}</Alert>}

          <div className="d-grid mt-4">
            <Button 
              variant="warning" 
              onClick={handleNext} 
              disabled={loading || !quoteData || !!error}
              className="py-3 fw-bold" // Mayor padding y negrita
              style={{ 
                backgroundColor: 'var(--avf-secondary)', 
                borderColor: 'var(--avf-secondary)', 
                color: 'white', 
                fontSize: '1.2rem',
                borderRadius: '10px' // Bordes más redondeados
              }}
            >
              {loading ? <Spinner as="span" size="sm" /> : 'Continuar'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CardForm;