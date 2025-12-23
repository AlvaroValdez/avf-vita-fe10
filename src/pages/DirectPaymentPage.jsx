import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import DirectPayForm from '../components/remittance/DirectPayForm';

/**
 * DirectPaymentPage
 * 
 * Isolated page for DirectPay flow
 * Receives payment order ID via URL params
 * Shows DirectPayForm for user to complete payment
 */
const DirectPaymentPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSuccess = (data) => {
        // Check if Vita returned redirect URL
        const redirectUrl = data?.redirect_url || data?.checkout_url || data?.url;

        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            // Success without redirect - go to transactions
            navigate('/transactions');
        }
    };

    const handleError = (err) => {
        setError(err);
        console.error('[DirectPaymentPage] Error:', err);
    };

    if (!orderId) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    <h5>Error</h5>
                    <p>No se recibió ID de orden de pago.</p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Volver al inicio
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <h3 className="mb-4">Completar Pago</h3>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <DirectPayForm
                        paymentOrderId={orderId}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />

                    <div className="mt-4 text-center">
                        <Button
                            variant="link"
                            onClick={() => navigate('/transactions')}
                        >
                            Cancelar y volver a mis transacciones
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DirectPaymentPage;
