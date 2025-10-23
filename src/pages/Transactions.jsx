import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup, Badge, Form, Row, Col, Pagination } from 'react-bootstrap';
import { getTransactions } from '../services/api';
import { useAppContext } from '../context/AppContext';

const TRANSACTIONS_PER_PAGE = 10; // Define cuántas transacciones mostrar por página

const Transactions = () => {
  const { countries, loading: loadingCountries } = useAppContext();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // --- ESTADOS PARA LA PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({
    status: '',
    country: '',
  });

  // El useEffect ahora también depende de 'currentPage'
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const activeFilters = { ...filters };
        if (!activeFilters.status) delete activeFilters.status;
        if (!activeFilters.country) delete activeFilters.country;

        // Se incluyen los parámetros de paginación en la llamada a la API
        const response = await getTransactions({ 
          page: currentPage, 
          limit: TRANSACTIONS_PER_PAGE,
          ...activeFilters 
        });

        if (response.ok) {
          setTransactions(response.transactions);
          // El backend nos da el total para calcular el número de páginas
          setTotalPages(Math.ceil(response.total / TRANSACTIONS_PER_PAGE));
        } else {
          // Si la respuesta no es 'ok', lanzamos un error
           throw new Error(response.error || 'Error al obtener transacciones del backend.');
        }
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las transacciones.');
        setTransactions([]); // Limpia las transacciones en caso de error
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filters, currentPage]);

  const handleFilterChange = (e) => {
    setCurrentPage(1); // Resetea a la primera página al cambiar un filtro
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handlePageChange = (pageNumber) => {
    // Evita ir a páginas inválidas
    if (pageNumber < 1 || pageNumber > totalPages) return; 
    setCurrentPage(pageNumber);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'succeeded': return <Badge bg="success">Completado</Badge>;
      case 'pending': return <Badge bg="warning">Pendiente</Badge>;
      case 'failed': return <Badge bg="danger">Fallido</Badge>;
      default: return <Badge bg="secondary">{status || 'Desconocido'}</Badge>;
    }
  };

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
              {/* Muestra nombre o compañía si existe */}
              <span className="fw-bold">{tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}</span>
              <small className="d-block text-muted">{new Date(tx.createdAt).toLocaleString()}</small>
            </div>
            <div className="text-end">
              {/* Formatea el monto según la moneda */}
              <span className="me-3 fw-medium">
                {new Intl.NumberFormat('es-CL', { style: 'currency', currency: tx.currency || 'CLP' }).format(tx.amount || 0)}
              </span>
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
          {/* Formulario de Filtros */}
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
            </Row>
          </Form>

          {renderContent()}

          {/* Componente de Paginación */}
          {!loading && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1} 
                />
                {/* Genera los items de página */}
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