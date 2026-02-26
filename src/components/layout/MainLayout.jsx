import React from 'react';
import { Container } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import AppNavbar from '../ui/Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const MainLayout = ({ children }) => {
    const { token } = useAuth();
    // Only show Sidebar (Desktop) and BottomNav (Mobile) if logged in.
    const showNav = !!token;

    return (
        <div className="d-flex min-vh-100 pb-5 pb-lg-0"> {/* Add padding bottom for mobile nav */}
            {showNav && <Sidebar />}

            <div className="flex-grow-1 d-flex flex-column" style={showNav ? { marginLeft: '280px' } : {}}>
                {/* On Mobile/Tablet (Sidebar hidden), remove margin */}
                <style>
                    {`
                        @media (max-width: 991.98px) {
                            .flex-grow-1 { margin-left: 0 !important; }
                        }
                    `}
                </style>

                {/* Top Navbar: Visible at all times to match redesign */}
                <AppNavbar />

                {/* p-top added to account for the fixed TopBar spacing (around 70px) */}
                <main className="p-3 p-md-4 mt-5 pt-4 mb-5 pb-5">
                    {children}
                </main>

                {/* Bottom Nav: Only visible on Mobile if logged in */}
                {showNav && <BottomNav />}
            </div>
        </div>
    );
};

export default MainLayout;
