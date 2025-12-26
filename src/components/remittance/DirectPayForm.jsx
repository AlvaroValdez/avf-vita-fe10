import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import { createDirectPaymentOrder } from '../../services/api';

/**
 * DirectPayForm Component
 * * Implementación actualizada para soportar campos requeridos por métodos como PSE/Khipu
 * (Documento, Teléfono, Banco, etc.)
 */
const DirectPayForm = ({ paymentOrderId, method, initialData = {}, onSuccess, onError }) => {

    // Inicializamos con todos los campos posibles que Vita podría pedir
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',           // Nuevo: Requerido para muchos métodos (ej. Nequi, PSE)
        document_type: 'CC', // Nuevo: Default a Cédula Ciudadanía (ajusta según necesidad)
        document_number: '', // Nuevo: Requerido para validación bancaria
        bank_id: '',         // Nuevo: Requerido para PSE (ej. '1007')
        ...initialData,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Si el método seleccionado trae datos predefinidos (ej: tests), los cargamos
    useEffect(() => {
        if (method) {
            console.log('[DirectPayForm] Método seleccionado:', method);
        }
    }, [method]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('[DirectPayForm] Enviando orden:', paymentOrderId);
            console.log('[DirectPayForm] Datos del formulario:', formData);

            // Extraer ID del método. Prioridad: method_id (Vita) > id (interno)
            const methodId = method?.method_id || method?.id || null;

            // Limpieza de datos vacíos:
            // Algunos métodos fallan si envías "bank_id": "" en lugar de no enviarlo.
            const cleanData = { ...formData };
            if (!cleanData.bank_id) delete cleanData.bank_id;

            const response = await createDirectPaymentOrder({
                vitaOrderId: paymentOrderId,
                payment_data: cleanData, // Enviamos el objeto completo con teléfono y documento
                ...(methodId && { method_id: methodId }),
            });

            console.log('[DirectPayForm] Respuesta API:', response);

            if (response.ok || response.data?.ok) { // Ajuste por si la estructura varía
                const successData = response.data || response;

                // Revisar redirección (Khipu/Webpay suelen devolver url)
                const redirectUrl = successData.redirect_url ||
                    successData.checkout_url ||
                    successData.url ||
                    successData.attributes?.url; // A veces viene en attributes

                if (redirectUrl) {
                    console.log('🔄 Redirigiendo a:', redirectUrl);
                    window.location.href = redirectUrl;
                } else {
                    onSuccess(successData);
                }
            } else {
                const errorMsg = response.details?.message || response.error || 'Error procesando el pago';
                setError(errorMsg);
                if (onError) onError(errorMsg);
            }
        } catch (err) {
            console.error('[DirectPayForm] Excepción:', err);
            const errorMsg = err.error || err.message || 'Error de conexión';
            setError(errorMsg);
            if (onError) onError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-4 shadow-sm">
            <Card.Header className="bg-white">
                <h5 className="mb-0">Completa tu Pago {method?.name ? `- ${method.name}` : ''}</h5>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
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
                        </Col>
                        <Col md={6}>
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
                        </Col>
                    </Row>

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

                    {/* --- NUEVOS CAMPOS REQUERIDOS POR VITA (PSE, NEQUI, ETC) --- */}

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="+57..."
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    // PSE suele requerirlo, podrías poner required si siempre es PSE
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">Incluye código de país (ej: +57)</Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            {/* Este campo es clave para PSE */}
                            <Form.Group className="mb-3">
                                <Form.Label>Código Banco (Bank ID)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ej: 1007"
                                    value={formData.bank_id}
                                    onChange={(e) => handleChange('bank_id', e.target.value)}
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">Solo para Transferencias Bancarias</Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tipo Doc.</Form.Label>
                                <Form.Select
                                    value={formData.document_type}
                                    onChange={(e) => handleChange('document_type', e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="CC">CC (Cédula)</option>
                                    <option value="CE">CE (Extranjería)</option>
                                    <option value="NIT">NIT</option>
                                    <option value="PP">Pasaporte</option>
                                    <option value="RUT">RUT (Chile)</option>
                                    <option value="DNI">DNI (Argentina/Perú)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Group className="mb-3">
                                <Form.Label>Número de Documento</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.document_number}
                                    onChange={(e) => handleChange('document_number', e.target.value)}
                                    required // Generalmente requerido para pagos directos
                                    disabled={loading}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-grid gap-2 mt-3">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" animation="border" className="me-2" />
                                    Procesando Pago...
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