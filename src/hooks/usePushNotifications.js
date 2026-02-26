// src/hooks/usePushNotifications.js
import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '../config/firebase';
import { registerFcmToken, deleteFcmToken } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

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
    const { addNotification } = useNotifications();
    const { token: authToken } = useAuth(); // Dependencia clave

    useEffect(() => {
        // Solo proceder si hay un usuario logueado
        if (!authToken) return;

        // Evitar registrar múltiples veces en la misma sesión activa
        if (registered.current) return;

        const setup = async () => {
            try {
                // 1. Verificar soporte del navegador
                if (!('Notification' in window)) {
                    toast.error('[Debug Push] Navegador no soporta notificaciones');
                    return;
                }

                // 2. Pedir permiso
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    toast.error('[Debug Push] Permiso de notificaciones DENEGADO por el usuario/navegador');
                    return;
                }

                // 3. Registrar Service Worker
                if (!('serviceWorker' in navigator)) {
                    toast.error('[Debug Push] Navegador no soporta serviceWorker');
                    return;
                }

                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('[Push] Service Worker registrado');

                // 4. Obtener mensajería
                const messaging = await getFirebaseMessaging();
                if (!messaging) {
                    toast.error('[Debug Push] Firebase Messaging no soportado (messaging = null)');
                    return;
                }

                // 5. Obtener token FCM
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (!token) {
                    toast.error('[Debug Push] No se pudo obtener el FCM token de los servidores de Google');
                    return;
                }

                // 6. Guardar token en el localStorage para comparar
                const prevToken = localStorage.getItem('fcmToken');
                if (token !== prevToken) {
                    // 7. Registrar en backend
                    const response = await registerFcmToken(token);
                    if (response?.ok) {
                        localStorage.setItem('fcmToken', token);
                        console.log('[Push] ✅ Token FCM registrado en backend');
                        registered.current = true; // Solo marcamos como registrado si tuvo éxito
                        toast.success('[Debug Push] ✅ Token FCM guardado en tu Base de Datos Backend con éxito!');
                    } else {
                        toast.error('[Debug Push] ❌ Backend falló al intentar guardar tu Token FCM');
                    }
                } else {
                    // Si el token es el mismo del localStorage, igual intentamos registrarlo
                    // por si la sesión anterior cerró mal o el backend lo borró
                    const response = await registerFcmToken(token);
                    if (response?.ok) {
                        console.log('[Push] ✅ Token FCM re-registrado en backend');
                        registered.current = true;
                        toast.success('[Debug Push] ✅ Token FCM RE-guardado en tu BD Backend con éxito!');
                    } else {
                        toast.error('[Debug Push] ❌ Backend falló al intentar re-guardar tu Token FCM');
                    }
                }

                // 8. Escuchar mensajes en FOREGROUND (Solo registrar el listener una vez)
                if (!window._fcmListenerRegistered) {
                    onMessage(messaging, (payload) => {
                        console.log('[Push] Mensaje en foreground:', payload);
                        const { title, body } = payload.notification || {};
                        const data = payload.data || {};

                        // Agregar al Contexto (Campana)
                        addNotification({ title, body, type: data.type, link: data.link });

                        // Mostrar popup (Toaster in-app)
                        toast(title || 'Notificación', {
                            description: body,
                            icon: '🔔',
                            duration: 5000,
                        });

                        // Mostrar notificación nativa opcionalmente
                        if (Notification.permission === 'granted') {
                            new Notification(title || 'Alyto', {
                                body,
                                icon: '/logo192.png',
                                tag: data.type || 'default'
                            });
                        }
                    });
                    window._fcmListenerRegistered = true;
                }

            } catch (err) {
                // No loguear errores críticos — push es no-crítico
                console.warn('[Push] Error en setup:', err.message);
                toast.error(`[Debug Push] Excepción Fatal en Setup: ${err.message}`);
            }
        };

        setup();
    }, [authToken]); // Ejecutar cuando el token de sesión cambie (ej: Login)
};

/**
 * Eliminar token FCM al hacer logout
 */
export const clearPushToken = async () => {
    try {
        await deleteFcmToken();
        localStorage.removeItem('fcmToken');
        console.log('[Push] Token FCM eliminado');
        // Reset local variables para el próximo login
        window._fcmListenerRegistered = false;
    } catch (err) {
        console.warn('[Push] Error eliminando token:', err.message);
    }
};
