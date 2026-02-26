import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
    const isActive = (path) => location.pathname === path;

    const activeColor = '#233E58'; // Alyto Blue
    const inactiveColor = '#A0A0A0';

    // Custom Icons (SVG)
    const Icons = {
        Transfer: ({ active }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11V7.5C16 6.67 15.33 6 14.5 6H9.5C8.67 6 8 6.67 8 7.5V11L4 11L12 19L20 11H16ZM12 4L4 12H8V15.5C8 16.33 8.67 17 9.5 17H14.5C15.33 17 16 16.33 16 15.5V12H20L12 4Z" fill={active ? activeColor : inactiveColor} />
            </svg>
        ),
        Home: ({ active }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12.2033C2 9.91549 3.23316 7.85059 5.17881 6.84073L10.3639 4.14925C11.396 3.61352 12.604 3.61352 13.6361 4.14925L18.8212 6.84073C20.7668 7.85059 22 9.91549 22 12.2033V15.7071C22 18.0673 20.0864 19.9808 17.7262 19.9808H6.27376C3.91365 19.9808 2 18.0673 2 15.7071V12.2033Z" fill={active ? activeColor : inactiveColor} />
            </svg>
        ),
        Cards: ({ active }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.75 5.25C2.50736 5.25 1.5 6.25736 1.5 7.5V16.5C1.5 17.7426 2.50736 18.75 3.75 18.75H20.25C21.4926 18.75 22.5 17.7426 22.5 16.5V7.5C22.5 6.25736 21.4926 5.25 20.25 5.25H3.75ZM3 9V16.5C3 16.9142 3.33579 17.25 3.75 17.25H20.25C20.6642 17.25 21 16.9142 21 16.5V9H3Z" fill={active ? activeColor : inactiveColor} />
                <rect x="5.25" y="12.75" width="4.5" height="1.5" rx="0.75" fill={active ? activeColor : inactiveColor} />
            </svg>
        ),
        Activity: ({ active }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 2.25C7.58579 2.25 7.25 2.58579 7.25 3V4.5H6C4.34315 4.5 3 5.84315 3 7.5V19.5C3 21.1569 4.34315 22.5 6 22.5H18C19.6569 22.5 21 21.1569 21 19.5V7.5C21 5.84315 19.6569 4.5 18 4.5H16.75V3C16.75 2.58579 16.4142 2.25 16 2.25C15.5858 2.25 15.25 2.58579 15.25 3V4.5H8.75V3C8.75 2.58579 8.41421 2.25 8 2.25ZM6 6H18C18.8284 6 19.5 6.67157 19.5 7.5V19.5C19.5 20.3284 18.8284 21 18 21H6C5.17157 21 4.5 20.3284 4.5 19.5V7.5C4.5 6.67157 5.17157 6 6 6ZM8 10.5C7.58579 10.5 7.25 10.8358 7.25 11.25V11.25C7.25 11.6642 7.58579 12 8 12H16C16.4142 12 16.75 11.6642 16.75 11.25V11.25C16.75 10.8358 16.4142 10.5 16 10.5H8ZM8 15C7.58579 15 7.25 15.3358 7.25 15.75V15.75C7.25 16.1642 7.58579 16.5 8 16.5H13C13.4142 16.5 13.75 16.1642 13.75 15.75V15.75C13.75 15.3358 13.4142 15 13 15H8Z" fill={active ? activeColor : inactiveColor} />
            </svg>
        ),
        Profile: ({ active }) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C9.37665 2.25 7.25 4.37665 7.25 7C7.25 9.62335 9.37665 11.75 12 11.75C14.6234 11.75 16.75 9.62335 16.75 7C16.75 4.37665 14.6234 2.25 12 2.25ZM12 13.25C16.2802 13.25 19.75 16.7198 19.75 21C19.75 21.4142 19.4142 21.75 19 21.75H5C4.58579 21.75 4.25 21.4142 4.25 21C4.25 16.7198 7.71979 13.25 12 13.25Z" fill={active ? activeColor : inactiveColor} />
            </svg>
        )
    };

    const navItemClass = "d-flex flex-column align-items-center justify-content-center flex-grow-1 text-decoration-none";

    // Simplificamos los estilos: apilamos ícono y texto debajo (remera de fondo neutral)
    const getTextClass = (active) =>
        `mt-1 fw-bold text-center ${active ? 'text-primary' : 'text-secondary'}`;

    const getTextStyle = () => ({ fontSize: '11px', lineHeight: '1', });

    return (
        <div className="d-block d-lg-none fixed-bottom bg-white border-top shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: '70px' }}>
            <div className="d-flex justify-content-between align-items-center h-100 px-2">

                {/* Inicio */}
                <Link to="/" className={navItemClass}>
                    <Icons.Home active={isActive('/')} />
                    <span className={getTextClass(isActive('/'))} style={getTextStyle()}>Inicio</span>
                </Link>

                {/* Transferir */}
                <Link to="/send" className={navItemClass}>
                    <Icons.Transfer active={isActive('/send')} />
                    <span className={getTextClass(isActive('/send'))} style={getTextStyle()}>Transferir</span>
                </Link>

                {/* Contactos */}
                <Link to="/favorites" className={navItemClass}>
                    <Icons.Cards active={isActive('/favorites')} />
                    <span className={getTextClass(isActive('/favorites'))} style={getTextStyle()}>Contactos</span>
                </Link>

                {/* Historial */}
                <Link to="/transactions" className={navItemClass}>
                    <Icons.Activity active={isActive('/transactions')} />
                    <span className={getTextClass(isActive('/transactions'))} style={getTextStyle()}>Historial</span>
                </Link>

                {/* Perfil */}
                <Link to="/profile" className={navItemClass}>
                    <Icons.Profile active={isActive('/profile')} />
                    <span className={getTextClass(isActive('/profile'))} style={getTextStyle()}>Perfil</span>
                </Link>

            </div>
        </div>
    );
};

export default BottomNav;
