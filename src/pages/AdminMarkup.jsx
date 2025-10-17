import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { getMarkup, updateMarkup } from '../services/api'; // 1. Importa las nuevas funciones

const AdminMarkup = () => {
  const [markup, setMarkup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 2. Carga el valor actual de la comisión al montar el componente
  useEffect(() => {
    const fetchMarkup = async () => {
      try {
        const response = await getMarkup();
        if (response.ok) {
          setMarkup(response.markup);
        } else {
          throw new Error('No se pudo cargar la comisión.');
        }
      } catch (err) {
        setError(err.error || 'Error al cargar la configuración.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkup();
  }, []);

  // 3. Llama a la API para actualizar la comisión al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const numericMarkup = parseFloat(markup);
      if (isNaN(numericMarkup)) {
        throw new Error('El valor debe ser un número.');
      }
      const response = await updateMarkup(numericMarkup);
      if (response.ok) {
        setSuccess(`Comisión actualizada correctamente a ${response.markup}%`);
      } else {
        throw new Error('No se pudo actualizar la comisión.');
      }
    } catch (err) {
      setError(err.error || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && markup === '') {
    return <Container className="text-center p-5"><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="my-5" style={{ maxWidth: '700px' }}>
      <Card>
        <Card.Header as="h4">Gestión de Comisión (Markup)</Card.Header>
        <Card.Body>
          <p className="text-muted">
            Este es el porcentaje de ganancia que se aplica sobre la tasa de cambio base de Vita Wallet.
          </p>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Porcentaje de Comisión por Defecto (%)</Form.Label>
              <Form.Control 
                type="number" 
                step="0.01" 
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                placeholder="Ej: 3.5"
              />
            </Form.Group>
            
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}
            {success && <Alert variant="success" className="py-2">{success}</Alert>}
            
            <Button type="submit" disabled={loading} style={{ backgroundColor: 'var(--avf-primary)' }}>
              {loading ? <Spinner as="span" size="sm" /> : 'Guardar Cambios'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminMarkup;