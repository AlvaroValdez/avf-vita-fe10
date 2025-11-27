import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { getBeneficiaries, deleteBeneficiary, updateBeneficiary } from '../services/api';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados Modal Editar
    const [showModal, setShowModal] = useState(false);
    const [editingFav, setEditingFav] = useState(null);
    const [newNickname, setNewNickname] = useState('');

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const res = await getBeneficiaries();
            if (res.ok) setFavorites(res.beneficiaries);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadFavorites(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este contacto?')) return;
        try {
            await deleteBeneficiary(id);
            loadFavorites();
        } catch (e) { alert('Error al eliminar'); }
    };

    const handleEdit = (fav) => {
        setEditingFav(fav);
        setNewNickname(fav.nickname);
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            await updateBeneficiary(editingFav._id, { nickname: newNickname });
            setShowModal(false);
            loadFavorites();
        } catch (e) { alert('Error al actualizar'); }
    };

    return (
        <Container className="my-5">
            <h2 className="mb-4" style={{ color: 'var(--avf-primary)' }}>Mis Contactos Favoritos</h2>
            <Card className="shadow-sm border-0">
                <Card.Body>
                    {loading ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
                        favorites.length === 0 ? <Alert variant="info">No tienes contactos guardados aún.</Alert> :
                            <ListGroup variant="flush">
                                {favorites.map(fav => (
                                    <ListGroup.Item key={fav._id} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1">{fav.nickname}</h5>
                                            <small className="text-muted">
                                                {fav.country} - {fav.beneficiaryData?.bank_name || 'Banco'} - {fav.beneficiaryData?.account_number || 'Cuenta'}
                                            </small>
                                        </div>
                                        <div>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(fav)}>Editar Nombre</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(fav._id)}>Eliminar</Button>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>Editar Contacto</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Nombre / Apodo</Form.Label>
                        <Form.Control type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave}>Guardar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Favorites;