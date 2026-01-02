import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { registerUser } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Estado para el mensaje de éxito
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      const response = await registerUser({ name, email, password });
      if (response.ok) {
        // --- CORRECCIÓN AQUÍ ---
        // Muestra el mensaje de éxito enviado por el backend
        setSuccess(response.message || '¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta.');
        // Opcionalmente, deshabilita el formulario o limpia los campos
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.error || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ width: '450px' }}>
        <Card.Body className="p-4">
          <Card.Title as="h3" className="text-center mb-4 fw-bold text-primary">
            Crear Cuenta
          </Card.Title>

          {/* Si el registro fue exitoso, muestra el mensaje y oculta el formulario */}
          {success ? (
            <Alert variant="success">
              {success}
              <div className="text-center mt-3">
                <Link to="/login" className="fw-bold">Ir a Iniciar Sesión</Link>
              </div>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre Completo</Form.Label>
                <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre y Apellido" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirmar Contraseña</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repite tu contraseña" />
              </Form.Group>

              {error && <Alert variant="danger" className="py-2">{error}</Alert>}

              <div className="d-grid">
                <Button type="submit" variant="primary" disabled={loading} className="py-2">
                  {loading ? <Spinner as="span" size="sm" /> : 'Registrarse'}
                </Button>
              </div>
              <div className="text-center mt-3">
                <Link to="/login">¿Ya tienes cuenta? Inicia Sesión</Link>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;