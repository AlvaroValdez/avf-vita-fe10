// src/config/firebase.js
// Configuración de Firebase para el frontend
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar solo una vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// getMessaging solo en browsers que soportan FCM
let messaging = null;
export const getFirebaseMessaging = async () => {
    if (messaging) return messaging;
    const supported = await isSupported();
    if (supported) {
        messaging = getMessaging(app);
    }
    return messaging;
};

export default app;
