import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/transactions'); // Redirect to the dashboard on successful login
      }
    } catch (err) {
      setError(err.message || 'Could not log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ width: '400px' }}>
        <Card.Body className="p-4">
          <Card.Title as="h3" className="text-center mb-4" style={{ color: 'var(--avf-primary)' }}>
            Iniciar Sesión
          </Card.Title>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="tu@correo.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Tu contraseña"
              />
            </Form.Group>
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}
            <div className="d-grid">
              <Button 
                type="submit" 
                disabled={loading}
                style={{ backgroundColor: 'var(--avf-primary)', borderColor: 'var(--avf-primary)' }}
              >
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Ingresar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;