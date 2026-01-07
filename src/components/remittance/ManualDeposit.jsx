import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Alert, Spinner, Image, Badge } from 'react-bootstrap';
import { createWithdrawal, uploadImage, getTransactionRules } from '../../services/api';
import { formatNumberForDisplay, formatRate } from '../../utils/formatting';
import logo from '../../assets/images/logo.png';

// Import flags
import flagCL from '../../assets/flags/cl.svg';
import flagCO from '../../assets/flags/co.svg';
import flagBO from '../../assets/flags/bo.svg';
import flagPE from '../../assets/flags/pe.svg';
import flagMX from '../../assets/flags/mx.svg';
import flagVE from '../../assets/flags/ve.svg';
import flagBR from '../../assets/flags/br.svg';
import flagAR from '../../assets/flags/ar.svg';
import flagUS from '../../assets/flags/us.svg';
import flagCR from '../../assets/flags/cr.svg';
import flagDO from '../../assets/flags/do.svg';
import flagEC from '../../assets/flags/ec.svg';
import flagES from '../../assets/flags/es.svg';
import flagEU from '../../assets/flags/eu.svg';
import flagGB from '../../assets/flags/gb.svg';
import flagGT from '../../assets/flags/gt.svg';
import flagHT from '../../assets/flags/ht.svg';
import flagPA from '../../assets/flags/pa.svg';
import flagPL from '../../assets/flags/pl.svg';
import flagPY from '../../assets/flags/py.svg';
import flagSV from '../../assets/flags/sv.svg';
import flagUY from '../../assets/flags/uy.svg';
import flagAU from '../../assets/flags/au.svg';
import flagCN from '../../assets/flags/cn.svg';

const FLAGS = {
    CL: flagCL, CO: flagCO, BO: flagBO, PE: flagPE, MX: flagMX, VE: flagVE,
    BR: flagBR, AR: flagAR, US: flagUS, CR: flagCR, DO: flagDO, EC: flagEC,
    ES: flagES, EU: flagEU, GB: flagGB, GT: flagGT, HT: flagHT, PA: flagPA,
    PL: flagPL, PY: flagPY, SV: flagSV, UY: flagUY, AU: flagAU, CN: flagCN
};

const getFlagUrl = (code) => FLAGS[code?.toUpperCase()] || '';

const ManualDeposit = ({ formData, onBack, onFinish }) => {
    const navigate = useNavigate();
    const { quoteData, beneficiary, destCountry, originCountry } = formData;
    const [bankDetails, setBankDetails] = useState(null);
    const [depositQr, setDepositQr] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [transactionData, setTransactionData] = useState(null);

    useEffect(() => {
        const loadRules = async () => {
            try {
                const res = await getTransactionRules(originCountry);
                if (res.ok && res.rules.length > 0) {
                    const rule = res.rules[0];
                    setBankDetails(rule.localBankDetails);
                    setDepositQr(rule.depositQrImage);
                }
            } catch (e) { console.error(e); setError("Error cargando datos bancarios."); }
        };
        loadRules();
    }, [originCountry]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const maskAccountNumber = (accountNumber) => {
        if (!accountNumber) return 'N/A';
        const str = String(accountNumber);
        if (str.length <= 4) return str;
        return `${'*'.repeat(str.length - 4)}${str.slice(-4)}`;
    };

    const handleSubmit = async () => {
        if (!file) return alert('Debes subir el comprobante de tu depósito.');
        setLoading(true);
        setError('');

        try {
            // 1. Subir imagen del comprobante
            setUploading(true);
            const formDataImg = new FormData();
            formDataImg.append('image', file);
            const uploadRes = await uploadImage(formDataImg);
            setUploading(false);

            // 2. Crear Transacción con la URL del comprobante
            const payload = {
                country: destCountry,
                currency: quoteData.origin,
                amount: quoteData.amount,
                fee: quoteData.fee || 0,
                feePercent: quoteData.feePercent || 0,
                feeOriginAmount: quoteData.feeOriginAmount || 0,
                ...beneficiary,
                proofOfPayment: uploadRes.url,
                paymentMethod: 'manual_anchor',
                rateTracking: quoteData.rateTracking || null,
                amountsTracking: quoteData.amountsTracking || null,
                feeAudit: quoteData.feeAudit || null,
                status: 'pending_verification'
            };

            console.log('🔍 [ManualDeposit] Payload:', payload);

            const res = await createWithdrawal(payload);

            if (res.ok) {
                setTransactionData({
                    ...payload,
                    order: res.transaction?.order || res.order || 'N/A',
                    destCountry: destCountry,
                    originCountry: originCountry
                });
                setSuccess(true);
            } else {
                throw new Error(res.error || "Error al crear solicitud.");
            }
        } catch (err) {
            setError(err.message || 'Error al procesar la solicitud.');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    // Enhanced success screen matching PaymentSuccess.jsx
    if (success && transactionData) {
        return (
            <Card className="border-0 shadow-lg" style={{ maxWidth: '550px', margin: '0 auto', borderRadius: '20px' }}>
                <Card.Body className="p-4 p-md-5">
                    {/* Logo Header */}
                    <div className="text-center mb-4">
                        <img src={logo} alt="Alyto" style={{ height: '90px' }} className="mb-3" />
                    </div>

                    {/* Success Icon */}
                    <div className="text-center mb-4">
                        <div
                            className="mx-auto"
                            style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                backgroundColor: '#28a745', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '40px', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                            }}
                        >
                            ✓
                        </div>
                    </div>

                    <h3 className="text-center fw-bold mb-2" style={{ color: '#233E58' }}>
                        ¡Pago Recibido!
                    </h3>
                    <p className="text-center text-muted mb-4">
                        Hemos recibido tu solicitud. Tu envío está en proceso.
                    </p>

                    {/* Transaction Details Card */}
                    <div className="bg-light p-4 rounded-3 mb-4">
                        {/* Transaction ID */}
                        <div className="mb-3 pb-3 border-bottom">
                            <small className="text-muted d-block mb-1">ID de Transacción</small>
                            <span className="fw-bold" style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
                                {transactionData.order}
                            </span>
                        </div>

                        {/* Origin Amount with Flag */}
                        <div className="mb-3 pb-3 border-bottom">
                            <small className="text-muted d-block mb-2">Tú enviaste</small>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    {getFlagUrl(originCountry) && (
                                        <img
                                            src={getFlagUrl(originCountry)}
                                            alt={originCountry}
                                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                    )}
                                    <span className="fw-bold fs-5 text-dark">{transactionData.currency}</span>
                                </div>
                                <span className="fw-bold" style={{ fontSize: '1.5rem', color: '#233E58' }}>
                                    $ {formatNumberForDisplay(transactionData.amount)}
                                </span>
                            </div>
                        </div>

                        {/* Destination Amount with Flag - PROMINENT */}
                        {transactionData.rateTracking?.destAmount && transactionData.rateTracking?.destCurrency && (
                            <div className="mb-3 pb-3 border-bottom">
                                <small className="text-muted d-block mb-2">Ellos reciben</small>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        {getFlagUrl(destCountry) && (
                                            <img
                                                src={getFlagUrl(destCountry)}
                                                alt={destCountry}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        )}
                                        <span className="fw-bold fs-5 text-dark">{transactionData.rateTracking.destCurrency}</span>
                                    </div>
                                    <span className="fw-bold" style={{ fontSize: '2rem', color: '#28a745' }}>
                                        {formatNumberForDisplay(transactionData.rateTracking.destAmount)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Exchange Rate */}
                        {transactionData.rateTracking?.rate && (
                            <div className="mb-3 pb-3 border-bottom">
                                <small className="text-muted d-block mb-2">Tasa de cambio</small>
                                <div className="d-inline-flex align-items-center px-3 py-2 rounded-pill" style={{ backgroundColor: '#F7C843' }}>
                                    <span className="fw-bold text-dark">
                                        1 {transactionData.rateTracking.destCurrency} = {formatRate(1 / transactionData.rateTracking.rate)} {transactionData.currency}
                                    </span>
                                    <i className="bi bi-arrow-down-up ms-2 text-dark"></i>
                                </div>
                            </div>
                        )}

                        {/* Beneficiary */}
                        <div className="mb-3 pb-3 border-bottom">
                            <small className="text-muted d-block mb-1">Beneficiario</small>
                            <span className="fw-bold d-block">
                                {transactionData.beneficiary_first_name} {transactionData.beneficiary_last_name}
                            </span>
                            {transactionData.company_name && (
                                <small className="text-muted">{transactionData.company_name}</small>
                            )}
                        </div>

                        {/* Bank Details - Updated */}
                        {transactionData.account_bank && (
                            <div className="mb-3 pb-3 border-bottom">
                                <small className="text-muted d-block mb-2">Datos del Beneficiario</small>
                                <div className="mb-2">
                                    <span className="fw-bold d-block mb-1">Banco</span>
                                    <span>{transactionData.bank_code || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="fw-bold d-block mb-1">Cuenta</span>
                                    <span className="font-monospace">{maskAccountNumber(transactionData.account_bank)}</span>
                                </div>
                            </div>
                        )}

                        {/* Status Only - Removed Timeline */}
                        <div className="d-flex justify-content-center">
                            <div className="text-center">
                                <small className="text-muted d-block mb-2">Estado</small>
                                <Badge bg="warning" className="px-3 py-2">
                                    <span className="me-1">⏳</span>
                                    Pendiente Verificación
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-grid gap-2">
                        <Button
                            variant="primary"
                            className="fw-bold text-white py-3"
                            onClick={() => navigate('/send')}
                        >
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Nueva Transacción
                        </Button>
                        <Button
                            variant="outline-primary"
                            className="fw-bold py-3"
                            onClick={() => navigate('/transactions')}
                        >
                            <i className="bi bi-list-ul me-2"></i>
                            Ver Mis Transacciones
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-0 mt-4">
            <Card.Header className="bg-white py-3 text-center">
                <h5 className="mb-0 text-primary">Instrucciones de Depósito ({originCountry})</h5>
            </Card.Header>
            <Card.Body className="p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Alert variant="info" className="small mb-4 text-center">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Realiza el pago por <strong>{quoteData.amountIn} {quoteData.origin}</strong> escaneando el QR o transfiriendo a la cuenta indicada.
                </Alert>

                {bankDetails ? (
                    <div className="bg-light p-4 rounded mb-4 border text-center">

                        {/* --- 1. QR GRANDE ARRIBA --- */}
                        {depositQr ? (
                            <div className="mb-4">
                                <p className="fw-bold text-muted mb-2">Escanear QR para Pagar</p>
                                <Image
                                    src={depositQr}
                                    fluid
                                    rounded
                                    style={{ maxHeight: '250px', border: '2px solid #ddd', padding: '5px', background: 'white' }}
                                    className="shadow-sm"
                                />
                            </div>
                        ) : (
                            <div className="mb-4 p-4 bg-white border rounded text-muted">Sin QR disponible</div>
                        )}

                        {/* --- 2. DATOS BANCARIOS DEBAJO --- */}
                        <div className="text-start mx-auto" style={{ maxWidth: '350px' }}>
                            <hr />
                            <h6 className="text-center text-muted mb-3">Datos de Transferencia</h6>
                            <p className="mb-1"><strong>Banco:</strong> {bankDetails.bankName}</p>
                            <p className="mb-1"><strong>Tipo de Cuenta:</strong> {bankDetails.accountType}</p>
                            <p className="mb-1"><strong>Nro. Cuenta:</strong> <span className="user-select-all bg-white px-2 border rounded">{bankDetails.accountNumber}</span></p>
                            <p className="mb-1"><strong>Titular:</strong> {bankDetails.holderName}</p>
                            <p className="mb-0"><strong>CI/NIT:</strong> {bankDetails.holderId}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-3"><Spinner size="sm" /> Cargando datos bancarios...</div>
                )}

                <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Subir Comprobante de Pago</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} accept="image/*" />
                    <Form.Text className="text-muted">Sube una foto clara o captura de pantalla de la transferencia realizada.</Form.Text>
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-flex justify-content-between mt-4">
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        disabled={loading}
                    >
                        Atrás
                    </Button>
                    <Button
                        className="w-50 fw-bold"
                        onClick={handleSubmit}
                        disabled={loading || !file}
                        style={{ backgroundColor: 'var(--avf-secondary)', borderColor: 'var(--avf-secondary)' }}
                    >
                        {loading ? (uploading ? 'Subiendo imagen...' : 'Procesando...') : 'Confirmar Depósito'}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ManualDeposit;