import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';

/**
 * DirectPayForm Component
 * 
 * Clean implementation of Vita DirectPay
 * Based on BusinessAPI.txt - POST Direct Payment
 * 
 * @param {string} paymentOrderId - Vita payment order ID
 * @param {object} method - Selected payment method details
 * @param {function} onSuccess - Callback when payment succeeds
 * @param {function} onError - Callback when payment fails
 */
const DirectPayForm = ({ paymentOrderId, method, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            console.log('[DirectPayForm] Submitting to:', `/api/payment-orders/${paymentOrderId}/execute`);
            console.log('[DirectPayForm] Payment data:', formData);

            const response = await fetch(`/api/payment-orders/${paymentOrderId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_data: formData
                })
            });

            console.log('[DirectPayForm] Response status:', response.status);

            // Handle non-JSON responses
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.error('[DirectPayForm] Non-JSON response:', text);
                throw new Error(`Error del servidor (${response.status}): ${text.substring(0, 100)}`);
            }

            console.log('[DirectPayForm] Response data:', data);

            if (data.ok) {
                // Success - check if Vita wants redirect
                const redirectUrl = data.data?.redirect_url ||
                    data.data?.checkout_url ||
                    data.data?.url;

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    onSuccess(data.data);
                }
            } else {
                const errorMsg = data.details?.message || data.error || 'Error processing payment';
                setError(errorMsg);
                onError(errorMsg);
            }
        } catch (err) {
            const errorMsg = err.message || 'Network error';
            console.error('[DirectPayForm] Error:', err);
            setError(errorMsg);
            onError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-4">
            <Card.Body>
                <h5 className="mb-3">Pago Directo</h5>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre *</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => handleChange('first_name', e.target.value)}
                            required
                            disabled={loading}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Apellido *</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => handleChange('last_name', e.target.value)}
                            required
                            disabled={loading}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            disabled={loading}
                        />
                    </Form.Group>

                    <div className="d-grip gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="w-100"
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" animation="border" className="me-2" />
                                    Procesando...
                                </>
                            ) : (
                                'Pagar Ahora'
                            )}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default DirectPayForm;
