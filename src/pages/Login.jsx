import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Detectar si llegamos aquí por sesión expirada
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      setError('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
      toast.warning('Sesión Expirada', {
        description: 'Por tu seguridad, cerramos tu sesión después de 30 minutos de inactividad.',
        duration: 5000
      });

      // Limpiar el query param de la URL sin recargar
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('expired') === 'true') {
      setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      toast.warning('Sesión expirada', {
        description: 'Por seguridad, tu sesión ha caducado. Inicia sesión de nuevo.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    +
      e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        toast.success('¡Bienvenido de nuevo!'); // ✅ Login Toast
        navigate('/'); // Redirect to home instead of transactions
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center px-3" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm border-0 w-100" style={{ maxWidth: '400px' }}>
        <Card.Body className="p-4">
          <Card.Title as="h3" className="text-center mb-4 fw-bold text-primary">
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
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tu contraseña"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ borderLeft: 'none' }}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </Button>
              </InputGroup>
            </Form.Group>

            {/* --- NUEVO ENLACE DE RECUPERACIÓN --- */}
            <div className="text-end mb-4">
              <Link
                to="/forgot-password"
                className="text-decoration-none text-muted small"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

            <div className="d-grid">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="py-2"
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