import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { getTransactionRules, updateTransactionRules, getAvailableOrigins, uploadImage } from '../services/api';
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
    profitRetention: false, // ✅ Estado inicial
    profitRetentionPercent: 0, // % de profit a retener (ej: 2.0 = 2%)
    alertMessage: '',
    kycLevel1: 450000,
    kycLevel2: 4500000,
    // Campos Anchor Manual
    provider: 'vita_wallet',
    manualExchangeRate: 0,
    // 💰 Comisiones
    feeType: 'percentage',
    feeAmount: 0,
    bankName: '',
    accountNumber: '',
    accountType: '',
    holderName: '',
    holderId: '',
    depositQrImage: '',
    destinations: []
  });

  // 1. Cargar países disponibles
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
            profitRetention: rule.profitRetention || false, // ✅ Mapeo
            profitRetentionPercent: rule.profitRetentionPercent || 0, // % de profit
            alertMessage: rule.alertMessage || '',
            kycLevel1: rule.kycLimits?.level1 || 0,
            kycLevel2: rule.kycLimits?.level2 || 0,
            // Mapeo de datos anidados y nuevos campos
            provider: rule.provider || 'vita_wallet',
            manualExchangeRate: rule.manualExchangeRate || 0,
            // 💰 Comisiones
            feeType: rule.feeType || 'percentage',
            feeAmount: rule.feeAmount || 0,
            bankName: rule.localBankDetails?.bankName || '',
            accountNumber: rule.localBankDetails?.accountNumber || '',
            accountType: rule.localBankDetails?.accountType || '',
            holderName: rule.localBankDetails?.holderName || '',
            holderId: rule.localBankDetails?.holderId || '',
            depositQrImage: rule.depositQrImage || '',
            destinations: rule.destinations || []
          });
        } else {
          // Defaults para nuevo país
          setFormData({
            originCountry: selectedCountry,
            minAmount: 5000,
            fixedFee: 0,
            isEnabled: false,
            profitRetention: false,
            profitRetentionPercent: 0,
            alertMessage: '',
            kycLevel1: 450000,
            kycLevel2: 4500000,
            provider: 'vita_wallet',
            manualExchangeRate: 0,
            feeType: 'percentage',
            feeAmount: 0,
            bankName: '',
            accountNumber: '',
            accountType: '',
            holderName: '',
            holderId: '',
            depositQrImage: '',
            destinations: []
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

  // --- Handlers para Destinos Manuales ---
  const handleDestChange = (index, field, value) => {
    const newDests = [...formData.destinations];
    newDests[index] = { ...newDests[index], [field]: value };
    setFormData(prev => ({ ...prev, destinations: newDests }));
  };

  const addDestination = () => {
    const newDests = [...formData.destinations, {
      countryCode: '',
      manualExchangeRate: 0,
      feeType: 'percentage',
      feeAmount: 0,
      payoutFixedFee: 0,
      isEnabled: true
    }];
    setFormData(prev => ({ ...prev, destinations: newDests }));
  };

  const removeDestination = (index) => {
    const newDests = formData.destinations.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, destinations: newDests }));
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
        profitRetention: formData.profitRetention, // ✅ Enviar al backend
        profitRetentionPercent: Number(formData.profitRetentionPercent || 0), // % de profit
        alertMessage: formData.alertMessage,
        kycLimits: {
          level1: Number(formData.kycLevel1),
          level2: Number(formData.kycLevel2)
        },
        provider: formData.provider,
        manualExchangeRate: Number(formData.manualExchangeRate),
        // 💰 Comisiones
        feeType: formData.feeType,
        feeAmount: Number(formData.feeAmount),
        depositQrImage: formData.depositQrImage,
        localBankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          holderName: formData.holderName,
          holderId: formData.holderId
        },
        destinations: formData.destinations
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

            {/* --- SECCIÓN TESORERÍA / PROFIT --- */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-success bg-opacity-10 rounded border border-success">
              <div>
                <h5 className="mb-0 text-success">💰 Retención de Ganancia (Profit Retention)</h5>
                <small className="text-muted">
                  Si activas esto, enviaremos a Vita el <strong>monto justo</strong> para que el beneficiario reciba lo prometido.
                  <br />
                  Tu ganancia por spread <strong>SE QUEDA EN TU WALLET</strong> en lugar de regalarse al cliente final.
                </small>
              </div>
              <Form.Check
                type="switch"
                id="profit-retention-switch"
                label={formData.profitRetention ? "ACTIVADO" : "DESACTIVADO"}
                name="profitRetention"
                checked={formData.profitRetention}
                onChange={handleChange}
                className="fs-5 fw-bold text-success"
              />
            </div>

            {/* Profit Retention Percentage (Solo si está activo) */}
            {formData.profitRetention && (
              <div className="mb-4 p-3 bg-warning bg-opacity-10 rounded border border-warning">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    <i className="bi bi-percent me-2"></i>
                    Porcentaje de Profit a Retener
                    <span className="badge bg-warning text-dark ms-2">Modelo Híbrido</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      name="profitRetentionPercent"
                      value={formData.profitRetentionPercent || 0}
                      onChange={handleChange}
                      placeholder="2.0"
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Porcentaje del principal neto (después fees de Fintoc) a retener como profit.
                    <br />
                    <strong>Ejemplo</strong>: Con 9,700 CLP neto y 2.0%, Alyto retiene 194 CLP y envía 9,506 CLP a Vita.
                    <br />
                    <strong>Recomendado</strong>: 1.5% - 2.5% para mantener competitividad.
                    <br />
                    <strong>⚠️ Máximo permitido</strong>: 5% (safety cap en backend)
                  </Form.Text>
                </Form.Group>
              </div>
            )}

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
                    <Form.Text className="text-muted">
                      Define cuánto vale 1 unidad de la moneda de origen en Pesos Chilenos (CLP).
                    </Form.Text>
                  </div>

                  {/* 💰 Comisiones */}
                  <div className="mb-3 p-3 bg-white border rounded">
                    <Form.Label className="fw-bold text-warning">Comisión</Form.Label>
                    <Row>
                      <Col md={5}>
                        <Form.Group>
                          <Form.Label>Tipo de Comisión</Form.Label>
                          <Form.Select name="feeType" value={formData.feeType} onChange={handleChange}>
                            <option value="none">Sin comisión</option>
                            <option value="percentage">Porcentaje (%)</option>
                            <option value="fixed">Fijo (CLP)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={7}>
                        <Form.Group>
                          <Form.Label>
                            {formData.feeType === 'percentage' ? 'Porcentaje (%)' : formData.feeType === 'fixed' ? 'Monto Fijo (CLP)' : 'Monto'}
                          </Form.Label>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              step={formData.feeType === 'percentage' ? '0.01' : '1'}
                              name="feeAmount"
                              value={formData.feeAmount}
                              onChange={handleChange}
                              placeholder={formData.feeType === 'percentage' ? 'Ej: 3' : 'Ej: 1000'}
                              disabled={formData.feeType === 'none'}
                            />
                            <InputGroup.Text>
                              {formData.feeType === 'percentage' ? '%' : 'CLP'}
                            </InputGroup.Text>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Text className="text-muted">
                      {formData.feeType === 'percentage'
                        ? `Ejemplo: con 3%, un envío de 100 BOB (14,000 CLP) cobrará 420 CLP de comisión.`
                        : formData.feeType === 'fixed'
                          ? `Ejemplo: con 1000 CLP fijo, se cobrará 1,000 CLP sin importar el monto.`
                          : 'No se cobrará comisión para este corredor.'}
                    </Form.Text>
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


            {/* --- SECCIÓN DESTINOS MANUALES (Override) --- */}
            <div className="p-3 bg-light rounded mb-4 border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-secondary mb-0">Destinos Manuales (Overrides)</h5>
                <Button variant="outline-primary" size="sm" onClick={addDestination}>+ Agregar Destino</Button>
              </div>
              <p className="text-muted small">Configura tasas específicas para ciertos destinos (ej: Bolivia).</p>

              {formData.destinations && formData.destinations.map((dest, idx) => (
                <div key={idx} className="card mb-3 p-3 shadow-sm">
                  <div className="d-flex justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold">Destino:</span>
                      <Form.Control
                        type="text"
                        placeholder="Código (ej: BO)"
                        value={dest.countryCode}
                        onChange={(e) => handleDestChange(idx, 'countryCode', e.target.value.toUpperCase())}
                        style={{ width: '80px' }}
                      />
                    </div>
                    <Button variant="outline-danger" size="sm" onClick={() => removeDestination(idx)}>Eliminar</Button>
                  </div>

                  <Row className="g-2">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small">Manual Rate</Form.Label>
                        <Form.Control type="number" step="0.0001" value={dest.manualExchangeRate} onChange={e => handleDestChange(idx, 'manualExchangeRate', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="small">Fee Type</Form.Label>
                        <Form.Select value={dest.feeType} onChange={e => handleDestChange(idx, 'feeType', e.target.value)}>
                          <option value="percentage">%</option>
                          <option value="fixed">$</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small">Fee Amount</Form.Label>
                        <Form.Control type="number" step="0.01" value={dest.feeAmount} onChange={e => handleDestChange(idx, 'feeAmount', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="small">Estado</Form.Label>
                        <Form.Select value={dest.isEnabled} onChange={e => handleDestChange(idx, 'isEnabled', e.target.value === 'true')}>
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label className="small">Payout Fee</Form.Label>
                        <Form.Control type="number" step="1" value={dest.payoutFixedFee || 0} onChange={e => handleDestChange(idx, 'payoutFixedFee', e.target.value)} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              ))}
              {(!formData.destinations || formData.destinations.length === 0) && <p className="text-center text-muted fst-italic">No hay destinos manuales configurados.</p>}
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

            <h5 className="text-muted mb-3">Límites KYC</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group><Form.Label>Límite Nivel 1</Form.Label>
                  <InputGroup><InputGroup.Text>$</InputGroup.Text>
                    <Form.Control type="text" inputMode="numeric" name="kycLevel1" value={formatNumberForDisplay(formData.kycLevel1)} onChange={handleAmountChange} />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group><Form.Label>Límite Nivel 2</Form.Label>
                  <InputGroup><InputGroup.Text>$</InputGroup.Text>
                    <Form.Control type="text" inputMode="numeric" name="kycLevel2" value={formatNumberForDisplay(formData.kycLevel2)} onChange={handleAmountChange} />
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
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRules;