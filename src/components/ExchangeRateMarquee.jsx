import React, { useState, useEffect } from 'react';
import { getRates } from '../services/api';

const ExchangeRateMarquee = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const corridors = ['CO', 'BO', 'PE'];
                const ratePromises = corridors.map(async (country) => {
                    try {
                        const response = await getRates('CL', country);
                        return {
                            from: 'CLP',
                            to: response?.destCurrency || country,
                            rate: response?.rate || 0,
                            pair: `CLP-${country}`
                        };
                    } catch (error) {
                        console.error(`Error fetching rate for CLP-${country}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(ratePromises);
                const validRates = results.filter(r => r !== null && r.rate > 0);
                setRates(validRates);
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRates();
        const interval = setInterval(fetchRates, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || rates.length === 0) {
        return null;
    }

    // Duplicate for seamless loop
    const displayRates = [...rates, ...rates];

    return (
        <div className="mb-4" style={{
            background: 'linear-gradient(135deg, #233E58 0%, #4A6F9E 100%)',
            borderRadius: '12px',
            padding: '12px 0',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                textAlign: 'center',
                color: '#F7C843',
                fontWeight: 'bold',
                fontSize: '0.8rem',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                Nuestras Tasas
            </div>

            <div className="marquee-container">
                <div className="marquee-content">
                    {displayRates.map((rate, index) => (
                        <span
                            key={`${rate.pair}-${index}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0 20px',
                                whiteSpace: 'nowrap',
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}
                        >
                            <span style={{ color: '#F7C843' }}>{rate.from}</span>
                            <i className="bi bi-arrow-right mx-2" style={{ fontSize: '0.7rem' }}></i>
                            <span style={{ color: '#F7C843' }}>{rate.to}</span>
                            <span className="mx-2">:</span>
                            <span className="fw-bold">{rate.rate.toFixed(4)}</span>
                            <span className="mx-3" style={{ color: '#F7C843', opacity: 0.5 }}>|</span>
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
        .marquee-container {
          overflow: hidden;
          position: relative;
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
        </div>
    );
};

export default ExchangeRateMarquee;
