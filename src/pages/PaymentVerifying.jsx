import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner, Container, Card } from 'react-bootstrap';
import { checkPaymentStatus } from '../services/api';

/**
 * Página intermedia que se muestra DESPUÉS de que el usuario complete el pago en Fintoc
 * Hace polling activo para verificar el estado y ejecutar el withdrawal diferido
 */
const PaymentVerifying = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    // Extraer orderId de múltiples fuentes posibles
    const orderIdFromQuery = params.get('orderId') || params.get('order');

    // También intentar desde window.location si useSearchParams no funciona con el hash
    const hash = window.location.hash; // Ej: #/payment-verifying?orderId=XXX
    const queryMatch = hash.match(/[?&]orderId=([^&]+)/);
    const orderIdFromHash = queryMatch ? queryMatch[1] : null;

    const orderId = orderIdFromQuery || orderIdFromHash;

    console.log('🔍 [PaymentVerifying] Hash completo:', hash);
    console.log('🔍 [PaymentVerifying] orderId extraído:', orderId);

    useEffect(() => {
        if (!orderId) {
            console.error('❌ No orderId provided. Params:', Object.fromEntries(params.entries()));
            console.error('❌ Hash:', window.location.hash);
            console.error('⏸️ Esperando 3 segundos antes de redirigir...');

            // Dar tiempo para ver los logs
            setTimeout(() => {
                navigate('/');
            }, 3000);
            return;
        }

        console.log(`🔍 [PaymentVerifying] Verificando pago para orden: ${orderId}`);

        const verifyPayment = async () => {
            const MAX_ATTEMPTS = 12; // 12 intentos × 5s = 60 segundos
            const DELAY = 5000; // 5 segundos entre intentos

            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                console.log(`🔄 [PaymentVerifying] Intento ${attempt}/${MAX_ATTEMPTS}...`);

                try {
                    const result = await checkPaymentStatus(orderId);
                    console.log(`✅ [PaymentVerifying] Resultado:`, result);

                    // Si el pago fue confirmado y el withdrawal ejecutado, redirigir a success
                    if (result?.payinStatus === 'completed' || result?.status === 'processing') {
                        console.log('🎉 [PaymentVerifying] ¡Pago confirmado! Redirigiendo...');
                        setTimeout(() => {
                            navigate(`/payment-success?orderId=${orderId}`);
                        }, 1000);
                        return;
                    }

                    // Si aún está pending, mostrar feedback
                    console.log(`⏳ [PaymentVerifying] Pago aún pendiente (${attempt}/${MAX_ATTEMPTS})...`);

                } catch (err) {
                    console.error(`❌ [PaymentVerifying] Error en intento ${attempt}:`, err.message);
                }

                // Si es el último intento y todavía está pending
                if (attempt === MAX_ATTEMPTS) {
                    console.warn('⚠️ [PaymentVerifying] Timeout: Redirigiendo a PaymentSuccess de todos modos...');
                    navigate(`/payment-success?orderId=${orderId}`);
                    return;
                }

                // Esperar antes del próximo intento
                await new Promise(resolve => setTimeout(resolve, DELAY));
            }
        };

        verifyPayment();
    }, [orderId, navigate]);

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card className="text-center shadow-lg p-5" style={{ maxWidth: '500px', borderRadius: '15px' }}>
                <Card.Body>
                    <div className="mb-4">
                        <Spinner animation="border" variant="primary" style={{ width: '60px', height: '60px' }} />
                    </div>

                    <h3 className="fw-bold mb-3">Verificando tu pago...</h3>

                    <p className="text-muted mb-4">
                        Estamos confirmando tu transacción con el banco.
                        <br />
                        <strong>No cierres esta ventana.</strong>
                    </p>

                    <div className="small text-muted">
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                            <Spinner animation="grow" size="sm" variant="success" />
                            <span>Verificando estado del pago...</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                            <Spinner animation="grow" size="sm" variant="info" />
                            <span>Procesando envío al beneficiario...</span>
                        </div>
                    </div>

                    <p className="mt-4 small text-muted">
                        Orden: <code>{orderId}</code>
                    </p>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PaymentVerifying;
