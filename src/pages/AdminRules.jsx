import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { getTransactionRules, updateTransactionRules, getAvailableOrigins } from '../services/api';
import { formatNumberForDisplay, parseFormattedNumber } from '../utils/formatting';

const AdminRules = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [availableCountries, setAvailableCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('CL');

  const [formData, setFormData] = useState({
    originCountry: 'CL',
    minAmount: 5000,
    fixedFee: 0,
    isEnabled: false,
    alertMessage: '',
    kycLevel1: 450000,
    kycLevel2: 4500000
  });

  // 1. Cargar lista de países disponibles
  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        const res = await getAvailableOrigins();
        if (res.ok) {
          setAvailableCountries(res.origins);
        }
      } catch (e) {
        console.error('Error cargando orígenes:', e);
        setAvailableCountries([{ code: 'CL', name: 'Chile', currency: 'CLP' }]);
      }
    };
    fetchOrigins();
  }, []);

  // 2. Cargar reglas cuando cambia el país seleccionado
  useEffect(() => {
    const loadRules = async () => {
      setLoading(true);
      setSuccess('');
      try {
        const response = await getTransactionRules(selectedCountry);
        if (response.ok && response.rules && response.rules.length > 0) {
          const rule = response.rules[0];
          setFormData({
            originCountry: selectedCountry,
            minAmount: rule.minAmount,
            fixedFee: rule.fixedFee,
            isEnabled: rule.isEnabled,
            alertMessage: rule.alertMessage || '',
            kycLevel1: rule.kycLimits?.level1 || 0,
            kycLevel2: rule.kycLimits?.level2 || 0
          });
        } else {
          // Resetear a defaults si no hay regla para ese país
          setFormData({
            originCountry: selectedCountry,
            minAmount: 5000,
            fixedFee: 0,
            isEnabled: false,
            alertMessage: '',
            kycLevel1: 450000,
            kycLevel2: 4500000
          });
        }
      } catch (err) {
        setError('No se pudo cargar la configuración.');
      } finally {
        setLoading(false);
      }
    };
    loadRules();
  }, [selectedCountry]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Manejador específico para inputs numéricos con formato
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    // Elimina puntos para guardar el número puro
    const numericValue = parseFormattedNumber(value);
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = {
        originCountry: selectedCountry,
        minAmount: Number(formData.minAmount),
        fixedFee: Number(formData.fixedFee),
        isEnabled: formData.isEnabled,
        alertMessage: formData.alertMessage,
        kycLimits: {
          level1: Number(formData.kycLevel1),
          level2: Number(formData.kycLevel2)
        }
      };
      const response = await updateTransactionRules(payload);
      if (response.ok) setSuccess(`Reglas para ${selectedCountry} guardadas.`);
      else throw new Error(response.error);
    } catch (err) {
      setError(err.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="my-5" style={{ maxWidth: '800px' }}>
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0 text-primary">Reglas de Transacción</h4>

          <Form.Select
            style={{ maxWidth: '200px', fontWeight: 'bold' }}
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {availableCountries.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
            ))}
          </Form.Select>
        </Card.Header>

        <Card.Body>
          {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
            <Form onSubmit={handleSubmit}>
              <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                <div>
                  <h5 className="mb-0">Estado del Corredor: <strong>{selectedCountry}</strong></h5>
                  <small className="text-muted">Activa o desactiva los envíos desde este país.</small>
                </div>
                <Form.Check
                  type="switch" id="service-switch"
                  label={formData.isEnabled ? "ACTIVO" : "INACTIVO"}
                  name="isEnabled" checked={formData.isEnabled} onChange={handleChange}
                  className="fs-5 fw-bold"
                />
              </div>

              <h5 className="text-muted mb-3">Límites y Costos</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monto Mínimo</Form.Label>
                    <InputGroup><InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        name="minAmount"
                        value={formatNumberForDisplay(formData.minAmount)}
                        onChange={handleAmountChange}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fee Fijo</Form.Label>
                    <InputGroup><InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        name="fixedFee"
                        value={formatNumberForDisplay(formData.fixedFee)}
                        onChange={handleAmountChange}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <h5 className="text-muted mb-3">Límites KYC</h5>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group><Form.Label>Límite Nivel 1</Form.Label>
                    <InputGroup><InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        name="kycLevel1"
                        value={formatNumberForDisplay(formData.kycLevel1)}
                        onChange={handleAmountChange}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group><Form.Label>Límite Nivel 2</Form.Label>
                    <InputGroup><InputGroup.Text>$</InputGroup.Text>
                      <Form.Control
                        type="text"
                        inputMode="numeric"
                        name="kycLevel2"
                        value={formatNumberForDisplay(formData.kycLevel2)}
                        onChange={handleAmountChange}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <h5 className="text-muted mb-3">Comunicación</h5>
              <Form.Group className="mb-4">
                <Form.Label>Mensaje de Alerta Global</Form.Label>
                <Form.Control as="textarea" rows={2} name="alertMessage" value={formData.alertMessage} onChange={handleChange} placeholder="Aviso visible para el usuario..." />
              </Form.Group>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="d-grid">
                <Button type="submit" disabled={saving} size="lg" style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}>
                  {saving ? <Spinner size="sm" /> : `Guardar Configuración para ${selectedCountry}`}
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRules;