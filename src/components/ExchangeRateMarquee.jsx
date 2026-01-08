import React, { useState, useEffect } from 'react';
import { getAlytoRatesSummary } from '../services/api';
import './ExchangeRateMarquee.css';

// Import flags
import flagCL from '../assets/flags/cl.svg';
import flagCO from '../assets/flags/co.svg';
import flagBO from '../assets/flags/bo.svg';
import flagPE from '../assets/flags/pe.svg';
import flagAR from '../assets/flags/ar.svg';
import flagBR from '../assets/flags/br.svg';
import flagMX from '../assets/flags/mx.svg';
import flagVE from '../assets/flags/ve.svg';
import flagEC from '../assets/flags/ec.svg';

const FLAGS = {
    CL: flagCL,
    CO: flagCO,
    BO: flagBO,
    PE: flagPE,
    AR: flagAR,
    BR: flagBR,
    MX: flagMX,
    VE: flagVE,
    EC: flagEC
};

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
                            <img
                                src={FLAGS['CL']}
                                alt="CL"
                                className="rate-flag"
                            />
                            <i className="bi bi-arrow-right mx-1" style={{ fontSize: '0.7rem', opacity: 0.7 }}></i>
                            <img
                                src={FLAGS[rate.to] || FLAGS['CL']}
                                alt={rate.to}
                                className="rate-flag"
                            />
                            <span className="ms-2"><strong>{parseFloat(rate.alytoRate).toFixed(4)}</strong></span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateMarquee;
