import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { executeDirectPayment } from '../../services/api';

const DirectPayForm = ({ paymentOrderId, method, initialData = {}, onSuccess, onError }) => {
    // Combinamos datos iniciales (del paso anterior) con estado local
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); // Puede llamarse automáticamente
        setLoading(true);
        setError('');

        try {
            // Pasamos los datos tal cual (RUT con puntos según doc)
            const cleanData = {};
            Object.keys(formData).forEach(key => {
                cleanData[key] = formData[key];
            });

            // ✅ CORRECTO: Usar ID del método si existe (requerido por Vita), sino el código
            const methodValue = method?.id || method?.payment_method || method?.code;
            if (!methodValue) {
                const errMsg = 'Método de pago no válido o no seleccionado';
                console.error(errMsg);
                setError(errMsg);
                setLoading(false);
                return;
            }
            console.log('[DirectPayForm] Enviando método:', methodValue, '(Original:', method?.code, ')');

            // Build payload based on selected method
            let payload;
            if (method?.code === 'fintoc' && method?.id) {
                payload = {
                    paymentOrderId: paymentOrderId,
                    method_id: method.id,
                    payment_data: {}
                };
            } else {
                const paymentMethod = method?.payment_method || method?.code;
                payload = {
                    paymentOrderId: paymentOrderId,
                    payment_method: paymentMethod,
                    payment_data: cleanData
                };
            }

            console.log('[DirectPayForm] Payload a enviar:', JSON.stringify(payload, null, 2));

            const response = await executeDirectPayment(payload);

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
                    <Form.Group key={field.name} className="mb-3">
                        <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>

                        {/* Campo SELECT (para bank_id de Fintoc) */}
                        {field.type === 'select' && field.options && (
                            <Form.Select
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                                required={field.required}
                            >
                                <option value="">Selecciona {field.label}</option>
                                {field.options.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        )}

                        {/* Campos de texto, email, etc */}
                        {field.type !== 'select' && (
                            <Form.Control
                                type={field.type || 'text'}
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                                placeholder={field.placeholder}
                                required={field.required}
                            />
                        )}

                        {field.validation?.message && (
                            <Form.Text className="text-muted">{field.validation.message}</Form.Text>
                        )}
                    </Form.Group>
                ))}

                <Button variant="success" type="submit" disabled={loading} className="w-100">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Finalizar Pago'}
                </Button>
            </Form>
        </div>
    );
};
export default DirectPayForm;