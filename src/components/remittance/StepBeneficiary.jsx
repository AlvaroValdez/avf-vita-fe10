import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Col, Row } from 'react-bootstrap';
import { getBeneficiaries } from '../../services/api'; // 1. Importa la función
import { useAuth } from '../../context/AuthContext'

// Expresión regular estándar para la validación de email.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StepBeneficiary = ({ formData, fields, onBack, onComplete }) => {
  const { token } = useAuth();
  const [beneficiaryData, setBeneficiaryData] = useState({});
  const [errors, setErrors] = useState({});
  const [fieldsToRender, setFieldsToRender] = useState([]);

  const [favorites, setFavorites] = useState([]); // Estado para favoritos
  const [loadingFavorites, setLoadingFavorites] = useState(true); // Nuevo estado
  const [selectedFavorite, setSelectedFavorite] = useState('');

  const countryFields = fields || [];

  // Efecto para cargar los favoritos al inicio
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
          console.error("Error al cargar favoritos: ", err);
          // Si hay un 401, no hacemos nada, si no es 401 mostramos un error
        } finally {
          setLoadingFavorites(false);
        }
      };
      loadFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lógica para autocompletar cuando se selecciona un favorito
  const handleFavoriteSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedFavorite(selectedId);

    if (selectedId) {
      const favorite = favorites.find(f => f._id === selectedId);
      if (favorite) {
        // Autocompleta el estado con los datos del Map
        setBeneficiaryData(favorite.beneficiaryData); 
        // Nota: Si el país del favorito (favorite.country) es diferente al país de la cotización,
        // esto podría causar problemas de validación al avanzar. Por ahora, asumimos que
        // el usuario solo guardará favoritos para el país de la cotización actual o que cambiará el país si carga el favorito.
        setErrors({}); 
      }
    } else {
      // Limpia el formulario si selecciona la opción "Cargar..."
      setBeneficiaryData({}); 
    }
  };

  // Efectos para inicializar y mostrar campos (sin cambios)
  useEffect(() => {
    if (countryFields.length > 0) {
      const initialData = {};
      countryFields.forEach(field => { initialData[field.key] = ''; });
      setBeneficiaryData(initialData);
    }
  }, [countryFields]);
  
  useEffect(() => {
    if (countryFields.length > 0) {
      const visibleFields = countryFields.filter(field => {
        if (!field.when) return true;
        return beneficiaryData[field.when.key] === field.when.value;
      });
      setFieldsToRender(visibleFields);
    }
  }, [beneficiaryData, countryFields]);

  // --- VALIDACIÓN BASADA EN REGLAS VITA ---
  const validateField = (name, value) => {
    const rule = countryFields.find(f => f.key === name);
    if (!rule) return null;

    // 1. Validar si es requerido (basado en la propiedad 'min')
    const isRequired = rule.min > 0;
    if (isRequired && !value) {
      return 'Este campo es requerido.';
    }
    if (!value) return null; // Si no es requerido y está vacío, es válido

    // 2. Validar longitud MÍNIMA
    if (rule.min && value.length < rule.min) {
      return `Debe tener al menos ${rule.min} caracteres.`;
    }

    // 3. Validar longitud MÁXIMA
    if (rule.max && value.length > rule.max) {
      return `No puede exceder los ${rule.max} caracteres.`;
    }
    
    // 4. Validar formato con REGEX (si la API lo provee)
    if (rule.regex) {
      const regex = new RegExp(rule.regex);
      if (!regex.test(value)) {
        return rule.helper_text || 'El formato es inválido.';
      }
    } 
    // 5. Si no hay REGEX, validar por TIPO (ej: 'email')
    else if (rule.type === 'email') {
      if (!EMAIL_REGEX.test(value)) {
        return 'El formato del correo electrónico es inválido.';
      }
      const localPart = value.split('@')[0];
      if (localPart.length < 6) {
        return 'El nombre del correo debe tener al menos 6 caracteres.';
      }
    }

    return null; // El campo es válido
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value.trim());
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
      onComplete(cleanData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBeneficiaryData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
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
            <option value="">Selecciona una opción...</option>
            {field.options && field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Form.Select>
        );
      default:
        return (
          <Form.Control
            type={field.type}
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

        {/* --- SELECTOR DE FAVORITOS --- */}
        {token && (
          <Form.Group className="mb-4">
            <Form.Label>Cargar Beneficiario Favorito</Form.Label>
            <Form.Select 
              value={selectedFavorite} 
              onChange={handleFavoriteSelect} 
              disabled={loadingFavorites}
              className="border-0 bg-light py-2 px-3"
            >
              <option value="">{loadingFavorites ? 'Cargando favoritos...' : 'Selecciona un contacto'}</option>
              {favorites.map(fav => (
                <option key={fav._id} value={fav._id}>
                  {fav.nickname}
                </option>
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
                  <Form.Control.Feedback type="invalid">
                    {errors[field.key]}
                  </Form.Control.Feedback>
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