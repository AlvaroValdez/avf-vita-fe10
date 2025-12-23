import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Button, Form, Row, Col, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { getQuote, createWithdrawal, createPaymentOrder, getPaymentMethods } from '../../services/api';
import { formatNumberForDisplay } from '../../utils/formatting';
import DirectPayForm from '../remittance/DirectPayForm';

/**
 * DirectPayWizard - Flujo completamente aislado para DirectPay
 * NO modifica ni depende de RemittanceSteps o StepConfirm
 */

const STEPS = {
    COUNTRY: 1,
    AMOUNT: 2,
    QUOTE: 3,
    BENEFICIARY: 4,
    PAYMENT: 5,
    SUCCESS: 6
};

const COUNTRIES = [
    { code: 'CO', name: 'Colombia', currency: 'COP' },
    { code: 'AR', name: 'Argentina', currency: 'ARS' },
    { code: 'MX', name: 'México', currency: 'MXN' },
    { code: 'BR', name: 'Brasil', currency: 'BRL' },
    { code: 'PE', name: 'Perú', currency: 'PEN' }
];

const DirectPayWizard = () => {
    const navigate = useNavigate();

    // Step control
    const [currentStep, setCurrentStep] = useState(STEPS.COUNTRY);

    // Form data
    const [destCountry, setDestCountry] = useState('');
    const [amount, setAmount] = useState('');
    const [quote, setQuote] = useState(null);
    const [beneficiary, setBeneficiary] = useState({
        beneficiary_first_name: '',
        beneficiary_last_name: '',
        beneficiary_email: '',
        bank_name: '',
        account_number: ''
    });
    const [paymentOrderId, setPaymentOrderId] = useState(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handlers
    const handleCountrySelect = (countryCode) => {
        setDestCountry(countryCode);
        setCurrentStep(STEPS.AMOUNT);
    };

    const handleAmountSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await getQuote({
                amount: Number(amount),
                destCountry,
                origin: 'CLP',
                originCountry: 'CL'
            });

            if (response?.ok && response?.data) {
                setQuote(response.data);
                setCurrentStep(STEPS.QUOTE);
            } else {
                throw new Error('No se pudo obtener cotización');
            }
        } catch (err) {
            setError(err.message || 'Error al obtener cotización');
        } finally {
            setLoading(false);
        }
    };

    const handleQuoteConfirm = () => {
        setCurrentStep(STEPS.BENEFICIARY);
    };

    const handleBeneficiarySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Create withdrawal
            const withdrawal = await createWithdrawal({
                country: destCountry,
                currency: 'CLP',
                amount: quote.amount,
                fee: quote.fee || 0,
                feePercent: quote.feePercent || 0,
                feeOriginAmount: quote.feeOriginAmount || 0,
                ...beneficiary
            });

            if (!withdrawal?.ok) {
                throw new Error(withdrawal?.error || 'Error al crear transacción');
            }

            // 2. Create payment order
            const paymentOrder = await createPaymentOrder({
                amount: quote.amount,
                country: 'CL',
                orderId: withdrawal?.data?.order
            });

            if (!paymentOrder?.ok) {
                throw new Error(paymentOrder?.error || 'Error al crear orden de pago');
            }

            const vitaOrderId = paymentOrder?.data?.id || paymentOrder?.raw?.id || paymentOrder?.raw?.data?.id;

            if (!vitaOrderId) {
                throw new Error('No se recibió ID de orden de pago');
            }

            setPaymentOrderId(vitaOrderId);
            setCurrentStep(STEPS.PAYMENT);
        } catch (err) {
            setError(err.message || 'Error al procesar');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setCurrentStep(STEPS.SUCCESS);
    };

    const handlePaymentError = (err) => {
        setError(err);
    };

    const getStepProgress = () => {
        return (currentStep / Object.keys(STEPS).length) * 100;
    };

    // Render functions
    const renderCountryStep = () => (
        <Card>
            <Card.Body>
                <h4 className="mb-4">Selecciona el país de destino</h4>
                <Row>
                    {COUNTRIES.map(country => (
                        <Col md={6} key={country.code} className="mb-3">
                            <Card
                                className="h-100 cursor-pointer hover-shadow"
                                onClick={() => handleCountrySelect(country.code)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card.Body className="text-center">
                                    <h5>{country.name}</h5>
                                    <small className="text-muted">{country.currency}</small>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card.Body>
        </Card>
    );

    const renderAmountStep = () => (
        <Card>
            <Card.Body>
                <h4 className="mb-4">¿Cuánto deseas enviar?</h4>
                <Form onSubmit={handleAmountSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Monto en CLP</Form.Label>
                        <Form.Control
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ej: 100000"
                            required
                            min="1000"
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-between">
                        <Button variant="outline-secondary" onClick={() => setCurrentStep(STEPS.COUNTRY)}>
                            Atrás
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'Cotizar'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );

    const renderQuoteStep = () => (
        <Card>
            <Card.Body>
                <h4 className="mb-4">Cotización</h4>
                <div className="p-3 bg-light rounded mb-3">
                    <Row>
                        <Col>
                            <strong>Envías:</strong>
                            <div className="fs-5">${formatNumberForDisplay(quote.amount)} CLP</div>
                        </Col>
                        <Col>
                            <strong>Recibirá:</strong>
                            <div className="fs-5">${formatNumberForDisplay(quote.amountOut)} {quote.destCurrency}</div>
                        </Col>
                    </Row>
                    <div className="mt-2 text-center">
                        <small className="text-muted">
                            Tasa: 1 {quote.destCurrency} = ${formatNumberForDisplay(1 / quote.rateWithMarkup)} CLP
                        </small>
                    </div>
                </div>
                <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setCurrentStep(STEPS.AMOUNT)}>
                        Atrás
                    </Button>
                    <Button variant="primary" onClick={handleQuoteConfirm}>
                        Continuar
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );

    const renderBeneficiaryStep = () => (
        <Card>
            <Card.Body>
                <h4 className="mb-4">Datos del beneficiario</h4>
                <Form onSubmit={handleBeneficiarySubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={beneficiary.beneficiary_first_name}
                                    onChange={(e) => setBeneficiary({ ...beneficiary, beneficiary_first_name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={beneficiary.beneficiary_last_name}
                                    onChange={(e) => setBeneficiary({ ...beneficiary, beneficiary_last_name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={beneficiary.beneficiary_email}
                            onChange={(e) => setBeneficiary({ ...beneficiary, beneficiary_email: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Banco</Form.Label>
                        <Form.Control
                            type="text"
                            value={beneficiary.bank_name}
                            onChange={(e) => setBeneficiary({ ...beneficiary, bank_name: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Número de cuenta</Form.Label>
                        <Form.Control
                            type="text"
                            value={beneficiary.account_number}
                            onChange={(e) => setBeneficiary({ ...beneficiary, account_number: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-between">
                        <Button variant="outline-secondary" onClick={() => setCurrentStep(STEPS.QUOTE)}>
                            Atrás
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : 'Continuar al Pago'}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );

    const renderPaymentStep = () => (
        <Card>
            <Card.Body>
                <h4 className="mb-4">Completa el pago</h4>
                <DirectPayForm
                    paymentOrderId={paymentOrderId}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                />
            </Card.Body>
        </Card>
    );

    const renderSuccessStep = () => (
        <Card className="text-center">
            <Card.Body>
                <div className="text-success mb-3" style={{ fontSize: '4rem' }}>✓</div>
                <h3 className="text-success">¡Pago Exitoso!</h3>
                <p className="text-muted">Tu transacción ha sido procesada correctamente.</p>
                <Button variant="primary" onClick={() => navigate('/transactions')}>
                    Ver mis transacciones
                </Button>
            </Card.Body>
        </Card>
    );

    return (
        <Container className="mt-5 mb-5">
            <div className="mb-4">
                <h2>DirectPay (Beta)</h2>
                <ProgressBar now={getStepProgress()} className="mb-3" />
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {currentStep === STEPS.COUNTRY && renderCountryStep()}
            {currentStep === STEPS.AMOUNT && renderAmountStep()}
            {currentStep === STEPS.QUOTE && renderQuoteStep()}
            {currentStep === STEPS.BENEFICIARY && renderBeneficiaryStep()}
            {currentStep === STEPS.PAYMENT && renderPaymentStep()}
            {currentStep === STEPS.SUCCESS && renderSuccessStep()}

            <div className="mt-4 text-center">
                <Button
                    variant="link"
                    onClick={() => navigate('/')}
                >
                    ← Volver al flujo tradicional
                </Button>
            </div>
        </Container>
    );
};

export default DirectPayWizard;
