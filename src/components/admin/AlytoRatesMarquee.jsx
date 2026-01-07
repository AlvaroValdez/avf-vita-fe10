import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { getAlytoRatesSummary } from '../../services/api';

const AlytoRatesMarquee = () => {
    const [rates, setRates] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRates = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getAlytoRatesSummary();
            if (response.ok) {
                setRates(response.data.rates || []);
                setLastUpdate(response.data.lastUpdate);
            }
        } catch (err) {
            console.error('[AlytoRatesMarquee] Error:', err);
            setError('Error cargando tasas Alyto');
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

    // Colores por país (mismo esquema que VitaRatesMarquee pero con tonos más suaves)
    const getCountryColor = (countryCode) => {
        const colors = {
            CO: '#FFE082', // Amarillo suave Colombia
            PE: '#EF9A9A', // Rojo suave Perú
            AR: '#90CAF9', // Celeste suave Argentina
            BO: '#81C784', // Verde suave Bolivia
            EC: '#FFF59D', // Amarillo pastel Ecuador
            VE: '#E57373', // Rojo pastel Venezuela
            MX: '#66BB6A', // Verde pastel México
            CL: '#64B5F6', // Azul suave Chile
            BR: '#4CAF50', // Verde Brasil
            PY: '#F48FB1', // Rosa Paraguay
            UY: '#42A5F5', // Azul Uruguay
            PA: '#EF5350', // Rojo Panamá
            CR: '#5C6BC0', // Azul Costa Rica
            GT: '#7986CB', // Azul Guatemala
            SV: '#5E35B1', // Púrpura El Salvador
            HN: '#1E88E5', // Azul Honduras
            NI: '#039BE5', // Azul Nicaragua
            DO: '#EC407A', // Rosa Rep. Dominicana
            ES: '#D32F2F', // Rojo España
            US: '#C62828', // Rojo oscuro USA
            CN: '#E53935', // Rojo China
            GB: '#283593', // Azul oscuro UK
            EU: '#1565C0', // Azul Europa
            AU: '#1A237E'  // Azul oscuro Australia
        };
        return colors[countryCode] || '#78909C'; // Gris azulado por defecto
    };

    return (
        <Card className="mb-4 shadow-sm" style={{
            borderLeft: '4px solid #9C27B0',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 fw-bold" style={{ color: '#6A1B9A' }}>
                        <i className="bi bi-cash-coin me-2"></i>
                        Tasas Alyto en Tiempo Real
                        <Badge bg="secondary" className="ms-2 small">Con Spread</Badge>
                    </h6>
                    <Button
                        size="sm"
                        variant="outline-secondary"
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
                                            color: '#263238',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                            border: '1px solid rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        CLP→{r.to}: <strong>{parseFloat(r.alytoRate).toFixed(3)}</strong>
                                        <small className="ms-1" style={{ opacity: 0.7 }}>({r.spreadPercent}%)</small>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <small className="text-muted d-block mt-2">
                            <i className="bi bi-info-circle"></i> Tasas mostradas al cliente (Vita - Spread) |
                            <i className="bi bi-clock ms-2"></i> {formatDateTime(lastUpdate)}
                        </small>
                    </>
                )}
            </Card.Body>

            <style>{`
        .marquee-container {
          overflow: hidden;
          position: relative;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0) 5%, 
            rgba(255,255,255,0.8) 10%, 
            rgba(255,255,255,0.8) 90%, 
            rgba(255,255,255,0) 95%, 
            rgba(255,255,255,0) 100%
          );
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

export default AlytoRatesMarquee;
