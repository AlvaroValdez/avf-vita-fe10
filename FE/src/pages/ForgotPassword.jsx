import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await requestPasswordReset(email);
      if (response.ok) {
        setMessage(response.message || 'Correo enviado. Revisa tu bandeja de entrada.');
        setEmail(''); // Limpiar campo
      }
    } catch (err) {
      setError(err.error || 'Error al solicitar la recuperación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ width: '450px' }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-3" style={{ color: 'var(--avf-primary)' }}>Recuperar Contraseña</h3>
          <p className="text-muted text-center small mb-4">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="ejemplo@correo.com"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
              >
                {loading ? <Spinner size="sm" /> : 'Enviar Enlace'}
              </Button>
              <Link to="/login" className="btn btn-link text-decoration-none">
                Volver al Inicio de Sesión
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;