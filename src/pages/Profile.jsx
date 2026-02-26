import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Spinner, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import KycLevel2Form from '../components/auth/KycLevel2Form';
import KybLevel2Form from '../components/auth/KybLevel2Form';
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
    <div style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', paddingBottom: '80px', paddingTop: '20px' }}>
      <Container className="px-3" style={{ maxWidth: '600px' }}>

        {/* TOP NAVBAR REPLACEMENT FOR THIS VIEW (Optional back button if mobile) 
        <div className="d-flex justify-content-between mb-4 mt-2">
          <i className="bi bi-arrow-left fs-4" onClick={() => window.history.back()} style={{cursor: 'pointer'}}></i>
          <i className="bi bi-gear fs-4" style={{cursor: 'pointer'}}></i>
        </div>
        */}

        {/* --- 1. HEADER ROW: Texts Left, Avatar Right --- */}
        <div className="d-flex justify-content-between align-items-center mb-4 mt-4">

          <div className="text-start">
            <h1 className="fw-normal mb-0" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>
              {user?.name || 'Usuario'}
            </h1>
            <div className="text-secondary" style={{ fontSize: '1.1rem' }}>
              {user?.email}
            </div>
            <div className="text-secondary mt-1">
              <Badge bg="secondary" className="fw-normal rounded-pill px-3 py-1 bg-opacity-25 text-light border border-secondary">
                Cuenta {user?.accountType === 'business' ? 'Empresa' : 'Personal'}
              </Badge>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            {/* AVATAR INTERACTIVO */}
            <div
              onClick={handleAvatarClick}
              className="rounded-circle overflow-hidden shadow"
              style={{
                width: '90px', height: '90px',
                backgroundColor: '#1C1C1E', margin: '0 auto',
                position: 'relative', cursor: 'pointer',
                backgroundImage: user?.avatar ? `url(${user.avatar})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #333'
              }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
              {uploadingAvatar ? (
                <Spinner animation="border" size="sm" variant="light" />
              ) : (
                !user?.avatar && <span style={{ fontSize: '32px', color: '#666' }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>

        </div>

        {/* --- 2. FOLLOWERS / FOLLOWING EQUIVALENT (KYC Status) --- */}
        <div className="d-flex mb-4">
          <div className="me-5">
            <div className="text-uppercase text-secondary mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Nivel KYC</div>
            <div className="fs-5 fw-medium text-white">{user?.kyc?.level || 1}</div>
          </div>
          <div>
            <div className="text-uppercase text-secondary mb-1" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Estado</div>
            <div className="fs-5 fw-medium text-white d-flex align-items-center">
              {user?.kyc?.status === 'approved' ? (
                <><span className="text-success me-2">●</span> Verificado</>
              ) : user?.kyc?.status === 'pending' ? (
                <><span className="text-warning me-2">●</span> En Revisión</>
              ) : (
                <><span className="text-secondary me-2">●</span> Básico</>
              )}
            </div>
          </div>
        </div>

        {/* --- 3. ACTIONS ROW --- */}
        <div className="d-flex gap-3 mb-5">
          <Button variant="outline-light" className="rounded-pill px-4 fw-normal" style={{ fontSize: '0.9rem' }} onClick={handleAvatarClick}>
            Editar Foto
          </Button>
          <Button variant="outline-light" className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
            <i className="bi bi-person-plus"></i>
          </Button>
        </div>

        <hr style={{ borderColor: '#333' }} className="mb-4" />

        {/* --- 4. PRACTICE STATS EQUIVALENT (Limits & Info) --- */}
        <div className="mb-4">
          <div className="text-uppercase text-secondary mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Límites Transaccionales</div>

          <Row className="text-center text-md-start">
            <Col xs={3}>
              <div className="fs-3 fw-normal text-white">{user?.kyc?.level || 1}</div>
              <div className="text-secondary text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Nivel<br />Actual</div>
            </Col>
            <Col xs={4}>
              <div className="fs-3 fw-normal text-white">450k</div>
              <div className="text-secondary text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Límite<br />Diario</div>
            </Col>
            <Col xs={5}>
              <div className="fs-3 fw-normal text-success">
                {user?.kyc?.level === 3 ? 'Ilimitado' : (user?.kyc?.level === 2 ? '4.5M' : '450k')}
              </div>
              <div className="text-secondary text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Monto<br />Permitido</div>
            </Col>
          </Row>
        </div>

        <hr style={{ borderColor: '#333' }} className="mb-4" />

        {/* --- 5. MY CLASSES EQUIVALENT (Detailed Info & Verification) --- */}
        <div className="mb-4">
          <div className="text-uppercase text-secondary mb-3" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Datos de Seguridad</div>

          {user?.accountType === 'business' ? (
            <>
              <div className="d-flex justify-content-between py-3 border-bottom" style={{ borderColor: '#333' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-briefcase text-white me-3 fs-5"></i>
                  <span className="text-light">Razón Social</span>
                </div>
                <div className="text-secondary">{user?.business?.name || 'Pendiente'}</div>
              </div>
              <div className="d-flex justify-content-between py-3 border-bottom" style={{ borderColor: '#333' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-hash text-white me-3 fs-5"></i>
                  <span className="text-light">ID Fiscal</span>
                </div>
                <div className="text-secondary">{user?.business?.taxId || 'Pendiente'}</div>
              </div>
            </>
          ) : (
            <>
              <div className="d-flex justify-content-between py-3 border-bottom" style={{ borderColor: '#222' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-telephone text-white me-3 fs-5"></i>
                  <span className="text-light">Teléfono</span>
                </div>
                <div className="text-secondary">{user?.phoneNumber || 'No registrado'}</div>
              </div>
              <div className="d-flex justify-content-between py-3 border-bottom" style={{ borderColor: '#222' }}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-card-text text-white me-3 fs-5"></i>
                  <span className="text-light">Documento</span>
                </div>
                <div className="text-secondary">{user?.documentNumber || 'No registrado'}</div>
              </div>
            </>
          )}

        </div>

        {/* Formulario de Aumento de Nivel embebido al final */}
        {(!user?.kyc?.status || user?.kyc?.status !== 'approved') && (
          <div className="mt-5 p-4 rounded" style={{ backgroundColor: '#1A1A1C' }}>
            <h5 className="text-white mb-3 fw-normal">Sube de Nivel KYC</h5>
            <p className="text-secondary small mb-4">Aumenta tus límites de envío subiendo tus documentos.</p>
            <div className="bg-white rounded p-3">
              {user?.accountType === 'business' ? <KybLevel2Form /> : <KycLevel2Form />}
            </div>
          </div>
        )}

      </Container>
    </div>
  );
};

export default Profile;