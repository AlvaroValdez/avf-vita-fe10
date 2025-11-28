import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Col, Row, Alert, Spinner } from 'react-bootstrap';
import { getBeneficiaries } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Regex estándar para email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepBeneficiary = ({ formData, fields, onBack, onComplete }) => {
  const { token } = useAuth();
  const [beneficiaryData, setBeneficiaryData] = useState({});
  const [errors, setErrors] = useState({});
  const [fieldsToRender, setFieldsToRender] = useState([]);

  // Estados para Favoritos
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState('');

  const countryFields = fields || [];

  // Cargar favoritos si está logueado
  useEffect(() => {
    if (token) {
      const loadFavorites = async () => {
        setLoadingFavorites(true);
        try {
          const response = await getBeneficiaries();
          if (response.ok) {
            setFavorites(response.beneficiaries || []);
          }
        } catch (err) {
          console.warn("No se pudieron cargar favoritos:", err);
        } finally {
          setLoadingFavorites(false);
        }
      };
      loadFavorites();
    }
  }, [token]);

  // Inicializar formulario
  useEffect(() => {
    if (countryFields.length > 0) {
      const initialData = {};
      countryFields.forEach(field => { initialData[field.key] = ''; });
      setBeneficiaryData(prev => ({ ...initialData, ...prev })); // Mantiene datos si ya había
    }
  }, [countryFields]);

  // Filtrar campos visibles (lógica condicional 'when')
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
        setBeneficiaryData(favorite.beneficiaryData); // Autocompletar
        setErrors({});
      }
    } else {
      // Limpiar si deselecciona
      const resetData = {};
      countryFields.forEach(f => resetData[f.key] = '');
      setBeneficiaryData(resetData);
    }
  };

  const validateField = (name, value) => {
    const rule = countryFields.find(f => f.key === name);
    if (!rule) return null;

    const isRequired = rule.min > 0 || rule.required === true;
    if (isRequired && !value) return 'Este campo es requerido.';
    if (!value) return null;

    if (rule.min && value.length < rule.min) return `Mínimo ${rule.min} caracteres.`;
    if (rule.max && value.length > rule.max) return `Máximo ${rule.max} caracteres.`;

    if (rule.regex) {
      if (!new RegExp(rule.regex).test(value)) return rule.helper_text || 'Formato inválido.';
    } else if (rule.type === 'email') {
      if (!EMAIL_REGEX.test(value)) return 'Email inválido.';
    }
    return null;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value.trim());
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBeneficiaryData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
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
      // Pasamos los datos y true/false si viene de favorito
      onComplete(cleanData, !!selectedFavorite);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <Form.Select
            name={field.key}
            onChange={handleChange}
            onBlur={handleBlur}
            value={beneficiaryData[field.key] || ''}
            isInvalid={!!errors[field.key]}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Form.Select>
        );
      default:
        return (
          <Form.Control
            type={field.type || 'text'}
            name={field.key}
            onChange={handleChange}
            onBlur={handleBlur}
            value={beneficiaryData[field.key] || ''}
            isInvalid={!!errors[field.key]}
          />
        );
    }
  };

  if (countryFields.length === 0) {
    return <Card className="p-4"><Card.Body>Cargando formulario...</Card.Body></Card>;
  }

  return (
    <Card className="p-4">
      <Card.Body>
        <Card.Title as="h5" className="mb-4">Datos del Beneficiario</Card.Title>

        {token && (
          <Form.Group className="mb-4">
            <Form.Label>Cargar Beneficiario Favorito</Form.Label>
            <Form.Select
              value={selectedFavorite}
              onChange={handleFavoriteSelect}
              disabled={loadingFavorites}
              className="bg-light"
            >
              <option value="">{loadingFavorites ? 'Cargando...' : 'Selecciona un contacto guardado'}</option>
              {favorites.map(fav => (
                <option key={fav._id} value={fav._id}>{fav.nickname}</option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        <Form noValidate>
          <Row>
            {fieldsToRender.map((field) => (
              <Col md={6} key={field.key}>
                <Form.Group className="mb-3">
                  <Form.Label>{field.name}</Form.Label>
                  {renderField(field)}
                  <Form.Control.Feedback type="invalid">{errors[field.key]}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            ))}
          </Row>
          <div className="d-flex justify-content-between mt-4">
            <Button variant="outline-secondary" onClick={onBack}>Volver</Button>
            <Button variant="primary" style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }} onClick={handleNext}>Continuar</Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default StepBeneficiary;