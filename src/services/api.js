import axios from 'axios';

//const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://remesas-avf1-0.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (credentials) => {
  try {
    // Llama al endpoint real del backend (que es un placeholder)
    const response = await apiClient.post('/auth/login', credentials);
    
    // --- SIMULACIÓN DE RESPUESTA DEL BACKEND ---
    // En un backend real, la respuesta vendría de response.data
    // Aquí simulamos una respuesta exitosa si las credenciales no están vacías
    if (credentials.email && credentials.password) {
        return {
            ok: true,
            token: 'fake-jwt-token-from-placeholder',
            user: { name: 'Usuario Placeholder', email: credentials.email, role: 'admin' } // Simulamos admin
        };
    } else {
         throw new Error("Credenciales inválidas (simulado)");
    }
    // --- FIN SIMULACIÓN ---
    
  } catch (error) {
    console.error('Error en loginUser:', error.response?.data || error);
    throw { 
        ok: false, 
        error: error.response?.data?.message || error.message || 'Error al iniciar sesión.' 
    };
  }
};

// --- NUEVA FUNCIÓN DE REGISTRO ---
export const registerUser = async (userData) => {
    try {
        // Llama al endpoint real del backend (que es un placeholder)
        const response = await apiClient.post('/auth/register', userData);

        // --- SIMULACIÓN DE RESPUESTA DEL BACKEND ---
        console.log("Simulando registro con:", userData);
         if (userData.email && userData.password && userData.name) {
            return {
                ok: true,
                message: "Registro exitoso (simulado)"
            };
        } else {
             throw new Error("Datos de registro incompletos (simulado)");
        }
        // --- FIN SIMULACIÓN ---

    } catch (error) {
        console.error('Error en registerUser:', error.response?.data || error);
        throw { 
            ok: false, 
            error: error.response?.data?.message || error.message || 'Error al registrar usuario.' 
        };
    }
};

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