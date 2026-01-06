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

    // Colores por país (basados en banderas)
    const getCountryColor = (countryCode) => {
        const colors = {
            CO: '#FCD116', // Amarillo Colombia
            PE: '#D91023', // Rojo Perú
            AR: '#74ACDF', // Celeste Argentina
            BO: '#007934', // Verde Bolivia
            EC: '#FFD100', // Amarillo Ecuador
            VE: '#CF142B', // Rojo Venezuela
            MX: '#006847', // Verde México
            CL: '#0039A6', // Azul Chile
            BR: '#009B3A', // Verde Brasil
            PY: '#D52B1E', // Rojo Paraguay
            UY: '#0038A8', // Azul Uruguay
            PA: '#DA121A', // Rojo Panamá
            CR: '#002B7F', // Azul Costa Rica
            GT: '#4997D0', // Azul Guatemala
            SV: '#0F47AF', // Azul El Salvador
            HN: '#0073CF', // Azul Honduras
            NI: '#0067C6', // Azul Nicaragua
            DO: '#CE1126', // Rojo Rep. Dominicana
            ES: '#AA151B', // Rojo España
            US: '#B22234', // Rojo USA
            CN: '#DE2910', // Rojo China
            GB: '#012169', // Azul UK
            EU: '#003399', // Azul Europa
            AU: '#012169'  // Azul Australia
        };
        return colors[countryCode] || '#17a2b8'; // Cyan por defecto
    };

    return (
        <Card className="mb-4 border-primary shadow-sm">
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 fw-bold">
                        <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                        Tasas Vita en Tiempo Real
                    </h6>
                    <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={fetchRates}
                        disabled={loading}
                        className="py-1 px-2"
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" style={{ width: '12px', height: '12px' }} />
                                <small>Cargando...</small>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-clockwise"></i>
                            </>
                        )}
                    </Button>
                </div>

                {error && (
                    <div className="alert alert-warning small py-1 mb-2">
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
                        <div className="marquee-container">
                            <div className="marquee-content">
                                {/* Duplicar para efecto continuo */}
                                {[...rates, ...rates].map((r, index) => (
                                    <span
                                        key={`${r.to}-${index}`}
                                        className="px-3 py-2 me-2 badge"
                                        style={{
                                            backgroundColor: getCountryColor(r.to),
                                            color: '#fff',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        CLP→{r.to}: <strong>{parseFloat(r.rate).toFixed(3)}</strong>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <small className="text-muted d-block mt-2">
                            <i className="bi bi-clock"></i> {formatDateTime(lastUpdate)}
                        </small>
                    </>
                )}
            </Card.Body>

            <style>{`
        .marquee-container {
          overflow: hidden;
          position: relative;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 5%, rgba(255,255,255,1) 10%, rgba(255,255,255,1) 90%, rgba(255,255,255,0) 95%, rgba(255,255,255,0) 100%);
        }

        .marquee-content {
          display: flex;
          animation: scroll 40s linear infinite;
          will-change: transform;
        }

        .marquee-content:hover {
          animation-play-state: paused;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
        </Card>
    );
};

export default VitaRatesMarquee;
