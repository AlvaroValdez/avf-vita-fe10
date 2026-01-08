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
        // Refresh every 30 seconds
        const interval = setInterval(fetchRates, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || rates.length === 0) {
        return null;
    }

    // Duplicate for seamless loop
    const displayRates = [...rates, ...rates];

    return (
        <div className="exchange-rate-marquee-wrapper mb-4">
            <div className="exchange-rate-title">
                Nuestras Tasas
            </div>

            <div className="marquee-container">
                <div className="marquee-content">
                    {displayRates.map((rate, index) => (
                        <span key={`${rate.to}-${index}`} className="rate-item">
                            <span className="rate-from">CLP</span>
                            <i className="bi bi-arrow-right mx-2" style={{ fontSize: '0.7rem' }}></i>
                            <span className="rate-to">{rate.to}</span>
                            <span className="mx-2">:</span>
                            <span className="fw-bold">{parseFloat(rate.alytoRate).toFixed(4)}</span>
                            <span className="mx-3 rate-separator">|</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateMarquee;
