import React, { useState, useEffect } from 'react';
import { getAlytoRatesSummary } from '../services/api';
import './ExchangeRateMarquee.css';

const ExchangeRateMarquee = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRates = async () => {
        try {
            const response = await getAlytoRatesSummary();
            if (response.ok) {
                const ratesData = response.data.rates || [];
                setRates(ratesData);
            }
        } catch (error) {
            console.error('[ExchangeRateMarquee] Error fetching rates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
        const interval = setInterval(fetchRates, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || rates.length === 0) {
        return null;
    }

    const displayRates = [...rates, ...rates];

    return (
        <div className="exchange-rate-card mb-4">
            <div className="exchange-rate-header">
                <span className="exchange-rate-title">Nuestras tasas</span>
            </div>

            <div className="marquee-container">
                <div className="marquee-content">
                    {displayRates.map((rate, index) => (
                        <span key={`${rate.to}-${index}`} className="rate-badge">
                            CLP → {rate.to}: <strong>{parseFloat(rate.alytoRate).toFixed(4)}</strong>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateMarquee;
