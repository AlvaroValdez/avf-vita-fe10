import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Modal, Form, Alert, Badge, Dropdown } from 'react-bootstrap';
import { getBeneficiaries, deleteBeneficiary, updateBeneficiary, saveBeneficiary, getWithdrawalRules } from '../services/api';
import { useAppContext } from '../context/AppContext';
import DynamicBeneficiaryForm from '../components/remittance/DynamicBeneficiaryForm';
import logo from '../assets/images/logo.png';

// Import flags
import flagCL from '../assets/flags/cl.svg';
import flagCO from '../assets/flags/co.svg';
import flagBO from '../assets/flags/bo.svg';
import flagPE from '../assets/flags/pe.svg';
import flagMX from '../assets/flags/mx.svg';
import flagVE from '../assets/flags/ve.svg';
import flagBR from '../assets/flags/br.svg';
import flagAR from '../assets/flags/ar.svg';
import flagUS from '../assets/flags/us.svg';

const FLAGS = {
    CL: flagCL, CO: flagCO, BO: flagBO, PE: flagPE,
    MX: flagMX, VE: flagVE, BR: flagBR, AR: flagAR, US: flagUS
};
const getFlagUrl = (code) => FLAGS[code?.toUpperCase()] || '';

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
            console.log("👥 Favorites Page Response:", res);

            let list = [];
            if (Array.isArray(res)) {
                list = res;
            } else if (res?.beneficiaries && Array.isArray(res.beneficiaries)) {
                list = res.beneficiaries;
            } else if (res?.data && Array.isArray(res.data)) {
                list = res.data;
            }

            setFavorites(list);
        } catch (e) {
            console.error("Error loading favorites:", e);
        } finally {
            setLoading(false);
        }
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
        <Container className="my-4">
            {/* Logo Header */}
            <div className="text-center mb-4">
                <img src={logo} alt="Alyto" style={{ height: '90px' }} />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold">Mis Contactos</h2>
                <Button
                    variant="primary"
                    onClick={handleOpenCreate}
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '50px', height: '50px', padding: 0 }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </Button>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    {loading ? <div className="text-center p-4"><Spinner animation="border" /></div> : (
                        favorites.length === 0 ? <Alert variant="info">No tienes contactos guardados aún.</Alert> :
                            <ListGroup variant="flush">
                                {favorites.map(fav => (
                                    <ListGroup.Item key={fav._id} className="border-0 py-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                                {/* Avatar Circle */}
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        backgroundColor: '#233E58',
                                                        fontSize: '20px'
                                                    }}
                                                >
                                                    {(fav.beneficiaryData?.beneficiary_first_name?.charAt(0) || 'U').toUpperCase()}
                                                </div>

                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <strong className="mb-0">{fav.beneficiaryData?.beneficiary_first_name} {fav.beneficiaryData?.beneficiary_last_name}</strong>
                                                        {fav.country && getFlagUrl(fav.country) && (
                                                            <img
                                                                src={getFlagUrl(fav.country)}
                                                                alt={fav.country}
                                                                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="text-muted small">
                                                        {fav.country} • {fav.beneficiaryData?.bank_name || 'Banco'} - {fav.beneficiaryData?.account_number || fav.beneficiaryData?.account_bank || 'Cuenta'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Three-dot menu */}
                                            <Dropdown align="end">
                                                <Dropdown.Toggle
                                                    variant="link"
                                                    className="text-muted p-0 border-0 shadow-none"
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <circle cx="12" cy="5" r="2"></circle>
                                                        <circle cx="12" cy="12" r="2"></circle>
                                                        <circle cx="12" cy="19" r="2"></circle>
                                                    </svg>
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu>
                                                    <Dropdown.Item onClick={() => handleEdit(fav)}>
                                                        📝 Renombrar
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => handleDelete(fav._id)} className="text-danger">
                                                        🗑️ Eliminar
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
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