import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Alert, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { apiClient } from '../services/api';

const fmt = (n, decimals = 0) =>
    n != null ? new Intl.NumberFormat('es-CL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n) : '-';

const AdminTreasury = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState({ msg: '', canRetry: false, retryId: null });

    // Modal states
    const [photoModal, setPhotoModal] = useState({ show: false, url: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, tx: null });
    const [successModal, setSuccessModal] = useState({ show: false, message: '' });
    const [rejectModal, setRejectModal] = useState({ show: false, txId: null, reason: '' });

    const fetchPending = async () => {
        try {
            setLoading(true);
            setError({ msg: '', canRetry: false, retryId: null });
            const res = await apiClient.get('/admin/treasury/pending');
            setTransactions(res.data.transactions || []);
        } catch (e) {
            setError({ msg: e?.response?.data?.error || 'Error al cargar tesorería.', canRetry: false });
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleViewPhoto = (url) => setPhotoModal({ show: true, url });
    const handleApproveClick = (tx) => setConfirmModal({ show: true, tx });
    const handleRejectClick = (tx) => setRejectModal({ show: true, txId: tx._id, reason: '' });

    // ✅ Execute approval — also used by Reintentar button
    const executeApproval = async (txId) => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        try {
            setBusyId(txId);
            setError({ msg: '', canRetry: false, retryId: null });
            await apiClient.put(`/admin/treasury/${txId}/approve-deposit`);
            await fetchPending();
            setSuccessModal({ show: true, message: '✅ Depósito aprobado — envío iniciado en Vita' });
        } catch (e) {
            const data = e?.response?.data || {};
            const detailStr = data.details
                ? (typeof data.details === 'string' ? data.details : JSON.stringify(data.details, null, 2))
                : '';
            const msg = `${data.error || 'Error aprobando depósito.'}${detailStr ? '\n' + detailStr : ''}`;
            setError({ msg, canRetry: !!data.canRetry, retryId: txId });
        } finally {
            setBusyId(null);
        }
    };

    const confirmApproval = () => executeApproval(confirmModal.tx?._id);

    const confirmRejection = async () => {
        if (!rejectModal.reason.trim()) { alert('Debes especificar una razón de rechazo'); return; }
        try {
            setBusyId(rejectModal.txId);
            await apiClient.put(`/admin/treasury/${rejectModal.txId}/reject`, { reason: rejectModal.reason });
            setRejectModal({ show: false, txId: null, reason: '' });
            await fetchPending();
            setSuccessModal({ show: true, message: '❌ Transacción rechazada' });
        } catch (e) {
            setError({ msg: e?.response?.data?.error || 'Error rechazando transacción', canRetry: false });
        } finally {
            setBusyId(null);
        }
    };

    const completePayout = async (id) => {
        if (!confirm('¿Confirmas que ya realizaste el pago manual?')) return;
        try {
            setBusyId(id);
            setError({ msg: '', canRetry: false, retryId: null });
            await apiClient.put(`/admin/treasury/${id}/complete-payout`, {});
            await fetchPending();
        } catch (e) {
            setError({ msg: e?.response?.data?.error || 'Error completando pago.', canRetry: false });
        } finally {
            setBusyId(null);
        }
    };

    // Helper component for modal detail rows
    const DetailRow = ({ label, value, highlight }) => (
        <Row className="mb-1 align-items-center">
            <Col xs={5} className="text-muted small">{label}</Col>
            <Col xs={7} className={`fw-semibold small ${highlight ? 'text-success' : ''}`}>{value}</Col>
        </Row>
    );

    const tx = confirmModal.tx;

    return (
        <Container className="my-5">
            <h2 className="mb-4">Tesorería — Operaciones Manuales</h2>

            {/* ── Error Banner with optional Retry ── */}
            {error.msg && (
                <Alert variant="danger" className="d-flex justify-content-between align-items-start">
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>
                        <strong>⚠️ Error:</strong> {error.msg}
                        {error.canRetry && (
                            <div className="mt-1 small text-muted">
                                La transacción volvió a estado <em>pendiente</em>. Puedes reintentar la aprobación.
                            </div>
                        )}
                    </div>
                    <div className="ms-3 d-flex gap-2 flex-shrink-0">
                        {error.canRetry && error.retryId && (
                            <Button size="sm" variant="warning" disabled={busyId === error.retryId}
                                onClick={() => executeApproval(error.retryId)}>
                                {busyId === error.retryId ? <><Spinner size="sm" /> Reintentando...</> : '🔄 Reintentar'}
                            </Button>
                        )}
                        <Button size="sm" variant="outline-danger"
                            onClick={() => setError({ msg: '', canRetry: false, retryId: null })}>✕</Button>
                    </div>
                </Alert>
            )}

            <Card>
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : (
                        <Table responsive hover size="sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Fecha</th>
                                    <th>Usuario</th>
                                    <th>Tipo</th>
                                    <th>Enviado</th>
                                    <th>Recibirá</th>
                                    <th>Beneficiario</th>
                                    <th>País</th>
                                    <th>Comprobante</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-muted py-4">
                                            No hay transacciones pendientes.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => {
                                        const isOnRamp = t.status === 'pending_verification';
                                        const isOffRamp = t.status === 'pending_manual_payout';
                                        const busy = busyId === t._id;
                                        const destAmount = t.amountsTracking?.destReceiveAmount;
                                        const destCurr = t.amountsTracking?.destCurrency || '';
                                        const benefName = t.company_name ||
                                            `${t.beneficiary_first_name || ''} ${t.beneficiary_last_name || ''}`.trim();

                                        return (
                                            <tr key={t._id}>
                                                <td className="small">
                                                    {t.createdAt
                                                        ? new Date(t.createdAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
                                                        : '-'}
                                                </td>
                                                <td className="small">{t.createdBy?.name || t.createdBy?.email || '-'}</td>
                                                <td>
                                                    {isOnRamp
                                                        ? <Badge bg="info">Entrada</Badge>
                                                        : <Badge bg="warning" text="dark">Salida</Badge>}
                                                </td>
                                                <td className="fw-bold">
                                                    {fmt(t.amount)} <small className="text-muted">{t.currency}</small>
                                                </td>
                                                <td className="text-success fw-bold small">
                                                    {destAmount
                                                        ? `${fmt(destAmount, 0)} ${destCurr}`
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td className="small">{benefName || '-'}</td>
                                                <td className="small">{t.country || '-'}</td>
                                                <td>
                                                    {t.proofOfPayment
                                                        ? <Button size="sm" variant="link" className="p-0"
                                                            onClick={() => handleViewPhoto(t.proofOfPayment)}>📎 Ver</Button>
                                                        : <span className="text-muted">—</span>}
                                                </td>
                                                <td>
                                                    {isOnRamp && (
                                                        <div className="d-flex gap-1">
                                                            <Button size="sm" variant="outline-danger" disabled={busy}
                                                                onClick={() => handleRejectClick(t)}>✗</Button>
                                                            <Button size="sm" variant="success" disabled={busy}
                                                                onClick={() => handleApproveClick(t)}>
                                                                {busy ? <Spinner size="sm" /> : '✓ Aprobar'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {isOffRamp && (
                                                        <Button size="sm" variant="primary" disabled={busy}
                                                            onClick={() => completePayout(t._id)}>
                                                            {busy ? <Spinner size="sm" /> : 'Marcar pagado'}
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

            {/* ── Modal Foto ── */}
            <Modal show={photoModal.show} onHide={() => setPhotoModal({ show: false, url: '' })} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Comprobante de Pago</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <img src={photoModal.url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                </Modal.Body>
            </Modal>

            {/* ── Modal Confirmación con DETALLE COMPLETO ── */}
            <Modal show={confirmModal.show} onHide={() => setConfirmModal({ show: false, tx: null })} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>✅ Confirmar Aprobación de Depósito</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {tx && (
                        <>
                            <Alert variant="warning" className="mb-3 small">
                                <strong>⚠️ Verifica</strong> que el comprobante adjunto coincida exactamente con los datos antes de aprobar.
                                Esta acción ejecutará el payout automático en Vita Wallet.
                            </Alert>

                            {/* Sección 1: Depósito recibido */}
                            <div className="text-uppercase text-muted mb-1" style={{ fontSize: '0.68rem', letterSpacing: 1 }}>
                                📩 Depósito Recibido
                            </div>
                            <Card className="mb-3 border-0 bg-light">
                                <Card.Body className="py-2 px-3">
                                    <DetailRow label="Orden" value={tx.order} />
                                    <DetailRow label="Usuario" value={tx.createdBy?.name || tx.createdBy?.email || '-'} />
                                    <DetailRow label="Monto recibido"
                                        value={`${fmt(tx.amountsTracking?.originTotal || tx.amount)} ${tx.amountsTracking?.originCurrency || tx.currency}`}
                                        highlight />
                                    <DetailRow label="Fecha" value={new Date(tx.createdAt).toLocaleString('es-CL')} />
                                </Card.Body>
                            </Card>

                            {/* Sección 2: Payout a enviar */}
                            <div className="text-uppercase text-muted mb-1" style={{ fontSize: '0.68rem', letterSpacing: 1 }}>
                                📤 Payout a Enviar (vía Vita)
                            </div>
                            <Card className="mb-3 border-0 bg-light">
                                <Card.Body className="py-2 px-3">
                                    <DetailRow label="Beneficiario"
                                        value={tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()} />
                                    <DetailRow label="País destino" value={tx.country} />
                                    <DetailRow label="Recibirá (prometido)"
                                        value={`${fmt(tx.amountsTracking?.destReceiveAmount, 0)} ${tx.amountsTracking?.destCurrency || ''}`}
                                        highlight />
                                    <DetailRow label="Costo fijo Vita"
                                        value={tx.amountsTracking?.destVitaFixedCost
                                            ? `${fmt(tx.amountsTracking.destVitaFixedCost, 0)} ${tx.amountsTracking?.destCurrency || ''}`
                                            : '-'} />
                                    <DetailRow label="Banco"
                                        value={tx.withdrawalPayload?.beneficiary_bank_name || tx.withdrawalPayload?.bank_name || '-'} />
                                    <DetailRow label="N° Cuenta"
                                        value={tx.withdrawalPayload?.account_bank
                                            ? `****${String(tx.withdrawalPayload.account_bank).slice(-4)}`
                                            : '-'} />
                                </Card.Body>
                            </Card>

                            {/* Sección 3: Tasas y margen */}
                            <div className="text-uppercase text-muted mb-1" style={{ fontSize: '0.68rem', letterSpacing: 1 }}>
                                📊 Tasas y Margen
                            </div>
                            <Card className="mb-3 border-0 bg-light">
                                <Card.Body className="py-2 px-3">
                                    {(() => {
                                        const rt = tx.rateTracking || {};
                                        const at = tx.amountsTracking || {};
                                        const isBOB = tx.currency?.toUpperCase() === 'BOB';
                                        const destCurr = at.destCurrency || 'COP';

                                        // vitaRate siempre es CLP→DEST (pivot de Vita).
                                        // Para BOB: la tasa BOB→DEST de Vita = originToClpBase × vitaRate
                                        const clpToDestRate = rt.vitaRate;
                                        const bobToClpBase = rt.originToClpBase || rt.bobToClpBase;
                                        const vitaRateBOBtoDest = isBOB && bobToClpBase && clpToDestRate
                                            ? bobToClpBase * clpToDestRate
                                            : clpToDestRate;

                                        // alytoRate para BOB = BOB→DEST efectivo (promisedDest / bobAmount)
                                        // alytoRate para CLP = CLP→DEST con spread
                                        const alytoRateDisplay = rt.alytoRate;

                                        return (
                                            <>
                                                {isBOB && clpToDestRate && (
                                                    <DetailRow
                                                        label={`Tasa pivot Vita (CLP→${destCurr})`}
                                                        value={`${clpToDestRate.toFixed(4)} ${destCurr}/CLP`} />
                                                )}
                                                {vitaRateBOBtoDest && (
                                                    <DetailRow
                                                        label={`Tasa Vita bruta (${tx.currency}→${destCurr})`}
                                                        value={`${vitaRateBOBtoDest.toFixed(2)} ${destCurr}/${tx.currency}`} />
                                                )}
                                                {alytoRateDisplay && (
                                                    <DetailRow
                                                        label={`Tasa Alyto — cliente recibe`}
                                                        value={`${alytoRateDisplay.toFixed(2)} ${destCurr}/${tx.currency}`}
                                                        highlight />
                                                )}
                                                {vitaRateBOBtoDest && alytoRateDisplay && (
                                                    <DetailRow
                                                        label="Diferencial por BOB"
                                                        value={`${(vitaRateBOBtoDest - alytoRateDisplay).toFixed(2)} ${destCurr}/${tx.currency}`} />
                                                )}
                                                <DetailRow label="Spread aplicado"
                                                    value={rt.spreadPercent ? `${rt.spreadPercent}%` : '-'} />
                                                <DetailRow label="Ganancia est. en tasa"
                                                    value={at.profitOriginCurrency > 0
                                                        ? `${fmt(at.profitOriginCurrency, 0)} CLP`
                                                        : isBOB
                                                            ? `${((vitaRateBOBtoDest || 0) - (alytoRateDisplay || 0)).toFixed(2)} ${destCurr} × cada BOB`
                                                            : '-'} />
                                            </>
                                        );
                                    })()}
                                </Card.Body>
                            </Card>


                            {tx.proofOfPayment && (
                                <div className="text-center mb-2">
                                    <Button size="sm" variant="outline-secondary"
                                        onClick={() => { handleViewPhoto(tx.proofOfPayment); }}>
                                        📎 Ver comprobante adjunto
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirmModal({ show: false, tx: null })}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={confirmApproval}>
                        ✅ Confirmar y enviar a Vita
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ── Modal Éxito ── */}
            <Modal show={successModal.show} onHide={() => setSuccessModal({ show: false, message: '' })} centered>
                <Modal.Body className="text-center py-4">
                    <div style={{ fontSize: '3rem' }}>{successModal.message.includes('❌') ? '❌' : '✅'}</div>
                    <h5 className="mt-3">{successModal.message}</h5>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setSuccessModal({ show: false, message: '' })}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* ── Modal Rechazo ── */}
            <Modal show={rejectModal.show} onHide={() => setRejectModal({ show: false, txId: null, reason: '' })} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Rechazar Transacción</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Razón del Rechazo</Form.Label>
                        <Form.Control as="textarea" rows={3} value={rejectModal.reason}
                            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            placeholder="Ej: Comprobante ilegible, monto incorrecto, etc." />
                    </Form.Group>
                    <Alert variant="warning" className="mt-3 small">
                        El usuario será notificado y podrá intentar nuevamente.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setRejectModal({ show: false, txId: null, reason: '' })}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={confirmRejection}>Confirmar Rechazo</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminTreasury;
