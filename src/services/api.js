import axios from 'axios';

//const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://remesas-avf1-0.onrender.com/api';// || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (credentials) => {
  try {
    // --- CORRECCIÓN: LLAMADA REAL AL BACKEND ---
    const response = await apiClient.post('/auth/login', credentials);

    // Verifica si la respuesta del backend fue exitosa (status 2xx)
    // y si contiene los datos esperados (token y user)
    if (response.data && response.data.ok && response.data.token && response.data.user) {
        return response.data; // Devuelve la respuesta REAL del backend
    } else {
        // Si la respuesta no tiene el formato esperado, lanza un error
        throw new Error(response.data.error || 'Respuesta inesperada del servidor.');
    }

  } catch (error) {
    console.error('Error en loginUser:', error.response?.data || error);
    // Propaga el error para que el componente lo maneje
    throw { 
        ok: false, 
        error: error.response?.data?.error || 'Error de red o servidor al iniciar sesión.' 
    };
  }
};

// --- NUEVA FUNCIÓN DE REGISTRO REAL NO SIMULADA ---
export const registerUser = async (userData) => {
    try {
        const response = await apiClient.post('/auth/register', userData);
        if (response.data && response.data.ok) {
            return response.data;
        } else {
            throw new Error(response.data.error || 'Error en el registro');
        }
    } catch (error) {
         console.error('Error en registerUser:', error.response?.data || error);
        throw { 
            ok: false, 
            error: error.response?.data?.error || 'Error de red o servidor al registrar.' 
        };
    }
};

/**
 * Envía el token de verificación al backend para validar un email.
 * @param {string} token - El token de verificación de la URL.
 * @returns {Promise<object>}
 */
export const verifyEmailToken = async (token) => {
  try {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying email token:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene la lista de todos los usuarios (requiere token de admin).
 * @returns {Promise<object>}
 */
export const getUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Actualiza el rol de un usuario específico (requiere token de admin).
 * @param {string} userId - El ID del usuario a modificar.
 * @param {string} role - El nuevo rol ('user' o 'admin').
 * @returns {Promise<object>}
 */
export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

//------------------------------------------------------------------------------

export const getQuote = async (params) => {
  try {
    const response = await apiClient.get('/fx/quote', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching quote:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- obtener reglas de retiro ---
export const getWithdrawalRules = async (params) => {
  try {
    // Asegúrate de que la ruta NO tenga '/info'
    const response = await apiClient.get('/withdrawal-rules', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching withdrawal rules:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const createWithdrawal = async (payload) => {
  try {
    const response = await apiClient.post('/withdrawals', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating withdrawal:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Error en el servidor. Intente más tarde.');
  }
};

export const getTransactions = async (params) => {
  try {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getPrices = async () => {
  try {
    const response = await apiClient.get('/prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching prices:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Solicita la creación de una orden de pago al backend.
 * @param {object} orderData - Datos necesarios para la orden (amount, country, orderId).
 * @returns {Promise<object>} La respuesta del backend con la URL de pago de Vita.
 */
export const createPaymentOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/payment-orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene la configuración actual de la comisión (markup).
 * @returns {Promise<object>}
 */
export const getMarkup = async () => {
  try {
    const response = await apiClient.get('/admin/markup');
    return response.data;
  } catch (error) {
    console.error('Error fetching markup:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Actualiza la configuración de la comisión (markup).
 * @param {number} newMarkup - El nuevo porcentaje de comisión.
 * @returns {Promise<object>}
 */
export const updateMarkup = async (newMarkup) => {
  try {
    const response = await apiClient.put('/admin/markup', { markup: newMarkup });
    return response.data;
  } catch (error) {
    console.error('Error updating markup:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Obtiene la lista de comisiones específicas por par de divisas.
 * @returns {Promise<object>}
 */
export const getMarkupPairs = async () => {
  try {
    const response = await apiClient.get('/admin/markup/pairs');
    return response.data;
  } catch (error) {
    console.error('Error fetching markup pairs:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Añade o actualiza una comisión específica por par de divisas.
 * @param {object} pairData - { originCurrency, destCountry, percent }
 * @returns {Promise<object>}
 */
export const updateMarkupPair = async (pairData) => {
  try {
    const response = await apiClient.put('/admin/markup/pairs', pairData);
    return response.data;
  } catch (error) {
    console.error('Error updating markup pair:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};