import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup, Badge, Form, Row, Col, Pagination } from 'react-bootstrap';
import { getTransactions } from '../services/api';
import { useAppContext } from '../context/AppContext'; // 1. Importamos el contexto de la app

const TRANSACTIONS_PER_PAGE = 10;

const Transactions = () => {
  const { countries, loading: loadingCountries } = useAppContext(); // 2. Obtenemos la lista de países
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // 3. Añadimos 'country' al estado de los filtros
  const [filters, setFilters] = useState({
    status: '',
    country: '',
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const activeFilters = { ...filters };
        if (!activeFilters.status) delete activeFilters.status;
        if (!activeFilters.country) delete activeFilters.country;

        const response = await getTransactions({
          page: currentPage,
          limit: TRANSACTIONS_PER_PAGE,
          ...activeFilters
        });

        if (response.ok) {
          setTransactions(response.transactions);
          setTotalPages(Math.ceil(response.total / TRANSACTIONS_PER_PAGE));
        }
      } catch (err) {
        setError('No se pudieron cargar las transacciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters, currentPage]);

  const handleFilterChange = (e) => {
    setCurrentPage(1);
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // --- FUNCIÓN PARA DAR ESTILO AL ESTADO ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'succeeded': return <Badge bg="success">Completado</Badge>;
      case 'pending': return <Badge bg="warning">Pendiente</Badge>;
      case 'failed': return <Badge bg="danger">Fallido</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // --- FUNCIÓN RESTAURADA PARA RENDERIZAR EL CONTENIDO ---
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
    return (
      <ListGroup variant="flush">
        {transactions.map(tx => (
          <ListGroup.Item key={tx._id} className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <span className="fw-bold">{tx.beneficiary_first_name} {tx.beneficiary_last_name}</span>
              <small className="d-block text-muted">{new Date(tx.createdAt).toLocaleString()}</small>
            </div>
            <div className="text-end">
              <span className="me-3 fw-medium">{new Intl.NumberFormat('es-CL').format(tx.amount)} {tx.currency}</span>
              {getStatusBadge(tx.status)}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  return (
    <Container className="my-5">
      <Card>
        <Card.Header as="h4">Historial de Transacciones</Card.Header>
        <Card.Body>
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
              
              {/* 4. NUEVO FILTRO POR PAÍS */}
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Filtrar por País</Form.Label>
                  <Form.Select name="country" value={filters.country} onChange={handleFilterChange} disabled={loadingCountries}>
                    <option value="">Todos</option>
                    {loadingCountries ? (
                      <option>Cargando...</option>
                    ) : (
                      countries.map(country => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>

          {renderContent()}

          {totalPages > 1 && (
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