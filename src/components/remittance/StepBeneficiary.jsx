import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Col, Row, Spinner } from 'react-bootstrap';
import { getBeneficiaries } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsQR from 'jsqr';

// Import flags
import flagCL from '../../assets/flags/cl.svg';
import flagCO from '../../assets/flags/co.svg';
import flagBO from '../../assets/flags/bo.svg';
import flagPE from '../../assets/flags/pe.svg';
import flagMX from '../../assets/flags/mx.svg';
import flagVE from '../../assets/flags/ve.svg';
import flagBR from '../../assets/flags/br.svg';
import flagAR from '../../assets/flags/ar.svg';
import flagUS from '../../assets/flags/us.svg';

const FLAGS = {
  CL: flagCL, CO: flagCO, BO: flagBO, PE: flagPE,
  MX: flagMX, VE: flagVE, BR: flagBR, AR: flagAR, US: flagUS
};
const getFlagUrl = (code) => FLAGS[code?.toUpperCase()] || '';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepBeneficiary = ({ formData, fields, onBack, onComplete }) => {
  const { token } = useAuth();
  const [beneficiaryData, setBeneficiaryData] = useState({});
  const [errors, setErrors] = useState({});
  const [fieldsToRender, setFieldsToRender] = useState([]);

  // QR Upload State
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [qrContent, setQrContent] = useState(null);

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState('');

  const countryFields = fields || [];

  // Cargar favoritos
  useEffect(() => {
    if (token) {
      setLoadingFavorites(true);
      getBeneficiaries()
        .then(res => {
          console.log("👥 Beneficiaries Response:", res);
          let list = [];
          if (Array.isArray(res)) list = res;
          else if (res?.beneficiaries && Array.isArray(res.beneficiaries)) list = res.beneficiaries;
          else if (res?.data && Array.isArray(res.data)) list = res.data;

          setFavorites(list);
        })
        .catch(err => console.error("Error loading favorites:", err))
        .finally(() => setLoadingFavorites(false));
    }
  }, [token]);

  // Inicializar datos
  useEffect(() => {
    if (countryFields.length > 0) {
      const initialData = {};
      countryFields.forEach(field => { initialData[field.key] = ''; });
      setBeneficiaryData(prev => ({ ...initialData, ...prev }));
    }
  }, [countryFields]);

  // Campos visibles dinámicos
  useEffect(() => {
    if (countryFields.length > 0) {
      const visibleFields = countryFields.filter(field => {
        if (!field.when) return true;
        return beneficiaryData[field.when.key] === field.when.value;
      });
      setFieldsToRender(visibleFields);
    }
  }, [beneficiaryData, countryFields]);

  const handleFavoriteSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedFavorite(selectedId);
    if (selectedId) {
      const favorite = favorites.find(f => f._id === selectedId);
      if (favorite) {
        setBeneficiaryData(favorite.beneficiaryData);
        setErrors({});
      }
    } else {
      const resetData = {};
      countryFields.forEach(f => resetData[f.key] = '');
      setBeneficiaryData(resetData);
    }
  };

  const validateField = (name, value) => {
    // Si es Bolivia y hay QR, omitir validación
    if (formData?.destCountry === 'BO' && qrFile) return null;

    const rule = countryFields.find(f => f.key === name);
    if (!rule) return null;

    // Validación de requeridos
    const isRequired = rule.min > 0 || rule.required === true;
    if (isRequired && (!value || value.trim() === '')) return 'Este campo es requerido.';
    if (!value) return null;

    if (rule.min && value.length < rule.min) return `Mínimo ${rule.min} caracteres.`;
    if (rule.max && value.length > rule.max) return `Máximo ${rule.max} caracteres.`;

    if (rule.regex) {
      try {
        if (!new RegExp(rule.regex).test(value)) return rule.helper_text || 'Formato inválido.';
      } catch (e) { console.warn("Regex inválido del backend:", rule.regex); }
    } else if (rule.type === 'email') {
      if (!EMAIL_REGEX.test(value)) return 'Email inválido.';
    }
    return null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrFile(file);
      const objectUrl = URL.createObjectURL(file);
      setQrPreview(objectUrl);
      setQrContent(null); // Reset content

      // Intentar decodificar QR
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log("✅ QR Decoded:", code.data);
          setQrContent(code.data);
        } else {
          console.warn("⚠️ No QR code found in image");
        }
      };
      img.src = objectUrl;
    }
  };

  const removeQr = () => {
    setQrFile(null);
    setQrPreview(null);
    setQrContent(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBeneficiaryData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleNext = () => {
    let allErrors = {};
    let isFormValid = true;
    const cleanData = {};

    fieldsToRender.forEach(field => {
      const value = beneficiaryData[field.key] ? String(beneficiaryData[field.key]).trim() : '';
      cleanData[field.key] = value;

      // ✅ FIX: Para campos select, también capturar el LABEL (nombre legible)
      if (field.type === 'select' && value && field.options) {
        const selectedOption = field.options.find(opt => String(opt.value) === value);
        if (selectedOption) {
          // Guardar el nombre legible según el campo
          if (field.key === 'bank_code') {
            cleanData.bank_name = selectedOption.label; // "Bancolombia"
          } else if (field.key === 'account_type_bank') {
            cleanData.account_type_name = selectedOption.label; // "Cuenta de Ahorros"
          }
        }
      }

      // Add QR file if present
      if (qrFile) {
        cleanData.beneficiaryQrFile = qrFile;
        cleanData.beneficiaryQrContent = qrContent; // Pass decoded content
      }

      // Re-validate considering QR state (validateField handles the logic)
      const error = validateField(field.key, value);
      if (error) {
        allErrors[field.key] = error;
        isFormValid = false;
      }
    });

    setErrors(allErrors);

    if (isFormValid) {
      console.log("Formulario válido, avanzando...");
      console.log("✅ [StepBeneficiary] cleanData with labels:", cleanData);
      onComplete(cleanData, !!selectedFavorite);
    } else {
      console.log("Errores en formulario:", allErrors);
      alert("Por favor, corrige los errores en el formulario antes de continuar.");
    }
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      return <Form.Select name={field.key} onChange={handleChange} onBlur={handleBlur} value={beneficiaryData[field.key] || ''} isInvalid={!!errors[field.key]}>
        <option value="">Seleccionar...</option>
        {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </Form.Select>;
    }
    return <Form.Control type={field.type || 'text'} name={field.key} onChange={handleChange} onBlur={handleBlur} value={beneficiaryData[field.key] || ''} isInvalid={!!errors[field.key]} />;
  };

  if (countryFields.length === 0) return <Card className="p-4"><Card.Body>Cargando formulario...</Card.Body></Card>;

  return (
    <Card className="p-4 shadow-lg border-0" style={{ borderRadius: '15px' }}>
      <Card.Body>
        <h4 className="mb-4 text-center fw-bold">Datos del Beneficiario</h4>

        {formData?.destCountry === 'BO' && (
          <div className="mb-4 mt-2">
            <Form.Label className="fw-bold d-block text-primary">
              <i className="bi bi-qr-code-scan me-2"></i>
              Código QR del Destinatario (Opcional)
            </Form.Label>

            {!qrFile ? (
              <div
                className="border rounded-3 p-4 text-center bg-light"
                style={{ borderStyle: 'dashed', borderWidth: '2px', cursor: 'pointer' }}
                onClick={() => document.getElementById('qr-upload').click()}
              >
                <input
                  id="qr-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="text-muted">
                  <i className="bi bi-cloud-upload fs-1 d-block mb-2"></i>
                  <span>Haz clic para subir el QR</span>
                  <br />
                  <small>o arrastra la imagen aquí</small>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="position-relative border rounded p-2 d-inline-block bg-white shadow-sm mt-3">
                  <img
                    src={qrPreview}
                    alt="QR Preview"
                    style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain' }}
                    className="rounded"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 start-100 translate-middle rounded-circle p-0 d-flex align-items-center justify-content-center"
                    style={{ width: '32px', height: '32px' }}
                    onClick={removeQr}
                  >
                    <i className="bi bi-x fs-5"></i>
                  </Button>
                </div>
                <div className="text-center mt-2 fw-bold text-success fs-5">
                  <i className="bi bi-check-circle-fill me-2"></i> Listo
                  {qrContent && <div className="fs-6 fw-normal text-muted mt-1"><i className="bi bi-qr-code"></i> Datos leídos automáticamente</div>}
                  {!qrContent && <div className="fs-6 fw-normal text-warning mt-1"><i className="bi bi-exclamation-triangle"></i> No se detectaron datos en QR (se enviará imagen)</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {token && !qrFile && (
          <Form.Group className="mb-4 p-3 bg-light rounded">
            <Form.Label className="fw-bold text-primary">Cargar Favorito</Form.Label>
            <Form.Select value={selectedFavorite} onChange={handleFavoriteSelect}>
              <option value="">-- Nuevo destinatario --</option>
              {favorites.map(fav => (
                <option key={fav._id} value={fav._id}>
                  {fav.beneficiaryData?.beneficiary_first_name} {fav.beneficiaryData?.beneficiary_last_name} ({fav.country})
                </option>
              ))}
            </Form.Select>
            {loadingFavorites && <Spinner animation="border" size="sm" className="mt-2" />}
          </Form.Group>
        )}

        <Form>
          {!qrFile && (
            <Row>
              {fieldsToRender.map(f => (
                <Col md={6} key={f.key}>
                  <Form.Group className="mb-3">
                    <Form.Label>{f.name}</Form.Label>
                    {renderField(f)}
                    <Form.Control.Feedback type="invalid">{errors[f.key]}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          )}


          <div className="d-flex justify-content-between mt-4">
            <Button variant="outline-secondary" onClick={onBack}>Atrás</Button>
            <Button
              variant="primary"
              onClick={handleNext}
              className="text-white fw-bold"
            >
              Continuar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default StepBeneficiary;