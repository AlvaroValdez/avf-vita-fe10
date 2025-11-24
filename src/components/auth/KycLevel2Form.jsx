import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, Image } from 'react-bootstrap';
import { uploadKycDocuments } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const KycLevel2Form = ({ onSuccess }) => {
  const { user, updateUserSession } = useAuth();
  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  });
  const [previews, setPreviews] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (ej: < 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`El archivo para ${fieldName} es demasiado grande (max 5MB).`);
        return;
      }
      
      setFiles(prev => ({ ...prev, [fieldName]: file }));
      
      // Crear preview local
      const objectUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [fieldName]: objectUrl }));
      setError(''); // Limpiar errores previos
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.idFront || !files.idBack || !files.selfie) {
      setError('Por favor, sube las 3 imágenes requeridas.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('idFront', files.idFront);
      formData.append('idBack', files.idBack);
      formData.append('selfie', files.selfie);

      const response = await uploadKycDocuments(formData);

      if (response.ok) {
        setSuccess('Documentos enviados correctamente. Tu cuenta está en revisión.');
        
        // Actualizamos la sesión del usuario con los nuevos datos de KYC
        // (Asumiendo que el backend devuelve la estructura 'kyc' actualizada)
        const updatedUser = { ...user, kyc: response.kyc };
        updateUserSession(updatedUser);

        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      }
    } catch (err) {
      setError(err.error || 'Error al subir los documentos. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario ya está verificado o en revisión, mostramos un mensaje
  if (user?.kyc?.level >= 2 || user?.kyc?.status === 'pending') {
      return (
          <Alert variant="info">
              <Alert.Heading>Estado de Verificación</Alert.Heading>
              <p>
                  Estado actual: <strong>{user.kyc.status.toUpperCase()}</strong>.
                  {user.kyc.status === 'pending' && ' Tus documentos están siendo revisados por nuestro equipo.'}
                  {user.kyc.status === 'approved' && ' ¡Tu identidad ha sido verificada!'}
              </p>
          </Alert>
      );
  }

  return (
    <Card className="shadow-sm border-0 mb-4">
      <Card.Body className="p-4">
        <h4 className="mb-3 text-primary">Verificación de Identidad (Nivel 2)</h4>
        <p className="text-muted small mb-4">
          Para aumentar tus límites de envío, necesitamos verificar tu identidad. 
          Sube una foto clara de tu documento y una selfie.
        </p>

        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">Documento (Frente)</Form.Label>
                <Form.Control 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'idFront')} 
                />
                {previews.idFront && <Image src={previews.idFront} thumbnail className="mt-2" style={{maxHeight: '150px'}} />}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-bold">Documento (Reverso)</Form.Label>
                <Form.Control 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'idBack')} 
                />
                {previews.idBack && <Image src={previews.idBack} thumbnail className="mt-2" style={{maxHeight: '150px'}} />}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Selfie (Sosteniendo tu documento)</Form.Label>
            <Form.Control 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'selfie')} 
            />
             <Form.Text className="text-muted">Asegúrate de que tu rostro esté bien iluminado.</Form.Text>
             {previews.selfie && <div className="mt-2"><Image src={previews.selfie} thumbnail style={{maxHeight: '200px'}} /></div>}
          </Form.Group>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="d-grid">
            <Button 
              type="submit" 
              disabled={loading} 
              style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
              className="py-2 fw-bold"
            >
              {loading ? <><Spinner size="sm" animation="border" className="me-2"/> Subiendo documentos...</> : 'Enviar para Revisión'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default KycLevel2Form;