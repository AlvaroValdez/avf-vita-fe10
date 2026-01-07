import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup, Badge, Form, Row, Col, Pagination, Table, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getTransactions } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';

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

  // Función auxiliar para obtener el estilo del Badge según el estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'succeeded': return <Badge bg="success">Completado</Badge>;
      case 'pending': return <Badge bg="warning">Pendiente</Badge>;
      case 'failed': return <Badge bg="danger">Fallido</Badge>;
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

    // --- Renderizado Condicional: Tabla para Admin, Lista para Usuario ---
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
              <th>Spread%</th>
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

                {/* Spread% */}
                <td className="text-center">
                  {tx.rateTracking?.spreadPercent ? (
                    <Badge bg="warning" text="dark">{tx.rateTracking.spreadPercent}%</Badge>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>

                {/* Ganancia */}
                <td className="text-end">
                  {tx.amountsTracking?.profitDestCurrency ? (
                    <span className="text-success fw-bold">
                      {new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(tx.amountsTracking.profitDestCurrency)} {tx.amountsTracking.destCurrency}
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
                  <Button size="sm" variant="outline-primary" as={Link} to={`/transactions/${tx._id}`}>
                    <i className="bi bi-eye"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    } else {
      // Vista simple para usuarios normales
      return (
        <ListGroup variant="flush">
          {transactions.map(tx => (
            <ListGroup.Item
              key={tx._id}
              action
              as={Link}
              to={`/transactions/${tx._id}`}
              className="d-flex justify-content-between align-items-center flex-wrap"
            >
              <div>
                <span className="fw-bold">{tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}</span>
                <small className="d-block text-muted">{new Date(tx.createdAt).toLocaleString()}</small>
              </div>
              <div className="text-end">
                <span className="me-3 fw-medium">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: tx.currency || 'CLP', minimumFractionDigits: 0 }).format(tx.amount || 0)}
                </span>
                {getStatusBadge(tx.status)}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
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
              {/* Se podría añadir un filtro por Order ID aquí si fuera necesario */}
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
    </Container>
  );
};

export default Transactions;