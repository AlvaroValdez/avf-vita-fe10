import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <div className="bottom-nav d-lg-none fixed-bottom bg-white border-top shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <Nav className="justify-content-around py-2">
                <Nav.Item>
                    <Nav.Link as={Link} to="/" className={`d-flex flex-column align-items-center small ${isActive('/') ? 'text-primary fw-bold' : 'text-muted'}`}>
                        <i className={`bi ${isActive('/') ? 'bi-house-door-fill' : 'bi-house-door'} fs-4 mb-0 text-primary`}></i>
                        <span style={{ fontSize: '0.7rem' }}>Inicio</span>
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                    <Nav.Link as={Link} to="/favorites" className={`d-flex flex-column align-items-center small ${isActive('/favorites') ? 'text-primary fw-bold' : 'text-muted'}`}>
                        <i className={`bi ${isActive('/favorites') ? 'bi-people-fill' : 'bi-people'} fs-4 mb-0 text-primary`}></i>
                        <span style={{ fontSize: '0.7rem' }}>Destinatarios</span>
                    </Nav.Link>
                </Nav.Item>

                {/* Central "Send" Button - Floating effect */}
                <Nav.Item style={{ marginTop: '-25px' }}>
                    <Nav.Link as={Link} to="/" className="d-flex flex-column align-items-center">
                        <div className="rounded-circle shadow d-flex align-items-center justify-content-center"
                            style={{ width: '56px', height: '56px', backgroundColor: '#233E58', border: '3px solid white' }}>
                            {/* User wants "Enviar" here. Usually points to transfer flow. keeping href="/" for now or /transfer */}
                            <i className="bi bi-send-fill text-white fs-4"></i>
                        </div>
                        <span className="small fw-bold mt-1 text-primary">Enviar</span>
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                    <Nav.Link as={Link} to="/transactions" className={`d-flex flex-column align-items-center small ${isActive('/transactions') ? 'text-primary fw-bold' : 'text-muted'}`}>
                        <i className={`bi ${isActive('/transactions') ? 'bi-clock-history' : 'bi-clock'} fs-4 mb-0 text-primary`}></i>
                        <span style={{ fontSize: '0.7rem' }}>Seguimiento</span>
                    </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                    <Nav.Link as={Link} to="/profile" className={`d-flex flex-column align-items-center small ${isActive('/profile') ? 'text-primary fw-bold' : 'text-muted'}`}>
                        <i className={`bi ${isActive('/profile') ? 'bi-person-fill' : 'bi-person'} fs-4 mb-0 text-primary`}></i>
                        <span style={{ fontSize: '0.7rem' }}>Perfil</span>
                    </Nav.Link>
                </Nav.Item>
            </Nav>
        </div>
    );
};

export default BottomNav;
