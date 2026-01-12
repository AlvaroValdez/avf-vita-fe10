import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Button } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmailToken } from '../services/api';
import logo from '../assets/images/logo.png'; // Asegúrate de que este path sea correcto

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se encontró el token de verificación.');
      return;
    }

    const verifyToken = async () => {
      try {
        // Simular un pequeño delay para que se vea la animación de carga (opcional)
        // await new Promise(resolve => setTimeout(resolve, 1500)); 

        const response = await verifyEmailToken(token);
        if (response.ok) {
          setStatus('success');
          setMessage(response.message || '¡Tu correo ha sido verificado exitosamente!');
        } else {
          throw new Error(response.error || 'Error al verificar el token.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.error || err.message || 'El enlace es inválido o ha expirado.');
        console.error('[VerifyEmail] Error:', err);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100"
      style={{ backgroundColor: '#f8f9fa' }}>
      <Container style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <img src={logo} alt="Alyto Logo" height="60" className="mb-3" />
        </div>

        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <div className={`h-1 w-100 ${status === 'loading' ? 'bg-primary' :
              status === 'success' ? 'bg-success' : 'bg-danger'
            }`} style={{ height: '6px' }}></div>

          <Card.Body className="p-5 text-center">
            {status === 'loading' && (
              <>
                <div className="mb-4">
                  <Spinner animation="grow" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                </div>
                <h4 className="fw-bold text-dark mb-2">Verificando...</h4>
                <p className="text-muted">Estamos validando tu enlace de registro.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mb-4 text-success">
                  <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="fw-bold text-dark mb-3">¡Cuenta Verificada!</h3>
                <p className="text-muted mb-4">{message}</p>

                <Button as={Link} to="/login" variant="primary" size="lg" className="w-100 rounded-pill fw-bold">
                  Iniciar Sesión
                </Button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mb-4 text-danger">
                  <i className="bi bi-x-circle-fill" style={{ fontSize: '4rem' }}></i>
                </div>
                <h4 className="fw-bold text-dark mb-3">Enlace Inválido</h4>
                <p className="text-secondary mb-4">{message}</p>

                <div className="d-grid gap-2">
                  <Button as={Link} to="/login" variant="outline-dark" className="rounded-pill">
                    Volver al Inicio
                  </Button>
                  <Link to="/register" className="text-muted small text-decoration-none mt-2">
                    ¿Necesites ayuda? Contáctanos
                  </Link>
                </div>
              </>
            )}
          </Card.Body>
        </Card>

        <div className="text-center mt-4">
          <p className="text-muted small">&copy; {new Date().getFullYear()} Alyto. Todos los derechos reservados.</p>
        </div>
      </Container>
    </div>
  );
};

export default VerifyEmail;