import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import logo from '../assets/images/logo.png';
import './Landing.css';

const features = [
    {
        icon: '🌎',
        title: 'Envíos Internacionales',
        desc: 'Transfiere dinero a Bolivia, Colombia, Perú y más países de forma segura.'
    },
    {
        icon: '⚡',
        title: 'Rápido y Simple',
        desc: 'Completa tu envío en minutos, directo desde tu cuenta bancaria.'
    },
    {
        icon: '🔒',
        title: 'Seguro y Transparente',
        desc: 'Tasa de cambio justa sin comisiones ocultas. Tu dinero siempre protegido.'
    }
];

const Landing = () => {
    const { login, token } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('onboard'); // 'onboard' | 'login'

    // Si ya está autenticado, redirigir al home
    if (token) return <Navigate to="/" replace />;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                toast.success('¡Bienvenido de nuevo!');
                navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Credenciales incorrectas. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing-root">

            {/* ─── LEFT / Hero Panel ───────────────────────────────── */}
            <div className="landing-hero">
                <div className="landing-hero-content">
                    <img src={logo} alt="Alyto" className="landing-logo" />
                    <h1 className="landing-tagline">
                        Envía dinero al extranjero<br />
                        <span className="landing-tagline-accent">sin complicaciones</span>
                    </h1>
                    <p className="landing-subtitle">
                        La plataforma de envíos internacionales de AV Finance,
                        diseñada para la comunidad latinoamericana.
                    </p>

                    {/* Feature cards */}
                    <div className="landing-features">
                        {features.map((f, i) => (
                            <div key={i} className="landing-feature-card">
                                <span className="landing-feature-icon">{f.icon}</span>
                                <div>
                                    <div className="landing-feature-title">{f.title}</div>
                                    <div className="landing-feature-desc">{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="landing-circle landing-circle-1"></div>
                <div className="landing-circle landing-circle-2"></div>
            </div>

            {/* ─── RIGHT / Login Panel ─────────────────────────────── */}
            <div className="landing-login-panel">
                <div className="landing-login-box">

                    {/* Mobile-only logo */}
                    <img src={logo} alt="Alyto" className="landing-logo-mobile" />

                    <h2 className="landing-login-title">Iniciar Sesión</h2>
                    <p className="landing-login-sub">Accede a tu cuenta para comenzar a enviar</p>

                    {error && (
                        <div className="landing-error">
                            <i className="bi bi-exclamation-triangle me-2"></i>{error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="landing-form">
                        <div className="landing-field">
                            <label>Correo electrónico</label>
                            <input
                                type="email"
                                placeholder="tu@correo.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="landing-field">
                            <label>Contraseña</label>
                            <div className="landing-pass-wrap">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="landing-pass-toggle"
                                    onClick={() => setShowPass(p => !p)}
                                    tabIndex={-1}
                                >
                                    <i className={`bi bi-eye${showPass ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="landing-forgot">
                            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                        </div>

                        <button type="submit" className="landing-btn-primary" disabled={loading}>
                            {loading
                                ? <><span className="landing-spinner"></span> Ingresando…</>
                                : 'Ingresar'}
                        </button>
                    </form>

                    <div className="landing-divider"><span>¿Eres nuevo?</span></div>

                    <Link to="/register" className="landing-btn-register">
                        Crear una cuenta gratuita
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Landing;
