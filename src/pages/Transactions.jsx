import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, Badge, Form, Row, Col, Pagination, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getTransactions } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import ReceiptModal from '../components/ReceiptModal';

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

const TRANSACTIONS_PER_PAGE = 10; // Número de transacciones por página

const Transactions = () => {
  const { countries, loading: loadingCountries } = useAppContext();
  const { user } = useAuth(); // Obtiene el usuario actual para verificar rol
  const isAdmin = user?.role === 'admin'; // Determina si es administrador

  // Estados del componente
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ status: '', country: '' });

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const getFlagUrl = (code) => FLAGS[code?.toUpperCase()] || '';

  // Efecto para cargar las transacciones cuando cambian los filtros o la página
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(''); // Limpia errores anteriores
        const activeFilters = { ...filters };
        // Limpia filtros vacíos para no enviarlos a la API
        if (!activeFilters.status) delete activeFilters.status;
        if (!activeFilters.country) delete activeFilters.country;

        const response = await getTransactions({
          page: currentPage,
          limit: TRANSACTIONS_PER_PAGE,
          ...activeFilters
        });

        // Robust Response Handling
        let txList = [];
        let totalCount = 0;

        if (Array.isArray(response)) {
          // Direct Array Response
          txList = response;
          totalCount = response.length;
        } else if (response?.transactions && Array.isArray(response.transactions)) {
          // Object with transactions key
          txList = response.transactions;
          totalCount = response.total || response.transactions.length;
        } else if (response?.data && Array.isArray(response.data)) {
          // Object with data key
          txList = response.data;
          totalCount = response.total || response.data.length;
        } else if (response?.ok && Array.isArray(response?.data)) {
          // Wrapper with ok: true
          txList = response.data;
          totalCount = response.total || response.data.length;
        }

        // Only if we found nothing and response was an object implying failure? 
        // But getTransactions throws on http error. So if we are here, we likely have success or empty structure.

        setTransactions(txList);
        setTotalPages(totalCount > 0 ? Math.ceil(totalCount / TRANSACTIONS_PER_PAGE) : 1);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las transacciones.');
        setTransactions([]); // Limpia en caso de error
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters, currentPage]); // Dependencias: se ejecuta si cambian filtros o página

  // Manejador para cambios en los selectores de filtro
  const handleFilterChange = (e) => {
    setCurrentPage(1); // Vuelve a la primera página al aplicar un nuevo filtro
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  // Manejador para cambios de página en la paginación
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Handle view receipt
  const handleViewReceipt = (tx) => {
    setSelectedTransaction(tx);
    setShowReceiptModal(true);
  };

  // Función auxiliar para obtener el estilo del Badge según el estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'succeeded': return <Badge bg="success">Completado</Badge>;
      case 'pending': return <Badge bg="warning">Pendiente</Badge>;
      case 'failed': return <Badge bg="danger">Fallido</Badge>;
      case 'processing': return <Badge bg="info">Procesando</Badge>;
      default: return <Badge bg="secondary">{status || 'Desconocido'}</Badge>;
    }
  };

  // Función principal para renderizar el contenido (lista o tabla)
  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-5"><Spinner animation="border" /></div>;
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    if (transactions.length === 0) {
      return <Alert variant="info">No se encontraron transacciones con los filtros actuales.</Alert>;
    }

    // --- Renderizado Condicional: Tabla para Admin, Cards para Usuario ---
    if (isAdmin) {
      return (
        <Table striped bordered hover responsive size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Orden ID</th>
              <th>Remitente</th>
              <th>Beneficiario</th>
              <th>País</th>
              <th>Enviado</th>
              <th>Recibido</th>
              <th>Tasa Vita</th>
              <th>Tasa Alyto</th>
              <th>Ganancia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id}>
                <td>{new Date(tx.createdAt).toLocaleString('es-CL', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                <td><code className="small">{tx.order}</code></td>
                <td className="small">{tx.createdBy?.name || tx.createdBy?.email || 'N/A'}</td>
                <td className="small">{tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}</td>
                <td>{tx.country}</td>

                {/* Enviado */}
                <td className="text-end">
                  {tx.amountsTracking?.originTotal ? (
                    <><strong>{new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(tx.amountsTracking.originTotal)}</strong> <small className="text-muted">{tx.amountsTracking.originCurrency}</small></>
                  ) : (
                    <>{new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(tx.amount || 0)} <small className="text-muted">{tx.currency}</small></>
                  )}
                </td>

                {/* Recibido */}
                <td className="text-end">
                  {tx.amountsTracking?.destReceiveAmount ? (
                    <><strong>{new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(tx.amountsTracking.destReceiveAmount)}</strong> <small className="text-muted">{tx.amountsTracking.destCurrency}</small></>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>

                {/* Tasa Vita */}
                <td className="small text-muted text-center">
                  {tx.rateTracking?.vitaRate ? tx.rateTracking.vitaRate.toFixed(3) : '-'}
                </td>

                {/* Tasa Alyto */}
                <td className="small text-center">
                  {tx.rateTracking?.alytoRate ? <strong>{tx.rateTracking.alytoRate.toFixed(3)}</strong> : '-'}
                </td>

                {/* Ganancia */}
                <td className="text-end">
                  {tx.amountsTracking?.profitOriginCurrency ? (
                    <span className="text-success fw-bold">
                      {new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(tx.amountsTracking.profitOriginCurrency)} {tx.amountsTracking.originCurrency || 'CLP'}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>

                <td>
                  {tx.paymentMethod === 'manual_anchor' && (
                    <Badge bg="warning" text="dark" className="me-1">🏦</Badge>
                  )}
                  {getStatusBadge(tx.status)}
                </td>
                <td>
                  <div className="d-flex gap-1">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleViewReceipt(tx)}
                      title="Ver Comprobante"
                    >
                      <i className="bi bi-receipt"></i>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      as={Link}
                      to={`/transactions/${tx._id}`}
                      title="Ver Detalles"
                    >
                      <i className="bi bi-eye"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    } else {
      // Vista mejorada con cards para usuarios normales
      return (
        <div className="row g-3">
          {transactions.map(tx => (
            <div key={tx._id} className="col-12">
              <Card
                className="border-0 shadow-sm h-100 transition-shadow"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Card.Body className="p-3 p-md-4">
                  <div className="row align-items-center">
                    {/* Left Side - Beneficiary & Amounts */}
                    <div className="col-lg-7 mb-3 mb-lg-0">
                      {/* Beneficiary with Flag */}
                      <div className="d-flex align-items-center mb-3">
                        {getFlagUrl(tx.destCountry || tx.country) && (
                          <img
                            src={getFlagUrl(tx.destCountry || tx.country)}
                            alt={tx.destCountry || tx.country}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            className="me-3 flex-shrink-0"
                          />
                        )}
                        <div className="flex-grow-1">
                          <h6 className="mb-0 fw-bold" style={{ color: '#233E58' }}>
                            {tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}
                          </h6>
                          <small className="text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(tx.createdAt).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </small>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <small className="text-muted d-block mb-1">Enviaste</small>
                          <div className="d-flex align-items-center gap-2">
                            {getFlagUrl(tx.currency?.substring(0, 2)) && (
                              <img
                                src={getFlagUrl(tx.currency?.substring(0, 2))}
                                alt={tx.currency}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            )}
                            <span className="fw-bold" style={{ color: '#233E58' }}>
                              {new Intl.NumberFormat('es-CL', {
                                style: 'currency',
                                currency: tx.currency || 'CLP',
                                minimumFractionDigits: 0
                              }).format(tx.amount || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <small className="text-muted d-block mb-1">Reciben</small>
                          <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                            {tx.amountsTracking?.destReceiveAmount ? (
                              `${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(tx.amountsTracking.destReceiveAmount)} ${tx.amountsTracking.destCurrency}`
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Status & Actions */}
                    <div className="col-lg-5">
                      <div className="d-flex flex-column gap-3 align-items-lg-end">
                        {/* Status Badge */}
                        <div>
                          {tx.paymentMethod === 'manual_anchor' && (
                            <Badge bg="warning" text="dark" className="me-2">
                              <i className="bi bi-bank2"></i> Manual
                            </Badge>
                          )}
                          {getStatusBadge(tx.status)}
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReceipt(tx);
                            }}
                            className="d-flex align-items-center gap-2"
                          >
                            <i className="bi bi-receipt"></i>
                            Ver Comprobante
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            as={Link}
                            to={`/transactions/${tx._id}`}
                            className="d-flex align-items-center gap-2"
                          >
                            <i className="bi bi-info-circle"></i>
                            Detalles
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <Container className="my-4">
      {/* Logo Header */}
      <div className="text-center mb-4">
        <img src={logo} alt="Alyto" style={{ height: '90px' }} />
      </div>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom-0 py-3" style={{ borderRadius: '10px 10px 0 0' }}>
          <h4 className="fw-bold mb-0">
            Historial de Transacciones {isAdmin && <Badge bg="primary" className="ms-2">Admin</Badge>}
          </h4>
        </Card.Header>
        <Card.Body>
          {/* --- Formulario de Filtros --- */}
          <Form className="mb-4">
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Filtrar por Estado</Form.Label>
                  <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">Todos</option>
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="succeeded">Completado</option>
                    <option value="failed">Fallido</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Filtrar por País</Form.Label>
                  <Form.Select name="country" value={filters.country} onChange={handleFilterChange} disabled={loadingCountries}>
                    <option value="">Todos</option>
                    {loadingCountries ? <option>Cargando...</option> : countries.map(country => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>

          {/* Renderiza la lista o la tabla */}
          {renderContent()}

          {/* --- Paginación --- */}
          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages).keys()].map(number => (
                  <Pagination.Item
                    key={number + 1}
                    active={number + 1 === currentPage}
                    onClick={() => handlePageChange(number + 1)}
                  >
                    {number + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Receipt Modal */}
      <ReceiptModal
        show={showReceiptModal}
        onHide={() => setShowReceiptModal(false)}
        transaction={selectedTransaction}
        orderId={selectedTransaction?.order}
      />
    </Container>
  );
};

export default Transactions;