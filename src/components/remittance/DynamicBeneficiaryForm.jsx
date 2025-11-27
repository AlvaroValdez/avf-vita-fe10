import React, { useState, useEffect } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';

const DynamicBeneficiaryForm = ({ fields, onSubmit, initialData = {}, submitLabel = "Guardar" }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [fieldsToRender, setFieldsToRender] = useState([]);

    useEffect(() => {
        // Inicializar campos vacíos si no hay data inicial
        if (fields) {
            const init = { ...initialData };
            fields.forEach(field => {
                if (init[field.key] === undefined) init[field.key] = '';
            });
            setFormData(init);
        }
    }, [fields]); // Se ejecuta al cargar los campos

    useEffect(() => {
        if (fields) {
            const visible = fields.filter(field => {
                if (!field.when) return true;
                return formData[field.when.key] === field.when.value;
            });
            setFieldsToRender(visible);
        }
    }, [formData, fields]);

    const validateField = (name, value) => {
        const rule = fields.find(f => f.key === name);
        if (!rule) return null;
        const isRequired = rule.min > 0 || rule.required === true;
        if (isRequired && !value) return 'Requerido.';
        if (rule.min && value.length < rule.min) return `Mínimo ${rule.min} caracteres.`;
        if (rule.max && value.length > rule.max) return `Máximo ${rule.max} caracteres.`;
        if (rule.regex && !new RegExp(rule.regex).test(value)) return rule.helper_text || 'Formato inválido.';
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = () => {
        let newErrors = {};
        let isValid = true;
        fieldsToRender.forEach(field => {
            const error = validateField(field.key, formData[field.key]);
            if (error) {
                newErrors[field.key] = error;
                isValid = false;
            }
        });
        setErrors(newErrors);
        if (isValid) onSubmit(formData);
    };

    const renderField = (field) => {
        switch (field.type) {
            case 'select':
                return (
                    <Form.Select
                        name={field.key}
                        value={formData[field.key] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={!!errors[field.key]}
                    >
                        <option value="">Seleccionar...</option>
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Form.Select>
                );
            default:
                return (
                    <Form.Control
                        type={field.type || 'text'}
                        name={field.key}
                        value={formData[field.key] || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={!!errors[field.key]}
                    />
                );
        }
    };

    return (
        <Form>
            <Row>
                {fieldsToRender.map(field => (
                    <Col md={6} key={field.key}>
                        <Form.Group className="mb-3">
                            <Form.Label>{field.name}</Form.Label>
                            {renderField(field)}
                            <Form.Control.Feedback type="invalid">{errors[field.key]}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                ))}
            </Row>
            <div className="d-grid mt-3">
                <Button onClick={handleSubmit} style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}>
                    {submitLabel}
                </Button>
            </div>
        </Form>
    );
};

export default DynamicBeneficiaryForm;