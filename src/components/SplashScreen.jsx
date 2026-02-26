import React, { useEffect, useState } from 'react';
import logo from '../assets/images/logo.png';
import './SplashScreen.css';

/**
 * Pantalla de carga inicial (Splash Screen)
 * Se muestra durante ~1.8s al iniciar la app y luego desaparece con un fade-out.
 */
const SplashScreen = ({ onFinished }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Después de 1600ms empieza el fade-out (400ms de duración)
        const fadeTimer = setTimeout(() => setFadeOut(true), 1600);
        // Después del fade-out notificamos al padre para desmontar el splash
        const doneTimer = setTimeout(() => onFinished(), 2000);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(doneTimer);
        };
    }, [onFinished]);

    return (
        <div className={`splash-overlay${fadeOut ? ' splash-fade-out' : ''}`}>
            <div className="splash-content">
                <img src={logo} alt="Alyto" className="splash-logo" />
                <div className="splash-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
