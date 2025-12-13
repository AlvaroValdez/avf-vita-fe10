import axios from 'axios';

// URL del Backend en Render
const API_URL = import.meta.env.VITE_API_URL || 'https://remesas-avf1-0.onrender.com/api';

// 1. Instancia correcta de Axios (apiClient)
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTENTICACIÓN ---
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.ok) return response.data;
    throw new Error(response.data.message || 'Error en el login');
  } catch (error) {
    console.error('Error en loginUser:', error);
    throw { ok: false, error: error.response?.data?.message || 'Error al iniciar sesión.' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw { ok: false, error: error.response?.data?.message || 'Error al registrar.' };
  }
};

// ... (Mantén tus funciones de Auth/Password/KYC iguales, usando apiClient) ...

// --- FUNCIÓN CRÍTICA CORREGIDA ---
export const getPrices = async () => {
  try {
    console.log('📡 [API] Solicitando precios...');

    // 🔥 CORRECCIÓN CLAVE: Usamos 'apiClient', no 'api'
    const response = await apiClient.get('/prices');
    const rawData = response.data;

    console.log('📦 [API] Respuesta recibida:', rawData);

    // ESTRATEGIA DE NORMALIZACIÓN
    // 1. Si el Backend manda un Array directo (Moderno)
    if (Array.isArray(rawData)) {
      console.log('✅ [API] Formato Array detectado');
      return rawData;
    }

    // 2. Si el Backend manda { data: [...] } (Estándar API)
    if (rawData.data && Array.isArray(rawData.data)) {
      console.log('✅ [API] Formato Data.Array detectado');
      return rawData.data;
    }

    // 3. Si el Backend manda estructura Legacy (CLP -> withdrawal...)
    const legacyRoot = rawData.CLP || rawData.clp || rawData.USD || rawData.usd || rawData?.data?.CLP;

    if (legacyRoot) {
      console.log('✅ [API] Formato Legacy detectado');
      const withdrawalNode = legacyRoot.withdrawal || {};
      const pricesNode = withdrawalNode.prices || {};
      const attributesNode = pricesNode.attributes || {};

      const sellMap = attributesNode.sell || pricesNode.sell || withdrawalNode.sell || {};

      // Convertimos Mapa a Array [{ code: 'CO', rate: 0.042 }]
      const countriesArray = Object.entries(sellMap).map(([key, value]) => ({
        code: key.toUpperCase(),
        rate: Number(value)
      })).filter(item => item.code.length === 2);

      return countriesArray.sort((a, b) => a.code.localeCompare(b.code));
    }

    console.warn('⚠️ [API] Formato desconocido, devolviendo vacío');
    return [];

  } catch (error) {
    console.error("❌ [API] Error obteniendo precios:", error);
    return [];
  }
};

// --- RESTO DE FUNCIONES (Usando apiClient) ---

export const getWithdrawalRules = async (params) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/withdrawal-rules?${query}`);
};

export const createWithdrawal = async (payload) => {
  return apiClient.post('/withdrawals', payload);
};

// ... Asegúrate de que TODAS las funciones usen 'apiClient' ...

export default apiClient;