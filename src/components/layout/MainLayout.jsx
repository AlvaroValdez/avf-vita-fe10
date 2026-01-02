import React from 'react';
import { Container } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import AppNavbar from '../ui/Navbar';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
    const { token } = useAuth();

    // If not logged in, show full width with just Navbar (Landing/Login style)
    // Or if we want Sidebar to appear only when logged in.
    const showSidebar = !!token;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bs-body-bg)' }}>
            {/* Desktop Sidebar (Only when logged in) */}
            {showSidebar && <Sidebar />}

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: showSidebar ? '280px' : '0', transition: 'margin-left 0.2s' }} className={showSidebar ? 'd-none d-lg-flex' : 'd-flex'}>
                {/* Correction: The above styles handle the desktop layout.
              For mobile/tablet (< lg), Sidebar is hidden by CSS classes in Sidebar.jsx, 
              so we need to reset margin-left to 0 on mobile.
          */}
            </div>

            {/* Wrapper to handle responsive logic correctly via CSS */}
            <div className="w-100 d-flex flex-column">
                {showSidebar && (
                    // Sidebar is fixed, so we add margin to body content on Large screens
                    // We use a CSS class or inline style with media query logic ideally.
                    // Since we use inline styles here, let's just rely on AppNavbar for Mobile and handle layout manually.
                    <>
                        <Sidebar />
                    </>
                )}

                <div className={`flex-grow-1 d-flex flex-column ${showSidebar ? 'ms-lg-auto' : ''}`} style={showSidebar ? { width: 'calc(100% - 280px)', marginLeft: '280px' } : {}}>
                    {/* Navbar is shown on all screens for now, or just Mobile? 
                 Design says: Desktop = Sidebar, Mobile = Header.
                 Let's Hide Navbar on Desktop if Sidebar is present.
             */}
                    <div className={showSidebar ? "d-lg-none" : ""}>
                        <AppNavbar />
                    </div>

                    <main className="flex-grow-1 p-3 p-md-4">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};
// Re-write to be cleaner using CSS Grid/Flex classes instead of complex inline styles
const CleanLayout = ({ children }) => {
    const { token } = useAuth();
    const showSidebar = !!token;

    return (
        <div className="d-flex min-vh-100">
            {showSidebar && <Sidebar />}

            <div className="flex-grow-1 d-flex flex-column" style={showSidebar ? { marginLeft: '280px' } : {}}>
                {/* On Mobile/Tablet (Sidebar hidden), remove margin */}
                <style>
                    {`
                        @media (max-width: 991.98px) {
                            .flex-grow-1 { margin-left: 0 !important; }
                        }
                    `}
                </style>

                {/* Navbar visible only on Mobile/Tablet if logged in, or always if not logged in */}
                <div className={showSidebar ? "d-lg-none" : ""}>
                    <AppNavbar />
                </div>

                <main className="p-3 p-md-4">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default CleanLayout;
