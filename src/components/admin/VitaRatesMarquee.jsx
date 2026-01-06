import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { getPricesSummary } from '../../services/api';

const VitaRatesMarquee = () => {
    const [rates, setRates] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRates = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getPricesSummary();
            if (response.ok) {
                setRates(response.data.rates || []);
                setLastUpdate(response.data.lastUpdate);
            }
        } catch (err) {
            console.error('[VitaRatesMarquee] Error:', err);
            setError('Error cargando tasas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const formatDateTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('es-CL', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="mb-4 border-primary">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        Tasas Vita en Tiempo Real
                    </h5>
                    <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={fetchRates}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Actualizar
                            </>
                        )}
                    </Button>
                </div>

                {error && (
                    <div className="alert alert-warning small py-2 mb-2">
                        {error}
                    </div>
                )}

                {!loading && rates.length === 0 && (
                    <div className="text-muted text-center small">
                        No hay tasas disponibles
                    </div>
                )}

                {rates.length > 0 && (
                    <>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                            {rates.map((r) => (
                                <Badge
                                    key={r.to}
                                    bg="info"
                                    className="px-3 py-2"
                                    style={{ fontSize: '0.9rem', fontWeight: 'normal' }}
                                >
                                    CLP→{r.to}: <strong>{parseFloat(r.rate).toFixed(3)}</strong>
                                </Badge>
                            ))}
                        </div>
                        <small className="text-muted">
                            <i className="bi bi-clock"></i> Última actualización:{' '}
                            {formatDateTime(lastUpdate)}
                        </small>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default VitaRatesMarquee;
