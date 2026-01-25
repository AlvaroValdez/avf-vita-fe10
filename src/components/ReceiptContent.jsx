import React from 'react';
import { Badge } from 'react-bootstrap';
import { formatNumberForDisplay, formatRate } from '../utils/formatting';

// Import flags
import flagCL from '../assets/flags/cl.svg';
import flagCO from '../assets/flags/co.svg';
import flagBO from '../assets/flags/bo.svg';
import flagPE from '../assets/flags/pe.svg';
import flagMX from '../assets/flags/mx.svg';
import flagVE from '../assets/flags/ve.svg';
import flagBR from '../assets/flags/br.svg';
import flagAR from '../assets/flags/ar.svg';
import flagUS from '../assets/flags/us.svg';
import flagCR from '../assets/flags/cr.svg';
import flagDO from '../assets/flags/do.svg';
import flagEC from '../assets/flags/ec.svg';
import flagES from '../assets/flags/es.svg';
import flagEU from '../assets/flags/eu.svg';
import flagGB from '../assets/flags/gb.svg';
import flagGT from '../assets/flags/gt.svg';
import flagHT from '../assets/flags/ht.svg';
import flagPA from '../assets/flags/pa.svg';
import flagPL from '../assets/flags/pl.svg';
import flagPY from '../assets/flags/py.svg';
import flagSV from '../assets/flags/sv.svg';
import flagUY from '../assets/flags/uy.svg';
import flagAU from '../assets/flags/au.svg';
import flagCN from '../assets/flags/cn.svg';

const FLAGS = {
    CL: flagCL, CO: flagCO, BO: flagBO, PE: flagPE, MX: flagMX, VE: flagVE,
    BR: flagBR, AR: flagAR, US: flagUS, CR: flagCR, DO: flagDO, EC: flagEC,
    ES: flagES, EU: flagEU, GB: flagGB, GT: flagGT, HT: flagHT, PA: flagPA,
    PL: flagPL, PY: flagPY, SV: flagSV, UY: flagUY, AU: flagAU, CN: flagCN
};

const getFlagUrl = (code) => FLAGS[code?.toUpperCase()] || '';

const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'N/A';
    const str = String(accountNumber);
    return `•••• ${str.slice(-4)}`;
};

const getStatusBadge = (status) => {
    const statusMap = {
        pending: { variant: 'warning', text: 'Pendiente', icon: '⏳' },
        processing: { variant: 'info', text: 'Procesando', icon: '🔄' },
        completed: { variant: 'success', text: 'Completado', icon: '✓' },
        succeeded: { variant: 'success', text: 'Exitoso', icon: '✓' },
        rejected: { variant: 'danger', text: 'Rechazado', icon: '✗' }
    };
    const config = statusMap[status] || { variant: 'secondary', text: status, icon: '•' };
    return (
        <Badge bg={config.variant} className="px-3 py-2">
            <span className="me-1">{config.icon}</span>
            {config.text}
        </Badge>
    );
};

// ✅ FIX: Calcular tasa efectiva con fallbacks (mismo que PaymentSuccess.jsx)
const getEffectiveRate = (transaction) => {
    if (!transaction) return null;

    // Prioridad 1: Usar tasa Alyto almacenada
    if (transaction.rateTracking?.alytoRate) {
        return transaction.rateTracking.alytoRate;
    }

    // Prioridad 2: Calcular desde montos reales
    const destAmount = transaction.rateTracking?.destAmount || transaction.amountsTracking?.destReceiveAmount;
    const originAmount = transaction.amountsTracking?.originPrincipal || transaction.amount;

    if (destAmount && originAmount && originAmount > 0) {
        return destAmount / originAmount;
    }

    // Prioridad 3: Usar tasa Vita como último recurso
    if (transaction.rateTracking?.vitaRate) {
        console.warn('[ReceiptContent] Usando tasa Vita como fallback');
        return transaction.rateTracking.vitaRate;
    }

    return null;
};

const ReceiptContent = ({ transaction, orderId }) => {
    if (!transaction) {
        return <div className="text-center p-4">No se encontró la transacción</div>;
    }

    return (
        <div className="bg-light p-4 rounded-3">
            {/* Transaction ID */}
            <div className="mb-3 pb-3 border-bottom">
                <small className="text-muted d-block mb-1">ID de Transacción</small>
                <span className="fw-bold" style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
                    {orderId || transaction.order}
                </span>
            </div>

            {/* Origin Amount with Flag */}
            <div className="mb-3 pb-3 border-bottom">
                <small className="text-muted d-block mb-2">Tú enviaste</small>
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        {getFlagUrl(transaction.currency?.substring(0, 2)) && (
                            <img
                                src={getFlagUrl(transaction.currency?.substring(0, 2))}
                                alt={transaction.currency}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        )}
                        <span className="fw-bold fs-5 text-dark">{transaction.currency}</span>
                    </div>
                    <span className="fw-bold" style={{ fontSize: '1.5rem', color: '#233E58' }}>
                        ${formatNumberForDisplay(transaction.amount)}
                    </span>
                </div>
            </div>

            {/* Destination Amount with Flag - PROMINENT */}
            {((transaction.rateTracking?.destAmount && transaction.rateTracking?.destCurrency) ||
                (transaction.amountsTracking?.destReceiveAmount && transaction.amountsTracking?.destCurrency)) && (
                    <div className="mb-3 pb-3 border-bottom">
                        <small className="text-muted d-block mb-2">Ellos reciben</small>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                                {getFlagUrl(transaction.destCountry || transaction.country) && (
                                    <img
                                        src={getFlagUrl(transaction.destCountry || transaction.country)}
                                        alt={transaction.destCountry}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                )}
                                <span className="fw-bold fs-5 text-dark">
                                    {transaction.rateTracking?.destCurrency || transaction.amountsTracking?.destCurrency || transaction.country}
                                </span>
                            </div>
                            <span className="fw-bold" style={{ fontSize: '2rem', color: '#28a745' }}>
                                {formatNumberForDisplay(
                                    transaction.rateTracking?.destAmount || transaction.amountsTracking?.destReceiveAmount || 0
                                )}
                            </span>
                        </div>
                    </div>
                )}

            {/* Exchange Rate - With Fallback Logic */}
            {(() => {
                const effectiveRate = getEffectiveRate(transaction);
                const destCurrency = transaction.rateTracking?.destCurrency || transaction.amountsTracking?.destCurrency;

                return effectiveRate && destCurrency ? (
                    <div className="mb-3 pb-3 border-bottom">
                        <small className="text-muted d-block mb-2">Tasa de cambio</small>
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-light text-dark border px-3 py-2">
                                <i className="bi bi-arrow-left-right me-2"></i>
                                <span className="fw-bold">
                                    1 {transaction.currency} = {formatRate(effectiveRate)} {destCurrency}
                                </span>
                            </span>
                        </div>
                    </div>
                ) : null;
            })()}

            {/* Fee Information */}
            {transaction.fee > 0 && (
                <div className="mb-3 pb-3 border-bottom">
                    <small className="text-muted d-block mb-2">Comisión</small>
                    <span className="fw-bold">
                        $ {formatNumberForDisplay(transaction.fee)} {transaction.currency}
                        {transaction.feePercent && ` (${transaction.feePercent}%)`}
                    </span>
                </div>
            )}

            {/* Beneficiary & Bank Details */}
            <div className="mb-3 pb-3 border-bottom">
                <small className="text-muted d-block mb-3">Beneficiario</small>

                {/* Name */}
                <div className="fw-bold fs-5 mb-3" style={{ color: '#233E58' }}>
                    {transaction.beneficiary_first_name} {transaction.beneficiary_last_name}
                    {transaction.company_name && (
                        <small className="text-muted d-block mt-1">{transaction.company_name}</small>
                    )}
                </div>

                {/* Account Number - Masked */}
                {transaction.account_bank && (
                    <div className="mb-3">
                        <small className="text-muted d-block mb-1">Nro de cuenta</small>
                        <span className="badge bg-light text-dark border px-3 py-2 font-monospace" style={{ fontSize: '0.95rem' }}>
                            {maskAccountNumber(transaction.account_bank)}
                        </span>
                    </div>
                )}

                {/* Bank Name */}
                {transaction.bank_code && (
                    <div className="d-flex align-items-center gap-2 p-3 rounded-2 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                        <i className="bi bi-bank2 text-primary" style={{ fontSize: '1.5rem' }}></i>
                        <div>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Banco</small>
                            <span className="fw-bold" style={{ fontSize: '1rem' }}>{transaction.bank_code}</span>
                        </div>
                    </div>
                )}

                {/* Additional Details Grid */}
                <div className="row g-3">
                    {/* Document/CI */}
                    {transaction.beneficiary_cc && (
                        <div className="col-md-6">
                            <small className="text-muted d-block mb-1">CI</small>
                            <span className="font-monospace fw-bold">{transaction.beneficiary_cc}</span>
                        </div>
                    )}

                    {/* Account Type */}
                    {transaction.account_type && (
                        <div className="col-md-6">
                            <small className="text-muted d-block mb-1">Tipo de cuenta</small>
                            <span className="fw-bold">{transaction.account_type}</span>
                        </div>
                    )}

                    {/* Concept */}
                    {transaction.concept && (
                        <div className="col-12">
                            <small className="text-muted d-block mb-1">Concepto</small>
                            <span>{transaction.concept}</span>
                        </div>
                    )}

                    {/* Created Date */}
                    {transaction.createdAt && (
                        <div className="col-md-6">
                            <small className="text-muted d-block mb-1">Fecha de envío</small>
                            <span>{new Date(transaction.createdAt).toLocaleString('es-ES', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
                            })}</span>
                        </div>
                    )}

                    {/* Estimated Time */}
                    <div className="col-md-6">
                        <small className="text-muted d-block mb-1">Tiempo estimado</small>
                        <span>En unas horas hábiles</span>
                    </div>

                    {/* Vita Transfer ID */}
                    {transaction.vitaTransferId && (
                        <div className="col-12">
                            <small className="text-muted d-block mb-1">Transfer ID</small>
                            <div className="d-flex align-items-center gap-2">
                                <span className="font-monospace small text-break" style={{ fontSize: '0.85rem' }}>
                                    {transaction.vitaTransferId}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status */}
            <div className="d-flex justify-content-center">
                <div className="text-center">
                    <small className="text-muted d-block mb-2">Estado</small>
                    {getStatusBadge(transaction.status)}
                </div>
            </div>
        </div>
    );
};

export default ReceiptContent;
