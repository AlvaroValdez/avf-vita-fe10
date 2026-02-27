import React from 'react';
import './SessionWarningModal.css';
import logo from '../assets/images/logo.png';

/**
 * Modal que advierte al usuario sobre el timeout de sesión inminente
 * 
 * @param {boolean} show - Si el modal debe mostrarse
 * @param {number} timeRemaining - Milisegundos restantes antes del logout
 * @param {function} onExtend - Callback para extender la sesión
 * @param {function} onLogout - Callback para cerrar sesión manualmente
 */
export const SessionWarningModal = ({ show, timeRemaining, onExtend, onLogout }) => {
    if (!show) return null;

    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    return (
        <div className="session-modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="session-modal-content">
                <div className="session-warning-icon">
                    <img src={logo} alt="Alyto" style={{ height: '80px', objectFit: 'contain' }} />
                </div>

                <h2 className="session-warning-title">Sesión por Expirar</h2>

                <p className="session-warning-text">
                    Tu sesión expirará en{' '}
                    <strong className="session-countdown">
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </strong>{' '}
                    por inactividad.
                </p>

                <p className="session-warning-subtext">
                    ¿Deseas continuar con tu sesión?
                </p>

                <div className="session-modal-actions">
                    <button
                        className="session-btn session-btn-primary"
                        onClick={onExtend}
                        autoFocus
                    >
                        Continuar Sesión
                    </button>
                    <button
                        className="session-btn session-btn-secondary"
                        onClick={onLogout}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningModal;
