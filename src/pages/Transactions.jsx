import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup, Badge, Form, Row, Col, Pagination, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getTransactions } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

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

        if (response.ok) {
          setTransactions(response.transactions);
          setTotalPages(Math.ceil(response.total / TRANSACTIONS_PER_PAGE));
        } else {
          throw new Error(response.error || 'Error al obtener transacciones del backend.');
        }
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
              <th>Monto</th>
              <th>Estado</th>
              <th>Vita ID</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.order}</td>
                <td>{tx.createdBy?.name || tx.createdBy?.email || 'N/A'}</td>
                <td>{tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}</td>
                <td>{tx.country}</td>
                {/* Asegurarse de formatear el monto y moneda correctamente */}
                <td>{new Intl.NumberFormat('es-CL', { style: 'currency', currency: tx.currency || 'CLP', minimumFractionDigits: 0 }).format(tx.amount || 0)}</td>
                <td>{getStatusBadge(tx.status)}</td>
                <td>{tx.vitaResponse?.id || tx.vitaResponse?.transaction?.id || 'N/A'}</td>
                <td>
       <Button size="sm" variant="outline-primary" as={Link} to={`/transactions/${tx._id}`}>
          Ver Detalle
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
    <Container className="my-5">
      <Card>
        <Card.Header as="h4">
          Historial de Transacciones {isAdmin && <Badge bg="primary" className="ms-2">Admin</Badge>}
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