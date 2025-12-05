import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { getTransactionRules, updateTransactionRules, getAvailableOrigins, uploadImage } from '../services/api'; // Asegúrate de importar uploadImage
import { formatNumberForDisplay, parseFormattedNumber } from '../utils/formatting';

const AdminRules = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [availableCountries, setAvailableCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('CL');

  // Estado inicial completo
  const [formData, setFormData] = useState({
    originCountry: 'CL',
    minAmount: 5000,
    fixedFee: 0,
    isEnabled: false,
    alertMessage: '',
    kycLevel1: 450000,
    kycLevel2: 4500000,
    // Campos Anchor Manual
    provider: 'vita_wallet',
    manualExchangeRate: 0,
    bankName: '',
    accountNumber: '',
    accountType: '',
    holderName: '',
    holderId: '',
    depositQrImage: ''
  });

  // 1. Cargar países
  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        const res = await getAvailableOrigins();
        if (res.ok) setAvailableCountries(res.origins);
      } catch (e) {
        console.error('Error cargando orígenes:', e);
        setAvailableCountries([{ code: 'CL', name: 'Chile', currency: 'CLP' }]);
      }
    };
    fetchOrigins();
  }, []);

  // 2. Cargar reglas al cambiar país
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
            kycLevel2: rule.kycLimits?.level2 || 0,
            // Mapeo de datos anidados y nuevos campos
            provider: rule.provider || 'vita_wallet',
            manualExchangeRate: rule.manualExchangeRate || 0,
            bankName: rule.localBankDetails?.bankName || '',
            accountNumber: rule.localBankDetails?.accountNumber || '',
            accountType: rule.localBankDetails?.accountType || '',
            holderName: rule.localBankDetails?.holderName || '',
            holderId: rule.localBankDetails?.holderId || '',
            depositQrImage: rule.depositQrImage || ''
          });
        } else {
          // Defaults para nuevo país
          setFormData({
            originCountry: selectedCountry,
            minAmount: 5000,
            fixedFee: 0,
            isEnabled: false,
            alertMessage: '',
            kycLevel1: 450000,
            kycLevel2: 4500000,
            provider: 'vita_wallet',
            manualExchangeRate: 0,
            bankName: '',
            accountNumber: '',
            accountType: '',
            holderName: '',
            holderId: '',
            depositQrImage: ''
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

  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    const numericValue = parseFormattedNumber(value);
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Máx 2MB"); return; }

    setUploadingQr(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const res = await uploadImage(data);
      if (res.ok) {
        setFormData(prev => ({ ...prev, depositQrImage: res.url }));
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir QR.");
    } finally {
      setUploadingQr(false);
    }
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
        },
        provider: formData.provider,
        manualExchangeRate: Number(formData.manualExchangeRate),
        depositQrImage: formData.depositQrImage,
        localBankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          holderName: formData.holderName,
          holderId: formData.holderId
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

  if (loading) return <Container className="text-center p-5"><Spinner animation="border" /></Container>;

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

            {/* --- SECCIÓN ANCHOR MANUAL --- */}
            <div className="p-3 bg-light rounded mb-4 border">
              <h5 className="text-primary mb-3">Configuración de Proveedor</h5>
              <Form.Group className="mb-3">
                <Form.Label>Proveedor de Liquidez</Form.Label>
                <Form.Select name="provider" value={formData.provider} onChange={handleChange}>
                  <option value="vita_wallet">Vita Wallet (Automático)</option>
                  <option value="internal_manual">Anchor Manual (Transferencia Bancaria)</option>
                </Form.Select>
              </Form.Group>

              {/* Renderizado Condicional para Anchor Manual */}
              {formData.provider === 'internal_manual' && (
                <>
                  <div className="mb-3 p-3 bg-white border rounded">
                    <Form.Label className="fw-bold text-success">Tasa de Cambio Manual</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>1 {availableCountries.find(c => c.code === selectedCountry)?.currency} =</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.0001"
                        name="manualExchangeRate"
                        value={formData.manualExchangeRate}
                        onChange={handleChange}
                        placeholder="Ej: 135"
                      />
                      <InputGroup.Text>CLP</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">Define el valor de la moneda local frente al Peso Chileno.</Form.Text>
                  </div>

                  <h6 className="mt-3">Datos Bancarios para Depósito (On-Ramp)</h6>
                  <Row>
                    <Col md={6}><Form.Group className="mb-2"><Form.Label>Banco</Form.Label><Form.Control name="bankName" value={formData.bankName} onChange={handleChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-2"><Form.Label>Nro. Cuenta</Form.Label><Form.Control name="accountNumber" value={formData.accountNumber} onChange={handleChange} /></Form.Group></Col>
                  </Row>
                  <Row>
                    <Col md={6}><Form.Group className="mb-2"><Form.Label>Tipo Cuenta</Form.Label><Form.Control name="accountType" value={formData.accountType} onChange={handleChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-2"><Form.Label>Titular</Form.Label><Form.Control name="holderName" value={formData.holderName} onChange={handleChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-2"><Form.Label>CI/RUT</Form.Label><Form.Control name="holderId" value={formData.holderId} onChange={handleChange} /></Form.Group></Col>
                  </Row>

                  <Form.Group className="mt-3">
                    <Form.Label>QR de Cobro</Form.Label>
                    <div className="d-flex align-items-center">
                      <Form.Control type="file" onChange={handleQrUpload} disabled={uploadingQr} accept="image/*" />
                      {uploadingQr && <Spinner size="sm" className="ms-2" />}
                    </div>
                    {formData.depositQrImage && (
                      <div className="mt-2">
                        <img src={formData.depositQrImage} alt="QR" style={{ maxHeight: '100px' }} />
                        <small className="text-success d-block">Imagen guardada</small>
                      </div>
                    )}
                  </Form.Group>
                </>
              )}
            </div>

            <h5 className="text-muted mb-3">Límites y Costos</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Monto Mínimo</Form.Label>
                  <InputGroup><InputGroup.Text>$</InputGroup.Text>
                    <Form.Control type="text" inputMode="numeric" name="minAmount" value={formatNumberForDisplay(formData.minAmount)} onChange={handleAmountChange} />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fee Fijo</Form.Label>
                  <InputGroup><InputGroup.Text>$</InputGroup.Text>
                    <Form.Control type="text" inputMode="numeric" name="fixedFee" value={formatNumberForDisplay(formData.fixedFee)} onChange={handleAmountChange} />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
            {/* ... (Sección KYC y Alertas igual que antes) ... */}

            <div className="d-grid mt-4">
              <Button type="submit" disabled={saving} size="lg" style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}>
                {saving ? <Spinner size="sm" /> : `Guardar Configuración para ${selectedCountry}`}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRules;