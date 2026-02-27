// ExchangeRateCarousel.jsx
import React, { useEffect, useState, useRef } from 'react';
import { getAlytoRatesSummary } from '../services/api';
import './ExchangeRateCarousel.css';

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
    AR: flagAR, AU: flagAU, BO: flagBO, BR: flagBR, CL: flagCL, CN: flagCN,
    CO: flagCO, CR: flagCR, DO: flagDO, EC: flagEC, ES: flagES, EU: flagEU,
    GB: flagGB, GT: flagGT, HT: flagHT, MX: flagMX, PA: flagPA, PE: flagPE,
    PL: flagPL, PY: flagPY, SV: flagSV, US: flagUS, UY: flagUY, VE: flagVE
};

// Helper to duplicate items for seamless infinite scroll
const duplicate = (arr) => {
    if (!Array.isArray(arr)) return [];
    return [...arr, ...arr];
};

const ExchangeRateCarousel = () => {
    const [rates, setRates] = useState([]);
    const trackRef = useRef(null);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await getAlytoRatesSummary();
                let newRates = [];
                if (response?.ok && Array.isArray(response.data?.rates)) {
                    newRates = response.data.rates;
                } else if (Array.isArray(response)) {
                    newRates = response;
                }

                // Deduplicate items
                const uniqueRates = newRates.reduce((acc, rate) => {
                    if (!acc.find(r => r.to === rate.to)) {
                        acc.push(rate);
                    }
                    return acc;
                }, []);

                setRates(uniqueRates);
            } catch (e) {
                console.error('Failed to fetch rates', e);
            }
        };
        fetchRates();
    }, []);

    const handleMouseEnter = () => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
    };
    const handleMouseLeave = () => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
    };

    if (rates.length === 0) return null;

    const items = duplicate(rates);

    return (
        <div className="ticker-wrapper" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="ticker-track" ref={trackRef}>
                {items.map((rate, idx) => (
                    <div className="ticker-item" key={`${rate.to}-${idx}`}>
                        <div className="ticker-countries">
                            <img src={FLAGS['CL']} alt="CLP" className="ticker-flag" />
                            <span className="ticker-arrow">→</span>
                            <img src={FLAGS[rate.to] || FLAGS['CL']} alt={rate.to} className="ticker-flag" />
                        </div>
                        <div className="ticker-currency">CLP/{rate.to}</div>
                        <div className="ticker-value">{parseFloat(rate.alytoRate || rate.rate || 0).toFixed(4)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExchangeRateCarousel;
