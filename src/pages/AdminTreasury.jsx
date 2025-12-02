import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Image } from 'react-bootstrap';
import { apiClient } from '../services/api'; // Crea funciones específicas en api.js para llamar a adminTreasury

const AdminTreasury = () => {
    const [transactions, setTransactions] = useState([]);

    const fetchPending = async () => {
        const res = await apiClient.get('/admin/treasury/pending');
        setTransactions(res.data.transactions);
    };

    useEffect(() => { fetchPending(); }, []);

    const handleApprove = async (id) => {
        if (!confirm('¿Confirmas que el dinero está en tu cuenta?')) return;
        await apiClient.put(`/admin/treasury/${id}/approve-deposit`);
        fetchPending();
    };

    return (
        <Container className="my-5">
            <h2 className="mb-4">Tesorería (Operaciones Manuales)</h2>
            <Card>
                <Card.Body>
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
                            {transactions.map(tx => (
                                <tr key={tx._id}>
                                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                    <td>{tx.createdBy?.name}</td>
                                    <td>
                                        {tx.status === 'pending_verification'
                                            ? <Badge bg="info">Entrada (On-Ramp)</Badge>
                                            : <Badge bg="warning">Salida (Off-Ramp)</Badge>}
                                    </td>
                                    <td>{tx.amount} {tx.currency}</td>
                                    <td>
                                        {tx.proofOfPayment && <a href={tx.proofOfPayment} target="_blank">Ver Foto</a>}
                                    </td>
                                    <td>
                                        <Button size="sm" onClick={() => handleApprove(tx._id)}>Aprobar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminTreasury;