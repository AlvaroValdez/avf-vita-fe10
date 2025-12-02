import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { createWithdrawal, uploadKycDocuments } from '../../services/api'; // Reutilizamos uploadKycDocuments o crea uno genérico uploadImage
import { getTransactionRules } from '../../services/api';

const ManualDeposit = ({ quoteData, beneficiary, destCountry, onFinish }) => {
    const [bankDetails, setBankDetails] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Cargar datos bancarios del Admin (configurados en Reglas)
    useEffect(() => {
        const loadRules = async () => {
            try {
                const res = await getTransactionRules('BO'); // Reglas de Bolivia
                if (res.ok && res.rules[0]) {
                    setBankDetails(res.rules[0].localBankDetails);
                    // También podríamos cargar el QR del admin aquí (res.rules[0].depositQrImage)
                }
            } catch (e) { console.error(e); }
        };
        loadRules();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) return alert('Debes subir el comprobante.');
        setLoading(true);
        setError('');

        try {
            // 1. Subir imagen
            const formData = new FormData();
            formData.append('image', file); // Asegúrate de tener un endpoint genérico o usa el de KYC temporalmente
            // const uploadRes = await uploadImage(formData); // Necesitas crear esta función en api.js

            // 2. Crear Transacción con la URL del comprobante
            const payload = {
                country: destCountry,
                currency: 'BOB',
                amount: quoteData.amountIn,
                ...beneficiary,
                // proofOfPayment: uploadRes.url 
            };

            // Simulación mientras creas el endpoint de upload genérico:
            const res = await createWithdrawal(payload);

            if (res.ok) {
                onFinish(); // Redirigir a éxito
            }
        } catch (err) {
            setError('Error al enviar solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-sm border-0 mt-4">
            <Card.Body className="p-4">
                <h5 className="text-primary mb-3">Instrucciones de Depósito</h5>

                {bankDetails ? (
                    <div className="bg-light p-3 rounded mb-4">
                        <p className="mb-1"><strong>Banco:</strong> {bankDetails.bankName}</p>
                        <p className="mb-1"><strong>Cuenta:</strong> {bankDetails.accountNumber}</p>
                        <p className="mb-1"><strong>Titular:</strong> {bankDetails.holderName}</p>
                        <p className="mb-0"><strong>CI/NIT:</strong> {bankDetails.holderId}</p>
                        {/* Aquí podrías mostrar la imagen del QR si existe en bankDetails.depositQrImage */}
                    </div>
                ) : (
                    <p>Cargando datos bancarios...</p>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Sube tu comprobante de transferencia/QR</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} accept="image/*" />
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <Button className="w-100" onClick={handleSubmit} disabled={loading || !file}>
                    {loading ? <Spinner size="sm" /> : 'Ya realicé el pago (Enviar Comprobante)'}
                </Button>
            </Card.Body>
        </Card>
    );
};

export default ManualDeposit;