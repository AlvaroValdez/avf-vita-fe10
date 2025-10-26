import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { getUsers, updateUserRole } from '../services/api';
import { useAuth } from '../context/AuthContext'; // Para obtener el ID del usuario actual

const AdminUsers = () => {
  const { user: currentUser } = useAuth(); // Obtiene el usuario logueado actualmente
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Carga la lista de usuarios al montar el componente
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getUsers();
        if (response.ok) {
          setUsers(response.users);
        } else {
          throw new Error(response.error || 'No se pudieron cargar los usuarios.');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar usuarios.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Manejador para cambiar el rol de un usuario
  const handleRoleChange = async (userId, newRole) => {
    // Evita que el admin se quite su propio rol accidentalmente
    if (currentUser && currentUser.id === userId && newRole !== 'admin') {
        setError('No puedes quitarte el rol de administrador a ti mismo.');
        return;
    }

    setLoading(true); // Podríamos usar un estado de carga por fila en el futuro
    setError('');
    setSuccess('');
    try {
      const response = await updateUserRole(userId, newRole);
      if (response.ok) {
        // Actualiza la lista de usuarios localmente para reflejar el cambio
        setUsers(prevUsers => 
          prevUsers.map(u => u._id === userId ? { ...u, role: newRole } : u)
        );
        setSuccess(`Rol de ${response.user.name} actualizado.`);
      } else {
        throw new Error(response.error || 'No se pudo actualizar el rol.');
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el rol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Card>
        <Card.Header as="h4">Gestión de Usuarios</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {loading ? (
            <div className="text-center p-5"><Spinner animation="border" /></div>
          ) : (
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Actual</th>
                  <th>Cambiar Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="4" className="text-center text-muted">No hay usuarios registrados.</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={user.role === 'admin' ? 'primary' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td>
                        {/* El selector solo se muestra si NO es el usuario actual */}
                        {currentUser && currentUser.id !== user._id ? (
                          <Form.Select 
                            size="sm"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={loading} // Deshabilita mientras se guarda
                          >
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                          </Form.Select>
                        ) : (
                           <small className="text-muted"> (Usuario Actual)</small>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminUsers;