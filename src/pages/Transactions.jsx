import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup, Badge, Form, Row, Col, Pagination } from 'react-bootstrap';
import { getTransactions } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext'; 

const TRANSACTIONS_PER_PAGE = 10; // Define cuántas transacciones mostrar por página

const Transactions = () => {
  const { countries, loading: loadingCountries } = useAppContext();
  const { user } = useAuth(); // 2. Obtenemos el usuario actual
  const isAdmin = user?.role === 'admin'; // 3. Verificamos si es admin

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

    // --- ESTADOS PARA LA PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ status: '', country: '' });
  
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

  // --- RENDERIZADO CONDICIONAL ---
  const renderContent = () => {
    if (loading) return <div className="text-center p-5"><Spinner /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (transactions.length === 0) return <Alert variant="info">No hay transacciones.</Alert>;

    // 4. Si es Admin, muestra una tabla detallada
    if (isAdmin) {
      return (
        <Table striped bordered hover responsive size="sm" className="mt-3">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Orden ID</th>
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
                <td>{tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}</td>
                <td>{tx.country}</td>
                <td>{new Intl.NumberFormat('es-CL').format(tx.amount || 0)} {tx.currency}</td>
                <td>{getStatusBadge(tx.status)}</td>
                {/* Intentamos mostrar el ID de Vita si existe */}
                <td>{tx.vitaResponse?.id || tx.vitaResponse?.transaction?.id || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    } 
    // 5. Si es Usuario normal, muestra la lista simple
    else {
      return (
        <ListGroup variant="flush">
          {transactions.map(tx => (
            <ListGroup.Item key={tx._id} className="d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <span className="fw-bold">{tx.company_name || `${tx.beneficiary_first_name || ''} ${tx.beneficiary_last_name || ''}`.trim()}</span>
                <small className="d-block text-muted">{new Date(tx.createdAt).toLocaleString()}</small>
              </div>
              <div className="text-end">
                <span className="me-3 fw-medium">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: tx.currency || 'CLP' }).format(tx.amount || 0)}</span>
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
        <Card.Header as="h4">Historial de Transacciones {isAdmin && <Badge bg="primary" className="ms-2">Admin</Badge>}</Card.Header>
        <Card.Body>
          {/* ... (Formulario de filtros y Paginación sin cambios) ... */}
          {renderContent()}
          {/* ... */}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Transactions;