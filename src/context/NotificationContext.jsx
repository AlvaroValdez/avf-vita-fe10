// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Cargar desde localStorage al inicio
    useEffect(() => {
        try {
            const saved = localStorage.getItem('alyto_notifications');
            if (saved) {
                const parsed = JSON.parse(saved);
                setNotifications(parsed);
                setUnreadCount(parsed.filter(n => !n.read).length);
            }
        } catch (e) {
            console.error('Error cargando notificaciones locales:', e);
        }
    }, []);

    // Guardar en localStorage cada vez que cambien
    useEffect(() => {
        localStorage.setItem('alyto_notifications', JSON.stringify(notifications));
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const addNotification = useCallback((notification) => {
        setNotifications(prev => {
            // Estructura: { id, title, body, date, type, read }
            const newNotif = {
                ...notification,
                id: notification.id || Date.now().toString() + Math.random().toString(36).substring(2, 9),
                date: new Date().toISOString(),
                read: false
            };
            // Mantener máximo 30 notificaciones
            const updated = [newNotif, ...prev].slice(0, 30);
            return updated;
        });
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
