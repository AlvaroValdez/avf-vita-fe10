import React, { useState, useEffect } from 'react';
import { getRates } from '../services/api';
import './ExchangeRateMarquee.css';

const ExchangeRateMarquee = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                // Fetch rates for major corridors
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
        // Refresh every 30 seconds
        const interval = setInterval(fetchRates, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || rates.length === 0) {
        return null;
    }

    // Duplicate rates for seamless loop
    const displayRates = [...rates, ...rates, ...rates];

    return (
        <div className="exchange-rate-marquee-container mb-4" style={{
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #233E58 0%, #4A6F9E 100%)',
            borderRadius: '12px',
            padding: '12px 0',
            position: 'relative'
        }}>
            <div className="marquee-wrapper" style={{
                display: 'flex',
                animation: 'scroll 20s linear infinite',
                width: 'fit-content'
            }}>
                {displayRates.map((rate, index) => (
                    <div
                        key={`${rate.pair}-${index}`}
                        className="rate-item"
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
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExchangeRateMarquee;
