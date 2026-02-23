// src/hooks/usePushNotifications.js
import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../config/firebase';
import { registerFcmToken, deleteFcmToken } from '../services/api';

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

/**
 * Hook que:
 * 1. Pide permiso de notificaciones al usuario
 * 2. Obtiene el FCM token del dispositivo
 * 3. Lo registra en el backend
 * 4. Escucha mensajes cuando la app está en FOREGROUND
 */
export const usePushNotifications = () => {
    const registered = useRef(false);

    useEffect(() => {
        if (registered.current) return;
        registered.current = true;

        const setup = async () => {
            try {
                // 1. Verificar soporte del navegador
                if (!('Notification' in window)) {
                    console.log('[Push] Navegador no soporta notificaciones');
                    return;
                }

                // 2. Pedir permiso
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('[Push] Permiso de notificaciones denegado');
                    return;
                }

                // 3. Registrar Service Worker
                if (!('serviceWorker' in navigator)) return;

                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('[Push] Service Worker registrado');

                // 4. Obtener mensajería
                const messaging = await getFirebaseMessaging();
                if (!messaging) return;

                // 5. Obtener token FCM
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (!token) {
                    console.warn('[Push] No se pudo obtener el FCM token');
                    return;
                }

                // 6. Guardar token en el localStorage para comparar
                const prevToken = localStorage.getItem('fcmToken');
                if (token !== prevToken) {
                    // 7. Registrar en backend
                    await api.put('/auth/fcm-token', { token });
                    localStorage.setItem('fcmToken', token);
                    console.log('[Push] ✅ Token FCM registrado en backend');
                }

                // 8. Escuchar mensajes en FOREGROUND
                onMessage(messaging, (payload) => {
                    console.log('[Push] Mensaje en foreground:', payload);
                    const { title, body } = payload.notification || {};

                    // Mostrar notificación nativa del sistema aunque la app esté abierta
                    if (Notification.permission === 'granted') {
                        new Notification(title || 'Alyto', {
                            body,
                            icon: '/logo192.png',
                            tag: payload.data?.type || 'default'
                        });
                    }
                });

            } catch (err) {
                // No loguear errores críticos — push es no-crítico
                console.warn('[Push] Error en setup:', err.message);
            }
        };

        setup();
    }, []);
};

/**
 * Eliminar token FCM al hacer logout
 */
export const clearPushToken = async () => {
    try {
        await api.delete('/auth/fcm-token');
        localStorage.removeItem('fcmToken');
        console.log('[Push] Token FCM eliminado');
    } catch (err) {
        console.warn('[Push] Error eliminando token:', err.message);
    }
};
