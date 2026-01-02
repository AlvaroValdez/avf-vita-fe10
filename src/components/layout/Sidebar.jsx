import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import logo from '../../assets/images/logo.png';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="sidebar d-none d-lg-flex flex-column p-3" style={{ width: '280px', position: 'fixed', top: 0, bottom: 0, left: 0 }}>
            {/* Brand */}
            <Link to="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
                <img src={logo} alt="Alyto" style={{ height: '40px' }} className="me-2" />
                {/* Optional: <span className="fs-4 fw-bold text-white">Alyto</span> if logo doesn't have text */}
            </Link>
            <hr className="text-white-50" />

            {/* Nav Links */}
            <Nav className="flex-column mb-auto">
                <Nav.Item>
                    <Nav.Link as={Link} to="/" className={isActive('/') ? 'active' : ''}>
                        <i className="bi bi-house-door me-2"></i> Inicio
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to="/transactions" className={isActive('/transactions') ? 'active' : ''}>
                        <i className="bi bi-list-ul me-2"></i> Transacciones
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to="/profile" className={isActive('/profile') ? 'active' : ''}>
                        <i className="bi bi-person me-2"></i> Perfil
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link as={Link} to="/favorites" className={isActive('/favorites') ? 'active' : ''}>
                        <i className="bi bi-star me-2"></i> Favoritos
                    </Nav.Link>
                </Nav.Item>

                {/* Admin Links */}
                {user?.role === 'admin' && (
                    <>
                        <hr className="text-white-50 my-2" />
                        <div className="px-3 text-white-50 small text-uppercase mb-1">Admin</div>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/treasury" className={isActive('/admin/treasury') ? 'active' : ''}>
                                <i className="bi bi-wallet2 me-2"></i> Tesorería
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/users" className={isActive('/admin/users') ? 'active' : ''}>
                                <i className="bi bi-people me-2"></i> Usuarios
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link as={Link} to="/admin/kyc" className={isActive('/admin/kyc') ? 'text-warning active' : 'text-warning'}>
                                <i className="bi bi-shield-check me-2"></i> KYC
                            </Nav.Link>
                        </Nav.Item>
                    </>
                )}
            </Nav>

            <hr className="text-white-50" />
            <div className="dropdown">
                <div className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false" style={{ cursor: 'pointer' }}>
                    <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold me-2" style={{ width: 32, height: 32 }}>
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <strong>{user?.name || 'Usuario'}</strong>
                </div>
                <ul className="dropdown-menu text-small shadow" aria-labelledby="dropdownUser1">
                    <li><Link className="dropdown-item" to="/profile">Perfil</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={logout}>Cerrar Sesión</button></li>
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
