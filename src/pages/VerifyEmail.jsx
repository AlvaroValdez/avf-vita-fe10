import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmailToken } from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de verificación no encontrado.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await verifyEmailToken(token);
        if (response.ok) {
          setSuccess(response.message || '¡Tu correo ha sido verificado exitosamente!');
        } else {
          throw new Error(response.error || 'Error al verificar el token.');
        }
      } catch (err) {
        setError(err.error || 'El token es inválido o ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="p-4 text-center" style={{ width: '450px' }}>
        <Card.Body>
          {loading && (
            <>
              <Spinner animation="border" style={{ color: 'var(--avf-primary)' }} />
              <p className="mt-3">Verificando tu cuenta...</p>
            </>
          )}

          {error && (
            <Alert variant="danger">
              <Alert.Heading>Error de Verificación</Alert.Heading>
              <p>{error}</p>
              <Button as={Link} to="/login" variant="danger">Ir a Iniciar Sesión</Button>
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <Alert.Heading>¡Verificación Exitosa!</Alert.Heading>
              <p>{success}</p>
              <Button as={Link} to="/login" style={{ backgroundColor: 'var(--avf-primary)' }}>
                Continuar a Iniciar Sesión
              </Button>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VerifyEmail;