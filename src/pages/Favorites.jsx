import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Modal, Form, Alert, Badge } from 'react-bootstrap';
import { getBeneficiaries, deleteBeneficiary, updateBeneficiary, saveBeneficiary, getWithdrawalRules } from '../services/api';
import { useAppContext } from '../context/AppContext';
import DynamicBeneficiaryForm from '../components/remittance/DynamicBeneficiaryForm';

const Favorites = () => {
    const { countries } = useAppContext();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Estados Modal CREAR ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createCountry, setCreateCountry] = useState('');
    const [createRules, setCreateRules] = useState(null);
    const [loadingRules, setLoadingRules] = useState(false);

    // --- Estados Modal EDITAR (Solo Nombre) ---
    const [showEditModal, setShowEditModal] = useState(false);
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

    // --- LÓGICA CREAR ---
    const handleOpenCreate = () => {
        setCreateCountry('');
        setCreateRules(null);
        setShowCreateModal(true);
    };

    const handleCountrySelect = async (e) => {
        const countryCode = e.target.value;
        setCreateCountry(countryCode);
        if (!countryCode) {
            setCreateRules(null);
            return;
        }
        setLoadingRules(true);
        try {
            const res = await getWithdrawalRules({ country: countryCode });
            if (res.ok) {
                setCreateRules(res.data.rules[countryCode.toLowerCase()]?.fields || []);
            }
        } catch (error) {
            alert('Error al cargar reglas del país.');
        } finally {
            setLoadingRules(false);
        }
    };

    const handleSaveNew = async (formData) => {
        try {
            const nickname = `${formData.beneficiary_first_name} ${formData.beneficiary_last_name} (${createCountry})`;
            await saveBeneficiary({
                nickname,
                country: createCountry,
                beneficiaryData: formData
            });
            setShowCreateModal(false);
            loadFavorites();
        } catch (error) {
            alert('Error al guardar favorito: ' + (error.error || error.message));
        }
    };

    // --- LÓGICA EDITAR/ELIMINAR ---
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
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        try {
            await updateBeneficiary(editingFav._id, { nickname: newNickname });
            setShowEditModal(false);
            loadFavorites();
        } catch (e) { alert('Error al actualizar'); }
    };

    return (
        <Container className="my-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: 'var(--avf-primary)' }}>Mis Contactos</h2>
                <Button onClick={handleOpenCreate} style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}>
                    + Nuevo Contacto
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    {loading ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
                        favorites.length === 0 ? <Alert variant="info">No tienes contactos guardados aún.</Alert> :
                            <ListGroup variant="flush">
                                {favorites.map(fav => (
                                    <ListGroup.Item key={fav._id} className="d-flex justify-content-between align-items-center flex-wrap">
                                        <div className="mb-2 mb-md-0">
                                            <h5 className="mb-1">{fav.nickname}</h5>
                                            <Badge bg="light" text="dark" className="border me-2">{fav.country}</Badge>
                                            <small className="text-muted">
                                                {fav.beneficiaryData?.bank_name || 'Banco'} - {fav.beneficiaryData?.account_number || fav.beneficiaryData?.account_bank || 'Cuenta'}
                                            </small>
                                        </div>
                                        <div>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(fav)}>Renombrar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(fav._id)}>Eliminar</Button>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                    )}
                </Card.Body>
            </Card>

            {/* --- MODAL CREAR --- */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Nuevo Contacto</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-4">
                        <Form.Label>País del Beneficiario</Form.Label>
                        <Form.Select value={createCountry} onChange={handleCountrySelect}>
                            <option value="">Selecciona un país...</option>
                            {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </Form.Select>
                    </Form.Group>

                    {loadingRules && <div className="text-center"><Spinner size="sm" /> Cargando formulario...</div>}

                    {createRules && (
                        <DynamicBeneficiaryForm
                            fields={createRules}
                            onSubmit={handleSaveNew}
                            submitLabel="Guardar Contacto"
                        />
                    )}
                </Modal.Body>
            </Modal>

            {/* --- MODAL EDITAR --- */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton><Modal.Title>Editar Nombre</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Nombre / Apodo</Form.Label>
                        <Form.Control type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleUpdate}>Guardar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Favorites;