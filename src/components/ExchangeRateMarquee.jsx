import React, { useState, useEffect } from 'react';
import { getRates } from '../services/api';
import './ExchangeRateMarquee.css';

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

    const displayRates = [...rates, ...rates];

    return (
        <div className="exchange-rate-marquee-wrapper mb-4">
            <div className="exchange-rate-title">
                Nuestras Tasas
            </div>

            <div className="marquee-container">
                <div className="marquee-content">
                    {displayRates.map((rate, index) => (
                        <span key={`${rate.pair}-${index}`} className="rate-item">
                            <span className="rate-from">{rate.from}</span>
                            <i className="bi bi-arrow-right mx-2" style={{ fontSize: '0.7rem' }}></i>
                            <span className="rate-to">{rate.to}</span>
                            <span className="mx-2">:</span>
                            <span className="fw-bold">{rate.rate.toFixed(4)}</span>
                            <span className="mx-3 rate-separator">|</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateMarquee;
