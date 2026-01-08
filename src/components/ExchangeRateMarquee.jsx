import React from 'react';

const ExchangeRateMarquee = () => {
    return (
        <div className="mb-4" style={{
            background: 'linear-gradient(135deg, #233E58 0%, #4A6F9E 100%)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'white',
            textAlign: 'center',
            fontSize: '0.9rem'
        }}>
            <strong style={{ color: '#F7C843' }}>Nuestras tasas</strong>: CLP → COP | CLP → BOB | CLP → PEN
        </div>
    );
};

export default ExchangeRateMarquee;
