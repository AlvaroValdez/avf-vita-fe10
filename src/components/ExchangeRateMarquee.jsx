import React, { useState, useEffect } from 'react';
import { getAlytoRatesSummary } from '../services/api';
import './ExchangeRateMarquee.css';

// Import ALL available flags
import flagAR from '../assets/flags/ar.svg';
import flagAU from '../assets/flags/au.svg';
import flagBO from '../assets/flags/bo.svg';
import flagBR from '../assets/flags/br.svg';
import flagCL from '../assets/flags/cl.svg';
import flagCN from '../assets/flags/cn.svg';
import flagCO from '../assets/flags/co.svg';
import flagCR from '../assets/flags/cr.svg';
import flagDO from '../assets/flags/do.svg';
import flagEC from '../assets/flags/ec.svg';
import flagES from '../assets/flags/es.svg';
import flagEU from '../assets/flags/eu.svg';
import flagGB from '../assets/flags/gb.svg';
import flagGT from '../assets/flags/gt.svg';
import flagHT from '../assets/flags/ht.svg';
import flagMX from '../assets/flags/mx.svg';
import flagPA from '../assets/flags/pa.svg';
import flagPE from '../assets/flags/pe.svg';
import flagPL from '../assets/flags/pl.svg';
import flagPY from '../assets/flags/py.svg';
import flagSV from '../assets/flags/sv.svg';
import flagUS from '../assets/flags/us.svg';
import flagUY from '../assets/flags/uy.svg';
import flagVE from '../assets/flags/ve.svg';

const FLAGS = {
    AR: flagAR,
    AU: flagAU,
    BO: flagBO,
    BR: flagBR,
    CL: flagCL,
    CN: flagCN,
    CO: flagCO,
    CR: flagCR,
    DO: flagDO,
    EC: flagEC,
    ES: flagES,
    EU: flagEU,
    GB: flagGB,
    GT: flagGT,
    HT: flagHT,
    MX: flagMX,
    PA: flagPA,
    PE: flagPE,
    PL: flagPL,
    PY: flagPY,
    SV: flagSV,
    US: flagUS,
    UY: flagUY,
    VE: flagVE
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

    // Deduplicate by 'to' country code in case backend returns duplicates
    const uniqueRates = rates.reduce((acc, rate) => {
        const existing = acc.find(r => r.to === rate.to);
        if (!existing) {
            acc.push(rate);
        } else {
            console.warn(`[ExchangeRateMarquee] Duplicate rate for ${rate.to}: `, { existing, new: rate });
        }
        return acc;
    }, []);

    // Log all rates with flag availability
    console.log('[ExchangeRateMarquee] Total rates received:', rates.length);
    console.log('[ExchangeRateMarquee] Unique rates:', uniqueRates.length);
    uniqueRates.forEach(r => {
        const hasFlag = FLAGS[r.to] !== undefined;
        console.log(`  ${r.to}: ${r.alytoRate} | Flag: ${hasFlag ? '✓' : '✗ MISSING'}`);
    });

    const displayRates = [...uniqueRates, ...uniqueRates];

    const COUNTRY_CURRENCY = {
        AR: 'ARS', AU: 'AUD', BO: 'BOB', BR: 'BRL', CL: 'CLP', CN: 'CNY',
        CO: 'COP', CR: 'CRC', DO: 'DOP', EC: 'USD', ES: 'EUR', EU: 'EUR',
        GB: 'GBP', GT: 'GTQ', HT: 'HTG', MX: 'MXN', PA: 'PAB', PE: 'PEN',
        PL: 'PLN', PY: 'PYG', SV: 'USD', US: 'USD', UY: 'UYU', VE: 'VES'
    };

    return (
        <div className="exchange-rate-card mb-4">
            <div className="exchange-rate-header">
                <span className="exchange-rate-title">Nuestras tasas</span>
            </div>

            <div className="marquee-container">
                <div className="marquee-content">
                    {displayRates.map((rate, index) => {
                        const destCurrency = COUNTRY_CURRENCY[rate.to] || rate.to;
                        return (
                            <div key={`${rate.to}-${index}`} className="rate-card">
                                <div className="rate-card-countries">
                                    <img src={FLAGS['CL']} alt="CL" className="rate-flag" />
                                    <span className="rate-currency">CLP</span>
                                    <i className="bi bi-arrow-right mx-1 text-muted" style={{ fontSize: '0.8rem' }}></i>
                                    <img src={FLAGS[rate.to] || FLAGS['CL']} alt={rate.to} className="rate-flag" />
                                    <span className="rate-currency">{destCurrency}</span>
                                </div>
                                <div className="rate-card-value">
                                    {parseFloat(rate.alytoRate).toFixed(4)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateMarquee;
