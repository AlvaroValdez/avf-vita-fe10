import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, Table } from 'react-bootstrap';
import { getMarkup, updateMarkup, getMarkupPairs, updateMarkupPair } from '../services/api';
import { useAppContext } from '../context/AppContext';
import VitaRatesMarquee from '../components/admin/VitaRatesMarquee';

const AdminMarkup = () => {
  const { countries, loading: loadingCountries } = useAppContext(); // Obtenemos la lista de países
  const [defaultMarkup, setDefaultMarkup] = useState('');
  const [pairs, setPairs] = useState([]);
  const [loadingDefault, setLoadingDefault] = useState(true);
  const [loadingPairs, setLoadingPairs] = useState(true);
  const [savingDefault, setSavingDefault] = useState(false);
  const [savingPair, setSavingPair] = useState(false);
  const [error, setError] = useState('');
  const [successDefault, setSuccessDefault] = useState('');
  const [successPair, setSuccessPair] = useState('');

  const [newOrigin, setNewOrigin] = useState('CLP');
  const [newDest, setNewDest] = useState('');
  const [newPercent, setNewPercent] = useState('');

  // --- NUEVA FUNCIÓN HELPER ---
  // Busca el nombre del país en la lista del contexto usando su código ISO
  const getCountryNameByCode = (code) => {
    const country = countries.find(c => c.code.toUpperCase() === code.toUpperCase());
    return country ? country.name : code; // Devuelve el nombre o el código si no se encuentra
  };

  // Carga inicial de datos (separada para mejor manejo de errores)
  useEffect(() => {
    const loadDefaultMarkup = async () => {
      try {
        setLoadingDefault(true);
        const res = await getMarkup();
        if (res.ok) setDefaultMarkup(res.markup);
        else throw new Error(res.error || 'No se pudo cargar el markup por defecto.');
      } catch (err) {
        setError(err.message || 'Error cargando markup por defecto.');
      } finally {
        setLoadingDefault(false);
      }
    };
    const loadMarkupPairs = async () => {
      try {
        setLoadingPairs(true);
        const res = await getMarkupPairs();
        if (res.ok) setPairs(res.pairs);
        else throw new Error(res.error || 'No se pudieron cargar los pares de markup.');
      } catch (err) {
        setError(err.message || 'Error cargando pares de markup.');
      } finally {
        setLoadingPairs(false);
      }
    };

    loadDefaultMarkup();
    loadMarkupPairs();
  }, []);

  const handleDefaultSubmit = async (e) => {
    e.preventDefault();
    setSavingDefault(true); setError(''); setSuccessDefault('');
    try {
      const numericMarkup = parseFloat(defaultMarkup);
      if (isNaN(numericMarkup)) throw new Error('El valor debe ser numérico.');
      const res = await updateMarkup(numericMarkup);
      if (res.ok) setSuccessDefault(`Markup por defecto actualizado a ${res.markup}%`);
      else throw new Error(res.error || 'No se pudo actualizar.');
    } catch (err) {
      setError(err.message || 'Error al guardar.');
    } finally {
      setSavingDefault(false);
    }
  };

  const handlePairSubmit = async (e) => {
    e.preventDefault();
    setSavingPair(true); setError(''); setSuccessPair('');
    try {
      const numericPercent = parseFloat(newPercent);
      if (!newDest || isNaN(numericPercent)) {
        throw new Error('Completa todos los campos del par con valores válidos.');
      }
      const res = await updateMarkupPair({
        originCurrency: newOrigin,
        destCountry: newDest,
        percent: numericPercent
      });
      if (res.ok) {
        setPairs(res.pairs);
        setSuccessPair('Par de markup guardado correctamente.');
        setNewDest('');
        setNewPercent('');
      } else {
        throw new Error(res.error || 'No se pudo guardar el par.');
      }
    } catch (err) {
      setError(err.message || 'Error al guardar el par.');
    } finally {
      setSavingPair(false);
    }
  };

  // Muestra spinner principal si aún no se han cargado los datos iniciales
  if (loadingDefault || loadingPairs) {
    return <Container className="text-center p-5"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="my-5" style={{ maxWidth: '900px' }}>
      {/* Vita Rates Marquee - Temporalmente desactivado para debugging */}
      <VitaRatesMarquee />

      {/* Sección Markup por Defecto */}
      <Card className="mb-4">
        <Card.Header as="h4">Gestión de Comisión por Defecto</Card.Header>
        <Card.Body>
          <Form onSubmit={handleDefaultSubmit}>
            <Form.Group as={Row} className="mb-3 align-items-center">
              <Form.Label column sm={4}>Porcentaje por Defecto (%):</Form.Label>
              <Col sm={5}>
                <Form.Control
                  type="number" step="0.01" value={defaultMarkup}
                  onChange={(e) => setDefaultMarkup(e.target.value)}
                  disabled={loadingDefault} // Deshabilita mientras carga
                />
              </Col>
              <Col sm={3}>
                <Button type="submit" disabled={savingDefault || loadingDefault} style={{ backgroundColor: 'var(--avf-primary)' }}>
                  {savingDefault ? <Spinner size="sm" /> : 'Guardar'}
                </Button>
              </Col>
            </Form.Group>
            {successDefault && <Alert variant="success" className="py-2 mt-2">{successDefault}</Alert>}
            <Form.Text>Esta comisión se aplica si no existe una regla específica.</Form.Text>
          </Form>
        </Card.Body>
      </Card>

      {/* Sección Comisiones por Par */}
      <Card>
        <Card.Header as="h4">Gestión de Comisiones por Par de Divisas</Card.Header>
        <Card.Body>
          {/* Formulario para añadir/editar par */}
          <Form onSubmit={handlePairSubmit} className="mb-4 p-3 border rounded">
            <h5>Añadir / Editar Par</h5>
            <Row>
              <Col md={3}><Form.Group><Form.Label>Origen</Form.Label><Form.Control type="text" value={newOrigin} readOnly /></Form.Group></Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Destino</Form.Label>
                  <Form.Select value={newDest} onChange={(e) => setNewDest(e.target.value)} disabled={loadingCountries}>
                    <option value="">Selecciona país...</option>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}><Form.Group><Form.Label>Comisión (%)</Form.Label><Form.Control type="number" step="0.01" value={newPercent} onChange={(e) => setNewPercent(e.target.value)} /></Form.Group></Col>
              <Col md={2} className="d-flex align-items-end">
                <Button type="submit" disabled={savingPair} style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}>
                  {savingPair ? <Spinner size="sm" /> : 'Guardar Par'}
                </Button>
              </Col>
            </Row>
          </Form>

          {successPair && <Alert variant="success" className="py-2">{successPair}</Alert>}

          {/* Muestra error general si ocurrió durante la carga o guardado */}
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          {/* Tabla de pares existentes */}
          <h5>Pares Existentes</h5>
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>Origen</th>
                <th>Destino</th>
                <th>Comisión (%)</th>
              </tr>
            </thead>
            <tbody>
              {loadingPairs ? (
                <tr><td colSpan="3" className="text-center"><Spinner size="sm" /> Cargando...</td></tr>
              ) : pairs.length === 0 ? (
                <tr><td colSpan="3" className="text-center text-muted">No hay pares específicos.</td></tr>
              ) : (
                // --- MODIFICACIÓN AQUÍ ---
                // Se usa la función helper para mostrar el nombre del país
                pairs.map((pair, index) => (
                  <tr key={index}>
                    <td>{pair.originCurrency}</td>
                    <td>{getCountryNameByCode(pair.destCountry)} ({pair.destCountry})</td> {/* Muestra Nombre (Código) */}
                    <td>{pair.percent}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminMarkup;