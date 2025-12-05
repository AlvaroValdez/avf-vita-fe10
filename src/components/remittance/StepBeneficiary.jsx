import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Col, Row, Spinner } from 'react-bootstrap';
import { getBeneficiaries } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepBeneficiary = ({ formData, fields, onBack, onComplete }) => {
  const { token } = useAuth();
  const [beneficiaryData, setBeneficiaryData] = useState({});
  const [errors, setErrors] = useState({});
  const [fieldsToRender, setFieldsToRender] = useState([]);

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState('');

  const countryFields = fields || [];

  // Cargar favoritos
  useEffect(() => {
    if (token) {
      setLoadingFavorites(true);
      getBeneficiaries()
        .then(res => { if (res.ok) setFavorites(res.beneficiaries || []); })
        .catch(console.warn)
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
      const error = validateField(field.key, value);
      if (error) {
        allErrors[field.key] = error;
        isFormValid = false;
      }
    });

    setErrors(allErrors);

    if (isFormValid) {
      console.log("Formulario válido, avanzando...");
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

        {token && (
          <Form.Group className="mb-4 p-3 bg-light rounded">
            <Form.Label className="fw-bold text-primary">Cargar Favorito</Form.Label>
            <Form.Select value={selectedFavorite} onChange={handleFavoriteSelect} disabled={loadingFavorites}>
              <option value="">{loadingFavorites ? 'Cargando...' : 'Selecciona un contacto...'}</option>
              {favorites.map(fav => <option key={fav._id} value={fav._id}>{fav.nickname}</option>)}
            </Form.Select>
          </Form.Group>
        )}

        <Form>
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
          <div className="d-flex justify-content-between mt-4">
            <Button variant="outline-secondary" onClick={onBack}>Atrás</Button>
            <Button
              variant="primary"
              onClick={handleNext}
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)', color: 'white' }}
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