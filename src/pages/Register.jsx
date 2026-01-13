import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { registerUser } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import ContractModal from '../components/ContractModal';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Estado para el mensaje de éxito
  const [loading, setLoading] = useState(false);

  // --- Compliance Contract State ---
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractAccepted, setContractAccepted] = useState(false);

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

    if (!contractAccepted) {
      setError('Debes leer y aceptar el Contrato de Mandato para continuar.');
      return;
    }

    setLoading(true);
    try {
      // Basic Fingerprint
      const fingerprint = `${navigator.userAgent}|${navigator.language}|${new Date().getTimezoneOffset()}`;

      const response = await registerUser({
        name,
        email,
        password,
        contractAccepted: true,
        contractVersion: 'v1.0',
        deviceFingerprint: fingerprint
      });

      if (response.ok) {
        // Check if email was sent successfully  
        if (response.emailSent === false) {
          setSuccess(response.message || 'Usuario registrado, pero el email de verificación no pudo ser enviado. Por favor, contacta a soporte.');
        } else {
          setSuccess(response.message || '¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta.');
        }
        // Clear form fields
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setContractAccepted(false);
      }
    } catch (err) {
      setError(err.error || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Se usa 'min-vh-100' para asegurar altura completa y 'py-5' para espaciado en móviles
    <Container className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '100vh' }}>
      <Card className="shadow-sm border-0" style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">Crear Cuenta</h3>
            <p className="text-muted small">Únete a Alyto en minutos</p>
          </div>

          {/* Si el registro fue exitoso, muestra el mensaje y oculta el formulario */}
          {success ? (
            <Alert variant="success" className="text-center">
              <div className="mb-2 fs-1">🎉</div>
              {success}
              <div className="mt-3">
                <Link to="/login" className="btn btn-primary fw-bold text-primary w-100">Iniciar Sesión</Link>
              </div>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Nombre Completo</Form.Label>
                <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ej: Juan Pérez" className="py-2" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Correo Electrónico</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" className="py-2" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Contraseña</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="py-2"
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
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted">Confirmar Contraseña</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repite tu contraseña"
                    className="py-2"
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ borderLeft: 'none' }}
                  >
                    <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </Button>
                </InputGroup>
              </Form.Group>

              {/* --- COMPLIANCE CHECKBOX --- */}
              <Form.Group className="mb-4">
                <Form.Check type="checkbox" id="contract-check">
                  <Form.Check.Input
                    type="checkbox"
                    checked={contractAccepted}
                    onChange={(e) => setContractAccepted(e.target.checked)}
                    required
                  />
                  <Form.Check.Label className="small text-muted ms-1">
                    He leído y acepto el <span
                      className="text-primary text-decoration-underline pointer-cursor"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowContractModal(true)}
                    >
                      Contrato de Mandato y Declaro el Origen Lícito de mis Fondos
                    </span>
                  </Form.Check.Label>
                </Form.Check>
              </Form.Group>

              {error && <Alert variant="danger" className="py-2 text-center small">{error}</Alert>}

              <div className="d-grid mb-3">
                <Button type="submit" variant="primary" disabled={loading} className="py-3 fw-bold text-primary">
                  {loading ? <Spinner as="span" size="sm" /> : 'Registrarse'}
                </Button>
              </div>
              <div className="text-center">
                <span className="text-muted small">¿Ya tienes cuenta? </span>
                <Link to="/login" className="text-accent fw-bold text-decoration-none">Inicia Sesión</Link>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>

      <ContractModal
        show={showContractModal}
        onHide={() => setShowContractModal(false)}
        onAccept={() => {
          setContractAccepted(true);
          setShowContractModal(false);
        }}
      />
    </Container>
  );
};

export default Register;