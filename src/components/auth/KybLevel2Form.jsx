import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, Image } from 'react-bootstrap';
import { uploadKybDocuments, updateUserProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const KybLevel2Form = ({ onSuccess }) => {
    const { user, updateUserSession } = useAuth();

    // Datos corporativos (Level 1 KYB)
    const [businessData, setBusinessData] = useState({
        name: user?.business?.name || '',
        taxId: user?.business?.taxId || '',
        registrationNumber: user?.business?.registrationNumber || '',
        registeredAddress: user?.business?.registeredAddress || '',
        countryCode: user?.business?.countryCode || 'CL'
    });

    // Documentos corporativos (Level 2 KYB)
    const [files, setFiles] = useState({
        incorporation: null,
        taxIdCard: null,
        repAuthorization: null
    });

    const [previews, setPreviews] = useState({
        incorporation: null,
        taxIdCard: null,
        repAuthorization: null
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDataChange = (e) => {
        const { name, value } = e.target;
        setBusinessData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB para PDFs corporativos
                setError(`El archivo para ${fieldName} es demasiado grande (max 10MB).`);
                return;
            }

            setFiles(prev => ({ ...prev, [fieldName]: file }));

            // Preview solo si es imagen, si es PDF mostrar icono genérico
            if (file.type.startsWith('image/')) {
                const objectUrl = URL.createObjectURL(file);
                setPreviews(prev => ({ ...prev, [fieldName]: objectUrl }));
            } else {
                setPreviews(prev => ({ ...prev, [fieldName]: 'pdf-icon' }));
            }
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!businessData.name || !businessData.taxId || !businessData.registeredAddress) {
            setError('Por favor, completa los datos básicos de la empresa.');
            return;
        }

        if (!files.incorporation || !files.taxIdCard) {
            setError('Se requiere subir al menos el Acta de Constitución y el NIT/RUT.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Primero actualizamos los datos básicos
            const profileResponse = await updateUserProfile({
                business: businessData
            });

            if (!profileResponse.ok) throw new Error(profileResponse.error || 'Error al guardar datos básicos.');

            // 2. Luego subimos los archivos
            const formData = new FormData();
            if (files.incorporation) formData.append('incorporation', files.incorporation);
            if (files.taxIdCard) formData.append('taxIdCard', files.taxIdCard);
            if (files.repAuthorization) formData.append('repAuthorization', files.repAuthorization);

            const response = await uploadKybDocuments(formData);

            if (response.ok) {
                setSuccess('Datos y documentos enviados correctamente. Tu cuenta de empresa está en revisión.');

                const updatedUser = {
                    ...user,
                    business: response.business,
                    kyc: response.kyc
                };
                updateUserSession(updatedUser);

                if (onSuccess) {
                    setTimeout(() => onSuccess(), 2000);
                }
            }
        } catch (err) {
            setError(err.message || 'Error al procesar la alta KYB.');
        } finally {
            setLoading(false);
        }
    };

    if (user?.kyc?.status === 'pending') {
        return (
            <Alert variant="info">
                <Alert.Heading>Verificación KYB en Proceso</Alert.Heading>
                <p>
                    Tus documentos legales están siendo auditados. Este proceso puede tomar hasta 48 horas hábiles para cuentas corporativas.
                </p>
            </Alert>
        );
    }

    if (user?.kyc?.status === 'approved') {
        return (
            <Alert variant="success">
                <Alert.Heading>Cuenta Corporativa Verificada</Alert.Heading>
                <p>Tu empresa <strong>{user.business?.name}</strong> ha sido verificada con éxito.</p>
            </Alert>
        );
    }

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
                <h4 className="mb-3 text-primary">Verificación Institucional (KYB)</h4>
                <p className="text-muted small mb-4">
                    Para operar como empresa, proporcione la información legal y suba los documentos correspondientes.
                </p>

                <Form onSubmit={handleSubmit}>
                    <h6 className="fw-bold mb-3 border-bottom pb-2">Datos de la Empresa</h6>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Razón Social</Form.Label>
                                <Form.Control
                                    name="name"
                                    value={businessData.name}
                                    onChange={handleDataChange}
                                    placeholder="Nombre legal"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">ID Fiscal (NIT / RUT)</Form.Label>
                                <Form.Control
                                    name="taxId"
                                    value={businessData.taxId}
                                    onChange={handleDataChange}
                                    placeholder="Número de identificación fiscal"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold">Dirección Legal Registrada</Form.Label>
                        <Form.Control
                            name="registeredAddress"
                            value={businessData.registeredAddress}
                            onChange={handleDataChange}
                            placeholder="Dirección completa"
                            required
                        />
                    </Form.Group>

                    <h6 className="fw-bold mb-3 border-bottom pb-2">Documentación Legal (Nivel 2)</h6>
                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Acta de Constitución / Estatutos</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileChange(e, 'incorporation')}
                                />
                                <Form.Text className="text-muted small">Documento donde se oficializa la creación de la empresa.</Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">Copia de Identificación Fiscal</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => handleFileChange(e, 'taxIdCard')}
                                />
                                <Form.Text className="text-muted small">Certificado tributario o tarjeta de identificación fiscal.</Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>

                    {error && <Alert variant="danger" className="small">{error}</Alert>}
                    {success && <Alert variant="success" className="small">{success}</Alert>}

                    <div className="d-grid mt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            className="py-2 fw-bold text-primary"
                        >
                            {loading ? <><Spinner size="sm" animation="border" className="me-2" /> Procesando alta...</> : 'Enviar Documentación Corporativa'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default KybLevel2Form;
