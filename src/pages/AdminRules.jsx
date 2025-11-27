import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { getTransactionRules, updateTransactionRules } from '../services/api';
// 1. Importamos las funciones de formato
import { formatNumberForDisplay, parseFormattedNumber } from '../utils/formatting';

const AdminRules = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    originCountry: 'CL',
    minAmount: 5000,
    fixedFee: 0,
    isEnabled: true,
    alertMessage: '',
    kycLevel1: 450000,
    kycLevel2: 4500000
  });

  useEffect(() => {
    const loadRules = async () => {
      try {
        const response = await getTransactionRules('CL');
        if (response.ok && response.rules && response.rules.length > 0) {
          const rule = response.rules[0];
          setFormData({
            originCountry: rule.originCountry,
            minAmount: rule.minAmount,
            fixedFee: rule.fixedFee,
            isEnabled: rule.isEnabled,
            alertMessage: rule.alertMessage || '',
            kycLevel1: rule.kycLimits?.level1 || 450000,
            kycLevel2: rule.kycLimits?.level2 || 4500000
          });
        }
      } catch (err) {
        setError('No se pudo cargar la configuración.');
      } finally {
        setLoading(false);
      }
    };
    loadRules();
  }, []);

  // Manejador genérico para textos y switches
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 2. NUEVO MANEJADOR ESPECÍFICO PARA MONTOS (Aplica formato)
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    // Convierte el texto con puntos (ej: "100.000") a número puro (100000) para el estado
    const numericValue = parseFormattedNumber(value);
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        originCountry: formData.originCountry,
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
      if (response.ok) {
        setSuccess('Reglas actualizadas correctamente.');
      } else {
        throw new Error(response.error || 'Error al guardar.');
      }
    } catch (err) {
      setError(err.message || 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container className="text-center p-5"><Spinner animation="border" /></Container>;

  return (
    <Container className="my-5" style={{ maxWidth: '800px' }}>
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0" style={{ color: 'var(--avf-primary)' }}>Reglas de Transacción (Chile)</h4>
          <Form.Check 
            type="switch"
            id="service-switch"
            label={formData.isEnabled ? "Servicio Activo" : "Servicio Pausado"}
            name="isEnabled"
            checked={formData.isEnabled}
            onChange={handleChange}
            className="fw-bold text-primary"
          />
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            
            <h5 className="text-muted mb-3">Límites y Montos (CLP)</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Monto Mínimo de Envío</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    {/* 3. Usamos type="text" y value formateado */}
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
                  <Form.Label>Costo Fijo (Fee) por Envío</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
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
                <Form.Group className="mb-3">
                  <Form.Label>Límite Nivel 1 (Básico)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      inputMode="numeric"
                      name="kycLevel1" 
                      value={formatNumberForDisplay(formData.kycLevel1)} 
                      onChange={handleAmountChange} 
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">Máximo por transacción sin verificar.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Límite Nivel 2 (Verificado)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control 
                      type="text" 
                      inputMode="numeric"
                      name="kycLevel2" 
                      value={formatNumberForDisplay(formData.kycLevel2)} 
                      onChange={handleAmountChange} 
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">Máximo para usuarios aprobados.</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <h5 className="text-muted mb-3">Comunicación</h5>
            <Form.Group className="mb-4">
              <Form.Label>Mensaje de Alerta Global</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2} 
                name="alertMessage" 
                value={formData.alertMessage} 
                onChange={handleChange} 
                placeholder="Ej: 'Posibles demoras por feriado bancario...'"
              />
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="d-grid">
              <Button 
                type="submit" 
                disabled={saving} 
                size="lg"
                style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
              >
                {saving ? <Spinner size="sm" /> : 'Guardar Configuración'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRules;