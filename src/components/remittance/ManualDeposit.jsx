import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Image } from 'react-bootstrap';
import { createWithdrawal, uploadImage, getTransactionRules } from '../../services/api';

const ManualDeposit = ({ formData, onBack }) => {
    const { quoteData, beneficiary, destCountry, originCountry } = formData;
    const [bankDetails, setBankDetails] = useState(null);
    const [depositQr, setDepositQr] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Cargar datos bancarios del Admin para el país de origen (ej: BO)
    useEffect(() => {
        const loadRules = async () => {
            try {
                const res = await getTransactionRules(originCountry);
                if (res.ok && res.rules.length > 0) {
                    const rule = res.rules[0];
                    setBankDetails(rule.localBankDetails);
                    setDepositQr(rule.depositQrImage);
                }
            } catch (e) { console.error(e); setError("Error cargando datos bancarios."); }
        };
        loadRules();
    }, [originCountry]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) return alert('Debes subir el comprobante de tu depósito.');
        setLoading(true);
        setError('');

        try {
            // 1. Subir imagen del comprobante
            setUploading(true);
            const formDataImg = new FormData();
            formDataImg.append('image', file);
            const uploadRes = await uploadImage(formDataImg);
            setUploading(false);

            // 2. Crear Transacción con la URL del comprobante
            // Enviamos currency: BOB (o la moneda local) para activar el flujo manual en backend
            const payload = {
                country: destCountry,
                currency: quoteData.origin, // ej: 'BOB'
                amount: quoteData.amountIn,
                ...beneficiary,
                proofOfPayment: uploadRes.url
            };

            const res = await createWithdrawal(payload);

            if (res.ok) {
                setSuccess(true);
            } else {
                throw new Error(res.error || "Error al crear solicitud.");
            }
        } catch (err) {
            setError(err.message || 'Error al procesar la solicitud.');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    if (success) {
        return (
            <Card className="p-4 text-center shadow-lg border-0">
                <Card.Body>
                    <div style={{ fontSize: '3rem' }}>✅</div>
                    <h4 className="text-success my-3">¡Solicitud Enviada!</h4>
                    <p>Hemos recibido tu comprobante. Verificaremos tu depósito y procesaremos el envío a la brevedad.</p>
                    <Button variant="primary" href="/transactions">Ver Mis Transacciones</Button>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-0">
            <Card.Header className="bg-white py-3">
                <h5 className="mb-0 text-primary">Instrucciones de Depósito ({originCountry})</h5>
            </Card.Header>
            <Card.Body className="p-4">
                <Alert variant="info" className="small">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Para completar tu envío, realiza una transferencia o depósito bancario por <strong>{quoteData.amountIn} {quoteData.origin}</strong> a la siguiente cuenta:
                </Alert>

                {bankDetails ? (
                    <div className="bg-light p-3 rounded mb-4 border">
                        <div className="row">
                            <div className="col-md-8">
                                <p className="mb-1"><strong>Banco:</strong> {bankDetails.bankName}</p>
                                <p className="mb-1"><strong>Tipo de Cuenta:</strong> {bankDetails.accountType}</p>
                                <p className="mb-1"><strong>Nro. Cuenta:</strong> <span className="user-select-all bg-white px-1 border rounded">{bankDetails.accountNumber}</span></p>
                                <p className="mb-1"><strong>Titular:</strong> {bankDetails.holderName}</p>
                                <p className="mb-0"><strong>CI/NIT:</strong> {bankDetails.holderId}</p>
                            </div>
                            {depositQr && (
                                <div className="col-md-4 text-center">
                                    <p className="small fw-bold mb-1">Escanear QR</p>
                                    <Image src={depositQr} fluid rounded style={{ maxHeight: '120px' }} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-3"><Spinner size="sm" /> Cargando datos bancarios...</div>
                )}

                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Subir Comprobante</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} accept="image/*" />
                    <Form.Text className="text-muted">Sube una foto clara o captura de pantalla de la transferencia.</Form.Text>
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-flex justify-content-between mt-4">
                    <Button variant="outline-secondary" onClick={onBack} disabled={loading}>Atrás</Button>
                    <Button
                        className="w-50"
                        onClick={handleSubmit}
                        disabled={loading || !file}
                        style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
                    >
                        {loading ? (uploading ? 'Subiendo imagen...' : 'Procesando...') : 'Confirmar Depósito'}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ManualDeposit;