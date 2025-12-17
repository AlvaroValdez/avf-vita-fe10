import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams(); // Captura el token de la URL
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(token, password);
      if (response.ok) {
        setSuccess('¡Contraseña actualizada correctamente!');
        setTimeout(() => navigate('/login'), 3000); // Redirigir al login después de 3s
      }
    } catch (err) {
      setError(err.error || 'El enlace es inválido o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Card className="shadow-sm p-4" style={{ width: '450px' }}>
          <Alert variant="success" className="mb-0 text-center">
            <h4 className="alert-heading">¡Listo!</h4>
            <p>{success}</p>
            <hr />
            <Link to="/login" className="btn btn-success w-100">Iniciar Sesión Ahora</Link>
          </Alert>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ width: '450px' }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-4" style={{ color: 'var(--avf-primary)' }}>Nueva Contraseña</h3>
          
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nueva Contraseña</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Mínimo 6 caracteres"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                placeholder="Repite tu contraseña"
              />
            </Form.Group>

            <div className="d-grid">
              <Button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: 'var(--avf-primary)' }}
              >
                {loading ? <Spinner size="sm" /> : 'Cambiar Contraseña'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;