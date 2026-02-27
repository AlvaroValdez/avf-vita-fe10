// ExchangeRateCarousel.jsx
import React, { useEffect, useState, useRef } from 'react';
import { getAlytoRatesSummary } from '../services/api';
import './ExchangeRateCarousel.css';

// Helper to duplicate items for seamless infinite scroll
const duplicate = (arr) => [...arr, ...arr];

const ExchangeRateCarousel = () => {
    const [rates, setRates] = useState([]);
    const trackRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const data = await getAlytoRatesSummary();
                setRates(data);
            } catch (e) {
                console.error('Failed to fetch rates', e);
            }
        };
        fetchRates();
    }, []);

    // Pause / resume on hover / touch
    const handleMouseEnter = () => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
    };
    const handleMouseLeave = () => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
    };

    // Duplicate list for infinite effect
    const items = duplicate(rates);

    return (
        <div className="carousel-container" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="carousel-track" ref={trackRef}>
                {items.map((rate, idx) => (
                    <div className="carousel-card" key={idx}>
                        <div className="card-countries">
                            <img src={rate.fromFlag} alt={rate.fromCurrency} className="card-flag" />
                            <span className="card-arrow">→</span>
                            <img src={rate.toFlag} alt={rate.toCurrency} className="card-flag" />
                        </div>
                        <div className="card-currency">{rate.fromCurrency}/{rate.toCurrency}</div>
                        <div className="card-value">{rate.rate}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExchangeRateCarousel;
