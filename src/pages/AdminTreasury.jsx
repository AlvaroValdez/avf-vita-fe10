import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Alert, Spinner } from 'react-bootstrap';
import { apiClient } from '../services/api';

const AdminTreasury = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');

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

    const approveDeposit = async (id) => {
        if (!confirm('¿Confirmas que el depósito fue recibido y deseas iniciar el payout?')) return;
        try {
            setBusyId(id);
            setError('');
            await apiClient.put(`/admin/treasury/${id}/approve-deposit`);
            await fetchPending();
        } catch (e) {
            const msg = e?.response?.data?.error || 'Error aprobando depósito.';
            const details = e?.response?.data?.details;
            setError(details ? `${msg} ${JSON.stringify(details)}` : msg);
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
                                                        ? <a href={tx.proofOfPayment} target="_blank" rel="noreferrer">Ver Foto</a>
                                                        : <span className="text-muted">-</span>}
                                                </td>
                                                <td>
                                                    {isOnRamp && (
                                                        <Button size="sm" disabled={busy} onClick={() => approveDeposit(tx._id)}>
                                                            {busy ? 'Procesando...' : 'Aprobar depósito'}
                                                        </Button>
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
        </Container>
    );
};

export default AdminTreasury;
