import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Alert, Button, Form, Badge, Modal, Row, Col } from 'react-bootstrap';
import { getUsers, updateUserRole, adminUpdateUser, deleteUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para Modal de Edición
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Estados para Modal de Eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      if (response.ok) setUsers(response.users);
    } catch (err) {
      setError('Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (currentUser && currentUser.id === userId && newRole !== 'admin') {
      alert('No puedes quitarte el rol de administrador a ti mismo.');
      return;
    }
    try {
      await updateUserRole(userId, newRole);
      fetchUsers(); // Recargar lista
    } catch (err) {
      alert('Error al cambiar rol.');
    }
  };

  // Abrir Modal
  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      documentNumber: user.documentNumber || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      isEmailVerified: user.isEmailVerified,
    });
    setShowModal(true);
  };

  // Guardar Cambios del Modal
  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await adminUpdateUser(editingUser._id, editForm);
      setShowModal(false);
      fetchUsers(); // Recargar lista
    } catch (err) {
      alert(err.error || 'Error al guardar usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    setDeleting(true);
    try {
      await deleteUser(userToDelete._id);
      setShowDeleteModal(false);
      fetchUsers(); // Recargar lista
    } catch (err) {
      alert(err.error || 'Error al eliminar usuario.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container className="my-5">
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white py-3">
          <h4 className="mb-0" style={{ color: 'var(--avf-primary)' }}>Gestión de Usuarios</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? <div className="text-center p-5"><Spinner animation="border" /></div> : (
            <Table hover responsive size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Doc</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="fw-bold">{u.name}</div>
                      <small className="text-muted">{u.firstName} {u.lastName}</small>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.documentNumber || '-'}</td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={currentUser?.id === u._id}
                        style={{ width: '120px' }}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </td>
                    <td>
                      {u.isEmailVerified ? <Badge bg="success">Verificado</Badge> : <Badge bg="warning" text="dark">No Verif.</Badge>}
                      <div className="mt-1">{u.isProfileComplete ? <Badge bg="info">KYC Completo</Badge> : <Badge bg="secondary">Sin KYC</Badge>}</div>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEditClick(u)}
                        className="me-2"
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteClick(u)}
                        disabled={currentUser?.id === u._id}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- MODAL DE EDICIÓN --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario: {editingUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nombre de Usuario</Form.Label>
                  <Form.Control type="text" name="name" value={editForm.name} onChange={handleFormChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" value={editForm.email} onChange={handleFormChange} />
                </Form.Group>
              </Col>
            </Row>
            <h6 className="mt-4 text-muted">Datos Personales (KYC)</h6>
            <hr />
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nombres Legales</Form.Label>
                  <Form.Control type="text" name="firstName" value={editForm.firstName} onChange={handleFormChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Apellidos Legales</Form.Label>
                  <Form.Control type="text" name="lastName" value={editForm.lastName} onChange={handleFormChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Número Documento</Form.Label>
                  <Form.Control type="text" name="documentNumber" value={editForm.documentNumber} onChange={handleFormChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control type="text" name="phoneNumber" value={editForm.phoneNumber} onChange={handleFormChange} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control type="text" name="address" value={editForm.address} onChange={handleFormChange} />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Email Verificado Manualmente"
              name="isEmailVerified"
              checked={editForm.isEmailVerified}
              onChange={handleFormChange}
              className="mt-3 text-primary fw-bold"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveUser} disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* --- MODAL DE CONFIRM ACIÓN DE ELIMINACIÓN --- */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            ¿Estás seguro que deseas eliminar al usuario <strong>{userToDelete?.name}</strong>?
          </Alert>
          <p className="text-muted small mb-0">
            Esta acción es permanente y no se puede deshacer. Se eliminarán todos los datos asociados.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? <Spinner size="sm" /> : 'Eliminar Usuario'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers;