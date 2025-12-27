// frontend/src/services/api.js
import axios from 'axios';

// ✅ UNA sola fuente de verdad para el baseURL
// Debe incluir /api al final (como tu backend en Render)
const API_URL = import.meta.env.VITE_API_URL || 'https://remesas-avf1-0.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // ✅ Evita caching raro en algunos navegadores/proxies
  // (igual el BE debería mandar no-store, pero acá sumamos)
  transitional: { clarifyTimeoutError: true },
});

// ✅ Interceptor para agregar token si existe
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Evitar 304 por cache en GET
  config.headers['Cache-Control'] = 'no-cache';
  config.headers['Pragma'] = 'no-cache';
  return config;
});

// ✅ Normalizador de errores (para que el FE no reviente con shapes distintos)
function normalizeAxiosError(error, defaultMsg = 'Error inesperado.') {
  const status = error?.response?.status;
  const data = error?.response?.data;

  return {
    ok: false,
    status,
    error:
      data?.message ||
      data?.error ||
      (typeof data === 'string' && data) ||
      error?.message ||
      defaultMsg,
    details: data,
  };
}

// --- AUTENTICACIÓN ---
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // { ok, ... }
  } catch (error) {
    console.error('Error en loginUser:', error?.response?.data || error.message);
    throw normalizeAxiosError(error, 'Error al iniciar sesión.');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error al registrar.');
  }
};

export const verifyEmailToken = async (token) => {
  try {
    const response = await apiClient.get(`/auth/verify-email`, { params: { token } });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error verificando email.');
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgotpassword', { email });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error solicitando reset de contraseña.');
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error reseteando contraseña.');
  }
};

// --- PERFIL Y KYC ---
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error actualizando perfil.');
  }
};

export const uploadKycDocuments = async (formData) => {
  try {
    const response = await apiClient.post('/auth/kyc-documents', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error subiendo documentos KYC.');
  }
};

export const uploadAvatar = async (formData) => {
  try {
    const response = await apiClient.post('/auth/avatar', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error subiendo avatar.');
  }
};

// --- ADMIN KYC ---
export const getPendingKycUsers = async () => {
  try {
    const response = await apiClient.get('/admin/kyc/pending');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo KYC pendientes.');
  }
};

export const reviewKycUser = async (userId, action, reason = '') => {
  try {
    const response = await apiClient.put(`/admin/kyc/${userId}/review`, { action, reason });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error revisando KYC.');
  }
};

// --- REMESAS Y REGLAS ---

export const getPrices = async () => {
  try {
    const response = await apiClient.get('/prices');
    const rawData = response.data;

    console.log('📦 [API] Raw Prices:', rawData);

    // 1) Array directo
    if (Array.isArray(rawData)) return rawData;
    if (rawData?.data && Array.isArray(rawData.data)) return rawData.data;

    // 2) Estructura legacy (tu backend a veces devuelve mapas anidados)
    const legacyRoot = rawData?.CLP || rawData?.clp || rawData?.USD || rawData?.usd || rawData?.data?.CLP;

    if (legacyRoot) {
      const withdrawalNode = legacyRoot.withdrawal || {};
      const pricesNode = withdrawalNode.prices || {};
      const attributesNode = pricesNode.attributes || {};

      const sellMap = attributesNode.sell || pricesNode.sell || withdrawalNode.sell || {};

      const countriesArray = Object.entries(sellMap)
        .map(([key, value]) => ({ code: String(key).toUpperCase(), rate: Number(value) }))
        .filter(item => item.code.length === 2);

      return countriesArray.sort((a, b) => a.code.localeCompare(b.code));
    }

    console.warn('⚠️ [API] Formato desconocido, devolviendo vacío');
    return [];
  } catch (error) {
    console.error("❌ [API] Error fetching prices:", error?.response?.data || error.message);
    return [];
  }
};

export const getQuote = async (params) => {
  try {
    const response = await apiClient.get('/fx/quote', { params });
    const raw = response.data; // { ok: true, data: { ... } }

    console.log('💰 [API] Raw del Backend:', raw);

    if (raw?.ok && raw?.data) {
      const backendData = raw.data;
      return {
        ok: true,
        data: {
          amountIn: backendData.amount,
          amountOut: backendData.receiveAmount,
          rateWithMarkup: backendData.rate,
          origin: backendData.originCurrency,
          destCurrency: backendData.destCurrency,
          ...backendData,
        }
      };
    }

    return raw;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo cotización.');
  }
};

// 🆕 Obtener comisiones de pay-in (Webpay)
export const getPayinFees = async (country, amount) => {
  try {
    const response = await apiClient.get('/fx/payin-fees', {
      params: { country, amount }
    });
    return response.data; // { ok: true, data: { ... } }
  } catch (error) {
    console.warn('⚠️ [API] No se pudieron obtener comisiones payin:', error?.response?.data || error.message);
    // No throw, solo retornar null para no romper el flujo
    return { ok: false, data: null };
  }
};

export const getTransactionRules = async (country = 'CL') => {
  try {
    const response = await apiClient.get('/transaction-rules', { params: { country } });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo reglas de transacción.');
  }
};

export const updateTransactionRules = async (rulesData) => {
  try {
    const response = await apiClient.put('/transaction-rules', rulesData);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error actualizando reglas.');
  }
};

export const getAvailableOrigins = async () => {
  try {
    const response = await apiClient.get('/transaction-rules/available');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo origins disponibles.');
  }
};

export const getEnabledOrigins = async () => {
  try {
    const response = await apiClient.get('/transaction-rules/enabled');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo origins habilitados.');
  }
};

export const getWithdrawalRules = async (params) => {
  try {
    const response = await apiClient.get('/withdrawal-rules', { params });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo withdrawal rules.');
  }
};

export const uploadImage = async (formData) => {
  try {
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': undefined }
    });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error subiendo imagen.');
  }
};

// --- TRANSACCIONES Y PAGOS ---

// ✅ FIX: antes usabas fetch + res.json() => rompe con 304/empty.
// Ahora todo es axios => consistente
export const createWithdrawal = async (body) => {
  try {
    const response = await apiClient.post('/withdrawals', body);
    return response.data; // { ok, data, ... }
  } catch (error) {
    throw normalizeAxiosError(error, 'Error creando withdrawal.');
  }
};

// Payment Order (redirect)
export const createPaymentOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/payment-orders', orderData);
    return response.data; // { ok, checkoutUrl, raw }
  } catch (error) {
    throw normalizeAxiosError(error, 'Error creando payment order.');
  }
};

// ✅ Direct Payment alineado con backend actualizado
// POST /api/direct-pay/:paymentOrderId
// Requiere: method_id y payment_data según PROMTBusinessAPI.txt
export const createDirectPaymentOrder = async ({ vitaOrderId, payment_data, method_id }) => {
  try {
    // Validar que method_id esté presente (requerido por backend)
    if (!method_id) {
      throw new Error('method_id es requerido para DirectPay');
    }

    const payload = { method_id, payment_data };

    // ✅ CORREGIDO: Endpoint actualizado a /direct-pay/:id
    const response = await apiClient.post(`/direct-pay/${vitaOrderId}`, payload);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error ejecutando pago directo.');
  }
};

export const getPaymentMethods = async (country) => {
  try {
    const response = await apiClient.get(`/payment-orders/methods/${country}`);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo métodos de pago.');
  }
};

export const getTransactions = async (params) => {
  try {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo transacciones.');
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo transacción.');
  }
};

// --- BENEFICIARIOS ---
export const getBeneficiaries = async () => {
  try {
    const response = await apiClient.get('/beneficiaries');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo beneficiarios.');
  }
};

export const saveBeneficiary = async (data) => {
  try {
    const response = await apiClient.post('/beneficiaries', data);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error guardando beneficiario.');
  }
};

export const updateBeneficiary = async (id, data) => {
  try {
    const response = await apiClient.put(`/beneficiaries/${id}`, data);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error actualizando beneficiario.');
  }
};

export const deleteBeneficiary = async (id) => {
  try {
    const response = await apiClient.delete(`/beneficiaries/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error eliminando beneficiario.');
  }
};

// --- ADMIN MARKUP/USUARIOS ---
export const getMarkup = async () => {
  try {
    const response = await apiClient.get('/admin/markup');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo markup.');
  }
};

export const updateMarkup = async (newMarkup) => {
  try {
    const response = await apiClient.put('/admin/markup', { markup: newMarkup });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error actualizando markup.');
  }
};

export const getMarkupPairs = async () => {
  try {
    const response = await apiClient.get('/admin/markup/pairs');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo markup pairs.');
  }
};

export const updateMarkupPair = async (pairData) => {
  try {
    const response = await apiClient.put('/admin/markup/pairs', pairData);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error actualizando markup pair.');
  }
};

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error obteniendo usuarios.');
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error actualizando rol.');
  }
};

export const adminUpdateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error admin actualizando usuario.');
  }
};

// --- ADMIN TREASURY ---
export const approveDeposit = async (transactionId) => {
  try {
    const response = await apiClient.put(`/admin/treasury/${transactionId}/approve-deposit`);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Error aprobando depósito.');
  }
};

export default apiClient;
