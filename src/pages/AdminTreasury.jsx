import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { apiClient } from '../services/api';

const AdminTreasury = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

    // 🖼️ Modal states
    const [photoModal, setPhotoModal] = useState({ show: false, url: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, txId: null, txAmount: '', txCurrency: '' });
    const [successModal, setSuccessModal] = useState({ show: false, message: '' });
    const [rejectModal, setRejectModal] = useState({ show: false, txId: null, reason: '' });

    const fetchPending = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await apiClient.get('/admin/treasury/pending');
            setTransactions(res.data.transactions || []);
        } catch (e) {
            setError(e?.response?.data?.error || 'Error al cargar tesorería.');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    // 🖼️ Abrir foto en modal
    const handleViewPhoto = (url) => {
        setPhotoModal({ show: true, url });
    };

    // ✅ Abrir modal de confirmación
    const handleApproveClick = (tx) => {
        setConfirmModal({ show: true, txId: tx._id, txAmount: tx.amount, txCurrency: tx.currency });
    };

    // ❌ Abrir modal de rechazo
    const handleRejectClick = (tx) => {
        setRejectModal({ show: true, txId: tx._id, reason: '' });
    };

    // ✅ Confirmar aprobación (desde modal)
    const confirmApproval = async () => {
        setConfirmModal({ ...confirmModal, show: false });
        try {
            setBusyId(confirmModal.txId);
            setError('');
            await apiClient.put(`/admin/treasury/${confirmModal.txId}/approve-deposit`);
            await fetchPending();
            setSuccessModal({ show: true, message: '✅ Depósito aprobado exitosamente' });
        } catch (e) {
            const msg = e?.response?.data?.error || 'Error aprobando depósito.';
            const details = e?.response?.data?.details;
            setError(details ? `${msg} ${JSON.stringify(details)}` : msg);
        } finally {
            setBusyId(null);
        }
    };

    // ❌ Confirmar rechazo (desde modal)
    const confirmRejection = async () => {
        if (!rejectModal.reason.trim()) {
            alert('Debes especificar una razón de rechazo');
            return;
        }

        try {
            setBusyId(rejectModal.txId);
            await apiClient.put(`/admin/treasury/${rejectModal.txId}/reject`, {
                reason: rejectModal.reason
            });
            setRejectModal({ show: false, txId: null, reason: '' });
            await fetchPending();
            setSuccessModal({ show: true, message: '❌ Transacción rechazada' });
        } catch (e) {
            setError(e?.response?.data?.error || 'Error rechazando transacción');
        } finally {
            setBusyId(null);
        }
    };

    const completePayout = async (id) => {
        if (!confirm('¿Confirmas que ya realizaste el pago manual y deseas marcarlo como completado?')) return;
        try {
            setBusyId(id);
            setError('');
            await apiClient.put(`/admin/treasury/${id}/complete-payout`, {});
            await fetchPending();
        } catch (e) {
            setError(e?.response?.data?.error || 'Error completando pago.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Container className="my-5">
            <h2 className="mb-4">Tesorería (Operaciones Manuales)</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <Table responsive>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Usuario</th>
                                    <th>Tipo</th>
                                    <th>Monto</th>
                                    <th>Comprobante</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted py-4">
                                            No hay transacciones pendientes.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const isOnRamp = tx.status === 'pending_verification';
                                        const isOffRamp = tx.status === 'pending_manual_payout';
                                        const busy = busyId === tx._id;

                                        return (
                                            <tr key={tx._id}>
                                                <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}</td>
                                                <td>{tx.createdBy?.name || tx.createdBy?.email || '-'}</td>
                                                <td>
                                                    {isOnRamp ? (
                                                        <Badge bg="info">Entrada (On-Ramp)</Badge>
                                                    ) : (
                                                        <Badge bg="warning">Salida (Off-Ramp)</Badge>
                                                    )}
                                                </td>
                                                <td>{tx.amount} {tx.currency}</td>
                                                <td>
                                                    {tx.proofOfPayment
                                                        ? <Button size="sm" variant="link" onClick={() => handleViewPhoto(tx.proofOfPayment)}>Ver Foto</Button>
                                                        : <span className="text-muted">-</span>}
                                                </td>
                                                <td>
                                                    {isOnRamp && (
                                                        <div className="d-flex gap-2">
                                                            <Button size="sm" variant="outline-danger" disabled={busy} onClick={() => handleRejectClick(tx)}>
                                                                Rechazar
                                                            </Button>
                                                            <Button size="sm" disabled={busy} onClick={() => handleApproveClick(tx)}>
                                                                {busy ? 'Procesando...' : 'Aprobar'}
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {isOffRamp && (
                                                        <Button size="sm" variant="success" disabled={busy} onClick={() => completePayout(tx._id)}>
                                                            {busy ? 'Guardando...' : 'Marcar pagado'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* 🖼️ Modal de Foto */}
            <Modal show={photoModal.show} onHide={() => setPhotoModal({ show: false, url: '' })} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Comprobante de Pago</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <img src={photoModal.url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                </Modal.Body>
            </Modal>

            {/* ✅ Modal de Confirmación */}
            <Modal show={confirmModal.show} onHide={() => setConfirmModal({ ...confirmModal, show: false })}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Aprobación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Confirmas que el depósito fue recibido?</p>
                    <Alert variant="info">
                        Monto: <strong>{confirmModal.txAmount} {confirmModal.txCurrency}</strong>
                    </Alert>
                    <p className="small text-muted">Esto iniciará el payout automático en Vita.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={confirmApproval}>
                        Aprobar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ✅ Modal de Éxito */}
            <Modal show={successModal.show} onHide={() => setSuccessModal({ show: false, message: '' })}>
                <Modal.Body className="text-center py-4">
                    <div style={{ fontSize: '3rem' }}>{successModal.message.includes('❌') ? '❌' : '✅'}</div>
                    <h5 className="mt-3">{successModal.message}</h5>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setSuccessModal({ show: false, message: '' })}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ❌ Modal de Rechazo */}
            <Modal show={rejectModal.show} onHide={() => setRejectModal({ show: false, txId: null, reason: '' })}>
                <Modal.Header closeButton>
                    <Modal.Title>Rechazar Transacción</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Razón del Rechazo</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            placeholder="Ej: Comprobante ilegible, monto incorrecto, etc."
                        />
                    </Form.Group>
                    <Alert variant="warning" className="mt-3 small">
                        El usuario será notificado del rechazo y podrá intentar nuevamente.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setRejectModal({ show: false, txId: null, reason: '' })}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmRejection}>
                        Confirmar Rechazo
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminTreasury;
