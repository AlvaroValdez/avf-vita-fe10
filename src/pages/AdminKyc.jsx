import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, Row, Col, Image, Spinner, Alert } from 'react-bootstrap';

import { getPendingKycUsers, reviewKycUser, apiClient } from '../services/api';

const AdminKyc = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el Modal de Revisión
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Cargar usuarios pendientes
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await getPendingKycUsers();
      if (response.ok) {
        setUsers(response.users);
      }
    } catch (err) {
      setError('Error al cargar solicitudes pendientes.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir el modal con los datos del usuario seleccionado
  const handleInspect = async (userPreview) => {
    setProcessing(true);
    try {
      // Fetch full details from the new endpoint
      const response = await apiClient.get(`/admin/kyc/${userPreview._id}`);
      if (response.data.ok) {
        setSelectedUser(response.data.user);
        setShowRejectInput(false);
        setRejectReason('');
        setShowModal(true);
      }
    } catch (err) {
      alert("Error al cargar los detalles del usuario.");
    } finally {
      setProcessing(false);
    }
  };

  // Enviar la decisión (Aprobar o Rechazar)
  const handleDecision = async (action) => {
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true); // Mostrar campo para motivo
      return;
    }
    if (action === 'reject' && !rejectReason) {
      alert("Por favor, ingresa un motivo para el rechazo.");
      return;
    }

    setProcessing(true);
    try {
      const response = await reviewKycUser(selectedUser._id, action, rejectReason);
      if (response.ok) {
        // Cerrar y refrescar lista
        setShowModal(false);
        fetchPendingUsers();
        alert(action === 'approve' ? 'Usuario aprobado correctamente.' : 'Usuario rechazado.');
      }
    } catch (err) {
      alert(err.error || "Error al procesar la solicitud.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Container className="my-5">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3">
          <h4 className="mb-0" style={{ color: 'var(--avf-primary)' }}>Cola de Revisión KYC</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : users.length === 0 ? (
            <Alert variant="success">No hay solicitudes pendientes. ¡Todo al día!</Alert>
          ) : (
            <Table hover responsive className="align-middle">
              <thead>
                <tr>
                  <th>Fecha Solicitud</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{new Date(u.kyc.submittedAt).toLocaleDateString()}</td>
                    <td className="fw-bold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <Badge bg={u.accountType === 'business' ? 'info' : 'secondary'} text={u.accountType === 'business' ? 'dark' : 'white'}>
                        {u.accountType === 'business' ? 'EMPRESA' : 'PERSONAL'}
                      </Badge>
                    </td>
                    <td><Badge bg="warning" text="dark">PENDIENTE</Badge></td>
                    <td>
                      <Button size="sm" variant="outline-primary" onClick={() => handleInspect(u)}>
                        Revisar Documentos
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- MODAL DE REVISIÓN --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Revisando: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              {selectedUser.accountType === 'business' ? (
                <div className="bg-light p-3 rounded mb-4">
                  <h6 className="fw-bold text-primary mb-2">Información Corporativa</h6>
                  <p className="mb-1"><strong>Razón Social:</strong> {selectedUser.business?.name}</p>
                  <p className="mb-1"><strong>ID Fiscal:</strong> {selectedUser.business?.taxId}</p>
                  <p className="mb-1"><strong>Dirección:</strong> {selectedUser.business?.registeredAddress}</p>
                </div>
              ) : (
                <div className="bg-light p-3 rounded mb-4">
                  <h6 className="fw-bold text-primary mb-2">Información Personal</h6>
                  <p className="mb-1"><strong>Documento:</strong> {selectedUser.documentType} {selectedUser.documentNumber}</p>
                  <p className="mb-1"><strong>Teléfono:</strong> {selectedUser.phoneNumber || 'No registrado'}</p>
                </div>
              )}

              <h6 className="text-muted mb-3">Documentos Presentados</h6>
              <Row className="g-3 mb-4">
                {selectedUser.accountType === 'business' ? (
                  <>
                    <Col md={6}>
                      <div className="border rounded p-2 text-center">
                        <small className="d-block text-muted mb-2">Acta de Constitución</small>
                        <div className="p-4 bg-white mb-2">
                          <i className="bi bi-file-earmark-pdf fs-1 text-danger"></i>
                        </div>
                        <Button variant="primary" size="sm" href={selectedUser.business?.documents?.incorporation} target="_blank">Abrir Documento</Button>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="border rounded p-2 text-center">
                        <small className="d-block text-muted mb-2">ID Fiscal (NIT/RUT)</small>
                        <div className="p-4 bg-white mb-2">
                          <i className="bi bi-file-earmark-pdf fs-1 text-danger"></i>
                        </div>
                        <Button variant="primary" size="sm" href={selectedUser.business?.documents?.taxIdCard} target="_blank">Abrir Documento</Button>
                      </div>
                    </Col>
                  </>
                ) : (
                  <>
                    <Col md={4}>
                      <div className="border rounded p-2 text-center">
                        <small className="d-block text-muted mb-2">Frente DNI</small>
                        <Image src={selectedUser.kyc.documents?.idFront} fluid rounded style={{ maxHeight: '200px' }} alt="Frente" />
                        <Button variant="link" size="sm" href={selectedUser.kyc.documents?.idFront} target="_blank">Ver original</Button>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-2 text-center">
                        <small className="d-block text-muted mb-2">Reverso DNI</small>
                        <Image src={selectedUser.kyc.documents?.idBack} fluid rounded style={{ maxHeight: '200px' }} alt="Reverso" />
                        <Button variant="link" size="sm" href={selectedUser.kyc.documents?.idBack} target="_blank">Ver original</Button>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="border rounded p-2 text-center">
                        <small className="d-block text-muted mb-2">Selfie</small>
                        <Image src={selectedUser.kyc.documents?.selfie} fluid rounded style={{ maxHeight: '200px' }} alt="Selfie" />
                        <Button variant="link" size="sm" href={selectedUser.kyc.documents?.selfie} target="_blank">Ver original</Button>
                      </div>
                    </Col>
                  </>
                )}
              </Row>

              {showRejectInput && (
                <Form.Group className="mb-3 bg-light p-3 rounded">
                  <Form.Label className="fw-bold text-danger">Motivo del Rechazo:</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ej: La foto del documento está borrosa..."
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={processing}>
            Cancelar
          </Button>

          {!showRejectInput && (
            <>
              <Button variant="danger" onClick={() => handleDecision('reject')} disabled={processing}>
                Rechazar
              </Button>
              <Button variant="success" onClick={() => handleDecision('approve')} disabled={processing}>
                {processing ? <Spinner size="sm" /> : 'Aprobar Verificación'}
              </Button>
            </>
          )}

          {showRejectInput && (
            <Button variant="danger" onClick={() => handleDecision('reject')} disabled={processing}>
              {processing ? <Spinner size="sm" /> : 'Confirmar Rechazo'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminKyc;