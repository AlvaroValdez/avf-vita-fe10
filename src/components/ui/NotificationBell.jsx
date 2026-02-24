// src/components/ui/NotificationBell.jsx
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ color = "currentColor", dropDirection = "down" }) => {
    const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = (notif) => {
        markAsRead(notif.id);
        // Si hay data adicional como orderId, se podría navegar:
        // if (notif.data?.orderId) navigate(`/transactions`);
    };

    const handleTestPush = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/test-push`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
        } catch (e) {
            console.error('Test Push Error:', e);
            alert('Error probando push: ' + e.message);
        }
    };

    return (
        <Dropdown align="end" drop={dropDirection} onToggle={(isOpen) => isOpen && unreadCount > 0 && markAllAsRead()}>
            <Dropdown.Toggle
                as="button"
                className="btn p-0 border-0 bg-transparent position-relative d-flex align-items-center justify-content-center"
                style={{ color, boxShadow: 'none' }}
                aria-label="Notificaciones"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-light"
                        style={{ fontSize: '0.65rem', padding: '0.25em 0.4em' }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow-lg border-0 rounded-4 p-0 mt-2" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light rounded-top-4">
                    <h6 className="m-0 fw-bold">Notificaciones</h6>
                    {notifications.length > 0 && (
                        <span className="badge bg-primary rounded-pill">{unreadCount} nuevas</span>
                    )}
                </div>

                <div className="py-2">
                    {notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="bi bi-bell-slash fs-3 d-block mb-2 opacity-50"></i>
                            <span className="small">No tienes notificaciones</span>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div
                                key={notif.id}
                                className={`px-3 py-2 border-bottom cursor-pointer text-decoration-none d-block ${!notif.read ? 'bg-primary bg-opacity-10' : ''}`}
                                onClick={() => handleNotificationClick(notif)}
                                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                            >
                                <div className="d-flex w-100 justify-content-between mb-1">
                                    <strong className="text-dark small d-block text-truncate" style={{ maxWidth: '85%' }}>{notif.title}</strong>
                                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                        {new Date(notif.date).toLocaleDateString()}
                                    </small>
                                </div>
                                <p className="mb-0 text-muted small lh-sm" style={{ fontSize: '0.8rem' }}>
                                    {notif.body}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-2 border-top bg-light text-center">
                    <button className="btn btn-sm btn-outline-primary" onClick={handleTestPush}>
                        <i className="bi bi-bug me-1"></i> Probar Notificación
                    </button>
                </div>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationBell;
