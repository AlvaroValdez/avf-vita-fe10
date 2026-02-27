// BobRatePulse.jsx - Real-time BOB → other currencies pulse card
import React, { useEffect, useState } from 'react';
import { getBoliviaRatesSummary } from '../services/api';
import './ExchangeRateCarousel.css'; // Reuse existing pulse CSS

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

const BobRatePulse = () => {
    const [rates, setRates] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await getBoliviaRatesSummary();
                if (response?.ok && Array.isArray(response.data?.rates)) {
                    setRates(response.data.rates.filter(r => parseFloat(r.bobRate) > 0));
                }
            } catch (e) {
                console.error('[BobRatePulse] Failed to fetch Bolivia rates', e);
            }
        };
        fetchRates();
        const refreshInterval = setInterval(fetchRates, 30000);
        return () => clearInterval(refreshInterval);
    }, []);

    useEffect(() => {
        if (rates.length === 0) return;
        const cycleInterval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % rates.length);
        }, 3000);
        return () => clearInterval(cycleInterval);
    }, [rates]);

    if (rates.length === 0) return null;

    const currentRate = rates[currentIndex];
    const displayValue = parseFloat(currentRate.bobRate || 0);

    // Format the display value: if tiny (< 0.01) show more decimals
    const formattedValue = displayValue < 0.01
        ? displayValue.toFixed(6)
        : displayValue.toFixed(4);

    return (
        <div className="pulse-container">
            <div className="pulse-card" key={currentRate.to}>
                <div className="pulse-indicator">
                    <span className="live-dot" style={{ backgroundColor: '#F7C843' }}></span>
                    <span className="live-text" style={{ color: '#c9910d' }}>En vivo</span>
                </div>
                <div className="pulse-countries">
                    <img src={FLAGS['BO']} alt="BOB" className="pulse-flag" />
                    <span className="pulse-arrow">→</span>
                    <img src={FLAGS[currentRate.to] || FLAGS['BO']} alt={currentRate.to} className="pulse-flag" />
                </div>
                <div className="pulse-currency">BOB/{currentRate.to}</div>
                <div className="pulse-value">{formattedValue}</div>
            </div>
        </div>
    );
};

export default BobRatePulse;
