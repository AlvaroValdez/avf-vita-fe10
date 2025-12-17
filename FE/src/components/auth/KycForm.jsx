import React, { useState } from 'react';
import { Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { updateUserProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const KycForm = ({ onSuccess }) => {
  const { user, updateUserSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado inicial del formulario con datos existentes si los hay
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    documentType: user?.documentType || 'DNI',
    documentNumber: user?.documentNumber || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    birthDate: user?.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await updateUserProfile(formData);
      if (response.ok) {
        setSuccess('¡Información guardada correctamente!');
        // Actualizamos el contexto global con los nuevos datos y el flag isProfileComplete
        updateUserSession(response.user);
        
        // Si el componente padre pasó una función callback, la ejecutamos (ej: para cerrar modal)
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }
      }
    } catch (err) {
      setError(err.error || 'Ocurrió un error al guardar tu información.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <h4 className="mb-3 text-center" style={{ color: 'var(--avf-primary)' }}>Completa tu Perfil</h4>
        <p className="text-muted text-center small mb-4">
          Para cumplir con las regulaciones y proteger tu cuenta, necesitamos algunos datos adicionales antes de realizar envíos.
        </p>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombres</Form.Label>
                <Form.Control 
                  type="text" name="firstName" 
                  value={formData.firstName} onChange={handleChange} required 
                  placeholder="Ej: Juan Andrés"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Apellidos</Form.Label>
                <Form.Control 
                  type="text" name="lastName" 
                  value={formData.lastName} onChange={handleChange} required 
                  placeholder="Ej: Pérez López"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo Doc.</Form.Label>
                <Form.Select name="documentType" value={formData.documentType} onChange={handleChange}>
                  <option value="DNI">DNI</option>
                  <option value="RUT">RUT</option>
                  <option value="CE">Cédula Extranjería</option>
                  <option value="PASSPORT">Pasaporte</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Número de Documento</Form.Label>
                <Form.Control 
                  type="text" name="documentNumber" 
                  value={formData.documentNumber} onChange={handleChange} required 
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Teléfono Móvil</Form.Label>
            <Form.Control 
              type="tel" name="phoneNumber" 
              value={formData.phoneNumber} onChange={handleChange} required 
              placeholder="+56 9 1234 5678"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dirección Residencial</Form.Label>
            <Form.Control 
              type="text" name="address" 
              value={formData.address} onChange={handleChange} required 
              placeholder="Calle, Número, Comuna, Ciudad"
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Fecha de Nacimiento</Form.Label>
            <Form.Control 
              type="date" name="birthDate" 
              value={formData.birthDate} onChange={handleChange} required 
            />
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-grid">
            <Button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
              className="py-2 fw-bold"
            >
              {loading ? <Spinner size="sm" /> : 'Guardar y Continuar'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default KycForm;