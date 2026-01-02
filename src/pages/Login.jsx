import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

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
        toast.success('¡Bienvenido de nuevo!'); // ✅ Login Toast
        navigate('/transactions');
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm border-0" style={{ width: '400px' }}>
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

            <Form.Group className="mb-2">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Tu contraseña"
              />
            </Form.Group>

            {/* --- NUEVO ENLACE DE RECUPERACIÓN --- */}
            <div className="text-end mb-4">
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.9rem', textDecoration: 'none', color: 'var(--avf-secondary)' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <div className="d-grid">
              <Button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: 'var(--avf-primary)', borderColor: 'var(--avf-primary)' }}
              >
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Ingresar'}
              </Button>
            </div>

            <div className="text-center mt-3 text-muted small">
              ¿No tienes cuenta? <Link to="/register" style={{ textDecoration: 'none', fontWeight: 'bold' }}>Regístrate aquí</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;