import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, Table, Badge } from 'react-bootstrap';
import { getAllMarkups, getDefaultMarkup, updateDefaultMarkup, saveMarkup, deleteMarkup } from '../services/api';
import { useAppContext } from '../context/AppContext';
import VitaRatesMarquee from '../components/admin/VitaRatesMarquee';

const AdminMarkup = () => {
  const { countries, loading: loadingCountries } = useAppContext();

  // State
  const [markups, setMarkups] = useState([]);
  const [defaultMarkup, setDefaultMarkup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [defaultPercent, setDefaultPercent] = useState('');
  const [newOriginCountry, setNewOriginCountry] = useState('CL');
  const [newDestCountry, setNewDestCountry] = useState('');
  const [newPercent, setNewPercent] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [markupsRes, defaultRes] = await Promise.all([
        getAllMarkups(),
        getDefaultMarkup()
      ]);

      if (markupsRes.ok) {
        setMarkups(markupsRes.markups || []);
      }

      if (defaultRes.ok) {
        setDefaultMarkup(defaultRes.markup);
        setDefaultPercent(defaultRes.percent || '');
      }
    } catch (err) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefault = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const percent = parseFloat(defaultPercent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        throw new Error('El porcentaje debe estar entre 0 y 100');
      }

      const response = await updateDefaultMarkup(percent);
      if (response.ok) {
        setSuccess('Spread por defecto actualizado correctamente');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Error actualizando spread por defecto');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMarkup = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const percent = parseFloat(newPercent);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        throw new Error('El porcentaje debe estar entre 0 y 100');
      }

      if (!newOriginCountry) {
        throw new Error('Debe seleccionar un país de origen');
      }

      const markupData = {
        originCountry: newOriginCountry,
        destCountry: newDestCountry || undefined,
        percent,
        description: newDescription || undefined
      };

      const response = await saveMarkup(markupData);
      if (response.ok) {
        setSuccess('Spread guardado correctamente');
        setNewOriginCountry('CL');
        setNewDestCountry('');
        setNewPercent('');
        setNewDescription('');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Error guardando spread');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este spread?')) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await deleteMarkup(id);
      if (response.ok) {
        setSuccess('Spread eliminado correctamente');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Error eliminando spread');
    } finally {
      setSaving(false);
    }
  };

  const getCountryNameByCode = (code) => {
    if (!code) return 'N/A';
    const country = countries.find(c => c?.code?.toUpperCase() === code.toUpperCase());
    return country ? country.name : code;
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="my-5" style={{ maxWidth: '900px' }}>
      {/* Vita Rates Marquee */}
      <VitaRatesMarquee />

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Sección Spread por Defecto Global */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-percent me-2"></i>
            Spread Global por Defecto
          </h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted small">
            Este porcentaje se aplica a todos los corredores que no tengan un spread específico configurado.
          </p>
          <Form onSubmit={handleSaveDefault}>
            <Row className="align-items-end">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Porcentaje de Spread (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={defaultPercent}
                    onChange={(e) => setDefaultPercent(e.target.value)}
                    placeholder="Ej: 2.0"
                    required
                  />
                  <Form.Text className="text-muted">
                    Ejemplo: 2.0% significa que la tasa mostrada será 2% menor que la tasa Vita real
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Button type="submit" disabled={saving} className="w-100">
                  {saving ? <Spinner size="sm" /> : 'Guardar'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Sección Spreads Específicos */}
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0">
            <i className="bi bi-geo-alt me-2"></i>
            Spreads por Corredor
          </h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted small">
            Configura spreads específicos por país de origen o por corredor (origen → destino).
          </p>

          {/* Formulario para Agregar */}
          <Form onSubmit={handleAddMarkup} className="mb-4 p-3 bg-light rounded">
            <Row>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>País Origen</Form.Label>
                  <Form.Select
                    value={newOriginCountry}
                    onChange={(e) => setNewOriginCountry(e.target.value)}
                    required
                    disabled={loadingCountries}
                  >
                    <option value="">Seleccionar...</option>
                    {(countries || []).map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>País Destino (Opcional)</Form.Label>
                  <Form.Select
                    value={newDestCountry}
                    onChange={(e) => setNewDestCountry(e.target.value)}
                    disabled={loadingCountries}
                  >
                    <option value="">Todos</option>
                    {(countries || []).filter(c => c?.code !== newOriginCountry).map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted small">
                    Vacío = aplica a todos los destinos
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Spread %</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={newPercent}
                    onChange={(e) => setNewPercent(e.target.value)}
                    placeholder="2.5"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Opcional"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" variant="success" disabled={saving} className="mt-2">
              {saving ? <Spinner size="sm" /> : <><i className="bi bi-plus-circle me-2"></i>Agregar Spread</>}
            </Button>
          </Form>

          {/* Tabla de Spreads Configurados */}
          {markups.filter(m => !m.isDefault).length === 0 ? (
            <Alert variant="info" className="mb-0">
              No hay spreads específicos configurados. Todos usan el spread por defecto ({defaultPercent}%).
            </Alert>
          ) : (
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>Origen</th>
                  <th>Destino</th>
                  <th>Spread %</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {markups.filter(m => !m.isDefault).map(markup => (
                  <tr key={markup._id}>
                    <td>
                      <Badge bg="primary">{getCountryNameByCode(markup.originCountry)}</Badge>
                    </td>
                    <td>
                      {markup.destCountry ? (
                        <Badge bg="success">{getCountryNameByCode(markup.destCountry)}</Badge>
                      ) : (
                        <span className="text-muted">Todos</span>
                      )}
                    </td>
                    <td className="text-center">
                      <strong>{markup.percent}%</strong>
                    </td>
                    <td className="small text-muted">{markup.description || '-'}</td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(markup._id)}
                        disabled={saving}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Info Box */}
      <Alert variant="info" className="mt-4">
        <h6><i className="bi bi-info-circle me-2"></i>Prioridad de Aplicación</h6>
        <ol className="mb-0 small">
          <li><strong>Exacto:</strong> Si existe un spread CL → CO, se aplica ese</li>
          <li><strong>Default Origen:</strong> Si no, usa el spread default de CL (sin destino)</li>
          <li><strong>Global:</strong> Si no, usa el spread global por defecto</li>
        </ol>
      </Alert>
    </Container>
  );
};

export default AdminMarkup;