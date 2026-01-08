import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Badge } from 'react-bootstrap';
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { getTransactions } from '../services/api';
import { formatNumberForDisplay, formatRate } from '../utils/formatting';
import logo from '../assets/images/logo.png';

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

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orderId: paramOrderId } = useParams();

  let rawOrderId = paramOrderId || searchParams.get('orderId');
  if (rawOrderId && rawOrderId.includes('?')) {
    rawOrderId = rawOrderId.split('?')[0];
  }
  const orderId = rawOrderId;

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;

    const fetchTx = async () => {
      try {
        setLoading(true);
        const res = await getTransactions({ order: orderId });
        if (res?.transactions?.length > 0) {
          setTransaction(res.transactions[0]);
        }
      } catch (e) {
        console.error('Error fetching transaction:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [orderId]);

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

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return 'N/A';
    const str = String(accountNumber);
    return `•••• ${str.slice(-4)}`;
  };

  const getEstimatedArrival = () => {
    // Estimate 1-3 business days
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  };

  return (
    <Container className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '80vh' }}>
      <Card className="border-0 shadow-lg" style={{ maxWidth: '700px', width: '100%', borderRadius: '20px' }}>
        <Card.Body className="p-4 p-md-5">
          {/* Logo Header */}
          <div className="text-center mb-4">
            <img src={logo} alt="Alyto" style={{ height: '110px' }} className="mb-3" />
          </div>

          {/* Success Icon */}
          <div className="text-center mb-4">
            <div
              className="mx-auto"
              style={{
                width: '60px', height: '60px', borderRadius: '50%',
                backgroundColor: '#28a745', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
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

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : transaction ? (
            <>
              {/* Transaction Details Card */}
              <div className="bg-light p-4 rounded-3 mb-4">
                {/* Transaction ID */}
                <div className="mb-3 pb-3 border-bottom">
                  <small className="text-muted d-block mb-1">ID de Transacción</small>
                  <span className="fw-bold" style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
                    {orderId}
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

                {/* Exchange Rate */}
                {transaction.rateTracking?.rate && (
                  <div className="mb-3 pb-3 border-bottom">
                    <small className="text-muted d-block mb-2">Tasa de cambio</small>
                    <div className="d-inline-flex align-items-center px-3 py-2 rounded-pill" style={{ backgroundColor: '#F7C843' }}>
                      <span className="fw-bold text-dark">
                        1 {transaction.rateTracking.destCurrency} = {formatRate(1 / transaction.rateTracking.rate)} {transaction.currency}
                      </span>
                      <i className="bi bi-arrow-down-up ms-2 text-dark"></i>
                    </div>
                  </div>
                )}

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

                {/* Beneficiary & Bank Details - Combined and Prominent */}
                <div className="mb-3 pb-3 border-bottom">
                  <small className="text-muted d-block mb-3">Beneficiario</small>

                  {/* Name with Account Number */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-bold d-block fs-5" style={{ color: '#233E58' }}>
                          {transaction.beneficiary_first_name} {transaction.beneficiary_last_name}
                        </span>
                        {transaction.company_name && (
                          <small className="text-muted d-block mt-1">{transaction.company_name}</small>
                        )}
                      </div>
                      {transaction.account_bank && (
                        <span className="badge bg-light text-dark border px-3 py-2 font-monospace" style={{ fontSize: '0.95rem' }}>
                          {maskAccountNumber(transaction.account_bank)}
                        </span>
                      )}
                    </div>
                  </div>

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

                  {/* Additional Beneficiary Details */}
                  <div className="row g-3">
                    {/* CC Number */}
                    {transaction.beneficiary_cc && (
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1">CC</small>
                        <span className="font-monospace">{transaction.beneficiary_cc}</span>
                      </div>
                    )}

                    {/* Account Number (Full) */}
                    {transaction.account_bank && (
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1">Nro de cuenta</small>
                        <span className="font-monospace">{transaction.account_bank}</span>
                      </div>
                    )}

                    {/* Account Type */}
                    {transaction.account_type && (
                      <div className="col-md-6">
                        <small className="text-muted d-block mb-1">Tipo de cuenta</small>
                        <span>{transaction.account_type}</span>
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
                  </div>
                </div>

                {/* Status Only - Removed Timeline */}
                <div className="d-flex justify-content-center">
                  <div className="text-center">
                    <small className="text-muted d-block mb-2">Estado</small>
                    {getStatusBadge(transaction.status)}
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
                  as={Link}
                  to="/transactions"
                >
                  <i className="bi bi-list-ul me-2"></i>
                  Ver Mis Transacciones
                </Button>
              </div>
            </>
          ) : (
            orderId && (
              <div className="bg-light p-4 rounded-3 text-center">
                <small className="text-muted d-block mb-2">ID de Orden</small>
                <strong className="d-block" style={{ color: '#233E58', fontSize: '1.1rem', wordBreak: 'break-all' }}>
                  {orderId}
                </strong>
              </div>
            )
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentSuccess;