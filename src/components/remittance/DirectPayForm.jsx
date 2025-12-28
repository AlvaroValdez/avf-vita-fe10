import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { executeDirectPayment } from '../../services/api';

const DirectPayForm = ({ paymentOrderId, method, initialData = {}, onSuccess, onError }) => {
    // Combinamos datos iniciales (del paso anterior) con estado local
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); // Puede llamarse automáticamente
        setLoading(true);
        setError('');

        try {
            // Limpieza de datos vacíos
            const cleanData = {};
            Object.keys(formData).forEach(key => {
                if (formData[key]) cleanData[key] = formData[key];
            });

            // ✅ CORRECTO: Usar payment_method (código del método)
            const response = await executeDirectPayment({
                paymentOrderId: paymentOrderId,
                payment_method: method?.code || method?.payment_method,  // "pse", "nequi", "fintoc", etc.
                payment_data: cleanData
            });

            if (response.ok || response.data?.ok) {
                const data = response.data || response;

                // 1. Verificar si hay redirección (Común en Chile/Khipu)
                const redirectUrl =
                    data.redirect_url ||
                    data.url ||
                    data.attributes?.url ||
                    data.attributes?.payment_info?.provider_url;

                if (redirectUrl) {
                    console.log('🔄 Redirigiendo a pasarela:', redirectUrl);
                    window.location.href = redirectUrl;
                } else {
                    // 2. Éxito directo (sin redirección)
                    onSuccess(data);
                }
            } else {
                throw new Error(response.details?.message || 'Error procesando pago');
            }
        } catch (err) {
            console.error('Error DirectPay:', err);
            const msg = err.response?.data?.error?.message || err.message || 'Fallo en el pago';
            setError(msg);
            if (onError) onError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Si el método no tiene campos requeridos (o ya se llenaron), 
    // podríamos mostrar solo un botón de "Confirmar Pago"
    const fields = method?.required_fields || [];
    const hasFields = fields.length > 0;

    return (
        <div>
            {error && <Alert variant="danger">{error}</Alert>}

            <p className="mb-3 text-muted">
                Estás pagando con <strong>{method?.name}</strong>.
                {!hasFields && " Haz clic en confirmar para proceder."}
                {hasFields && " Completa los siguientes datos:"}
            </p>

            <Form onSubmit={handleSubmit}>
                {fields.map(field => (
                    <Form.Group className="mb-3" key={field.name}>
                        <Form.Label>{field.label}</Form.Label>
                        <Form.Control
                            type={field.type || 'text'}
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            required={field.required}
                            disabled={loading}
                        />
                    </Form.Group>
                ))}

                <div className="d-grid gap-2 mt-4">
                    <Button type="submit" variant="success" size="lg" disabled={loading}>
                        {loading ? <Spinner size="sm" animation="border" /> : 'Finalizar Pago'}
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default DirectPayForm;