import React, { useEffect, useMemo, useState } from 'react';
import { Container, Table, Button, Badge, Card, Alert, Spinner } from 'react-bootstrap';
import { apiClient } from '../services/api';

const AdminTreasury = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState('');

    const fetchPending = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await apiClient.get('/admin/treasury/pending');
            setTransactions(res.data.transactions || []);
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Error cargando tesorería';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const counts = useMemo(() => {
        const onRamp = transactions.filter(t => t.status === 'pending_verification').length;
        const offRamp = transactions.filter(t => t.status === 'pending_manual_payout').length;
        return { onRamp, offRamp, total: transactions.length };
    }, [transactions]);

    const handleApproveDeposit = async (id) => {
        if (!confirm('¿Confirmas que el depósito/entrada fue recibido y deseas ejecutar el envío en Vita?')) return;
        try {
            setActionLoadingId(id);
            setError('');
            await apiClient.put(`/admin/treasury/${id}/approve-deposit`);
            await fetchPending();
            alert('Depósito aprobado. Envío iniciado.');
        } catch (e) {
            const details = e?.response?.data?.details;
            const msg = e?.response?.data?.error || e?.message || 'Error aprobando depósito';
            setError(details ? `${msg}: ${JSON.stringify(details)}` : msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleCompletePayout = async (id) => {
        if (!confirm('¿Confirmas que ya realizaste el pago manual (off-ramp) y deseas marcarlo como completado?')) return;
        try {
            setActionLoadingId(id);
            setError('');
            await apiClient.put(`/admin/treasury/${id}/complete-payout`, {});
            await fetchPending();
            alert('Pago marcado como completado.');
        } catch (e) {
            const msg = e?.response?.data?.error || e?.message || 'Error completando pago';
            setError(msg);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <Container className="py-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h3 className="mb-1">Tesorería</h3>
                    <div className="text-muted">
                        Pendientes: {counts.total} • Entradas: {counts.onRamp} • Salidas: {counts.offRamp}
                    </div>
                </div>

                <Button variant="outline-secondary" onClick={fetchPending} disabled={loading}>
                    {loading ? 'Actualizando...' : 'Actualizar'}
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="py-5 text-center">
                            <Spinner animation="border" />
                            <div className="mt-2">Cargando...</div>
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0">
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
                                        const isBusy = actionLoadingId === tx._id;

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
                                                    {tx.proofOfPayment ? (
                                                        <a href={tx.proofOfPayment} target="_blank" rel="noreferrer">Ver</a>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {isOnRamp && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApproveDeposit(tx._id)}
                                                            disabled={isBusy}
                                                        >
                                                            {isBusy ? 'Procesando...' : 'Aprobar depósito'}
                                                        </Button>
                                                    )}

                                                    {isOffRamp && (
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => handleCompletePayout(tx._id)}
                                                            disabled={isBusy}
                                                        >
                                                            {isBusy ? 'Guardando...' : 'Marcar pagado'}
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
