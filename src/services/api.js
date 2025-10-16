import axios from 'axios';

//const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://remesas-avf1-0.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- NEW LOGIN FUNCTION ---
export const loginUser = async (credentials) => {
  try {
    // In the future, this will be the real API call:
    // const response = await apiClient.post('/auth/login', credentials);
    // return response.data;

    // --- TEMPORARY SIMULATION ---
    console.log("Simulating login with:", credentials);
    if (credentials.email && credentials.password) {
      // Simulate a successful response from the backend
      return Promise.resolve({
        ok: true,
        token: 'fake-jwt-token-for-testing-purposes',
        user: { name: 'Test User', email: credentials.email }
      });
    } else {
      // Simulate a failed response
      return Promise.reject({ ok: false, error: 'Invalid credentials' });
    }
    // --- END SIMULATION ---
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || error;
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