import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Spinner, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import KycLevel2Form from '../components/auth/KycLevel2Form';
import { uploadAvatar } from '../services/api';
import logo from '../assets/images/logo.png';

const Profile = () => {
  const { user, updateUserSession } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const getKycStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge bg="success">Verificado</Badge>;
      case 'pending': return <Badge bg="warning" text="dark">En Revisión</Badge>;
      case 'rejected': return <Badge bg="danger">Rechazado</Badge>;
      default: return <Badge bg="secondary">No Verificado</Badge>;
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click(); // Simula clic en el input oculto
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Límite 2MB
      alert("La imagen es muy pesada (máx 2MB).");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await uploadAvatar(formData);
      if (response.ok) {
        // response.avatar es la URL nueva
        // Debemos fusionarla con el usuario actual
        const updatedUser = { ...user, avatar: response.avatar };
        updateUserSession(updatedUser);
      }
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <Container className="my-4">
      {/* Logo Header */}
      <div className="text-center mb-4">
        <img src={logo} alt="Alyto" style={{ height: '90px' }} />
      </div>

      <h2 className="mb-4 fw-bold" style={{ color: 'var(--avf-primary)' }}>Mi Perfil</h2>
      <Row>
        {/* --- Columna Izquierda: Datos Personales --- */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="text-center mb-3">

                {/* --- AVATAR INTERACTIVO --- */}
                <div
                  onClick={handleAvatarClick}
                  style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    backgroundColor: '#e9ecef', margin: '0 auto',
                    position: 'relative', cursor: 'pointer', overflow: 'hidden',
                    backgroundImage: user?.avatar ? `url(${user.avatar})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid var(--avf-secondary)'
                  }}
                >
                  {/* Input oculto */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />

                  {uploadingAvatar ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    !user?.avatar && <span style={{ fontSize: '32px', color: '#6c757d' }}>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}

                  {/* Overlay al hacer hover (opcional, visual) */}
                  <div className="avatar-overlay" style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px' }}>
                    EDITAR
                  </div>
                </div>

                <h5 className="mt-3">{user?.name}</h5>
                <p className="text-muted small">{user?.email}</p>

                <div className="mb-2">
                  Nivel KYC: <strong className="fs-5">{user?.kyc?.level || 1}</strong>
                </div>
                <div>{getKycStatusBadge(user?.kyc?.status)}</div>
              </div>

              <hr />

              <ListGroup variant="flush" className="small">
                <ListGroup.Item className="px-0">
                  <strong>Teléfono:</strong> <br /> {user?.phoneNumber || 'No registrado'}
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <strong>Documento ({user?.documentType}):</strong> <br /> {user?.documentNumber || 'No registrado'}
                </ListGroup.Item>
                <ListGroup.Item className="px-0">
                  <strong>Dirección:</strong> <br /> {user?.address || 'No registrado'}
                </ListGroup.Item>
              </ListGroup>

              <hr />

              {/* Transaction Limits Section */}
              <div className="mt-3">
                <h6 className="fw-bold mb-3">Límites de Transacción</h6>
                <div className="small">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Nivel Actual:</span>
                    <Badge bg="primary">{user?.kyc?.level || 1}</Badge>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Límite por Transacción:</span>
                    <strong>
                      {user?.kyc?.level === 3 ? '$50.000.000' :
                        user?.kyc?.level === 2 ? '$4.500.000' :
                          '$450.000'} CLP
                    </strong>
                  </div>
                  {user?.kyc?.level < 3 && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <small className="text-muted">
                        ⬆️ Nivel {(user?.kyc?.level || 1) + 1}: {
                          (user?.kyc?.level || 1) === 1 ? '$4.500.000' : '$50.000.000'
                        } CLP
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* --- Columna Derecha: Verificación de Identidad --- */}
        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h4 style={{ color: 'var(--avf-primary)' }}>Aumentar Límites (Nivel 2)</h4>
            </Card.Header>
            <Card.Body>
              <KycLevel2Form />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;