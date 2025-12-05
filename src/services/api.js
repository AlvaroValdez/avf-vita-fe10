import axios from 'axios';

const API_URL = 'https://remesas-avf1-0.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AUTENTICACIÓN ---
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.ok) return response.data;
    throw new Error(response.data.message || 'Error en el login');
  } catch (error) {
    console.error('Error en loginUser:', error.response?.data || error.message);
    throw { ok: false, error: error.response?.data?.message || error.response?.data?.error || 'Error al iniciar sesión.' };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw { ok: false, error: error.response?.data?.message || error.response?.data?.error || 'Error al registrar.' };
  }
};

export const verifyEmailToken = async (token) => {
  try {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgotpassword', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// --- PERFIL Y KYC ---
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const uploadKycDocuments = async (formData) => {
  try {
    const response = await apiClient.post('/auth/kyc-documents', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const uploadAvatar = async (formData) => {
  try {
    const response = await apiClient.post('/auth/avatar', formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// --- ADMIN KYC ---
export const getPendingKycUsers = async () => {
  try {
    const response = await apiClient.get('/admin/kyc/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const reviewKycUser = async (userId, action, reason = '') => {
  try {
    const response = await apiClient.put(`/admin/kyc/${userId}/review`, { action, reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// --- REMESAS Y REGLAS ---
export const getPrices = async () => {
  try {
    const response = await apiClient.get('/prices');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getQuote = async (params) => {
  try {
    const response = await apiClient.get('/fx/quote', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTransactionRules = async (country = 'CL') => {
  try {
    const response = await apiClient.get(`/transaction-rules?country=${country}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTransactionRules = async (rulesData) => {
  try {
    const response = await apiClient.put('/transaction-rules', rulesData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAvailableOrigins = async () => {
  try {
    const response = await apiClient.get('/transaction-rules/available');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getEnabledOrigins = async () => {
  try {
    const response = await apiClient.get('/transaction-rules/enabled');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWithdrawalRules = async (params) => {
  try {
    const response = await apiClient.get('/withdrawal-rules', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const uploadImage = async (formData) => {
  try {
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': undefined }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// --- TRANSACCIONES Y PAGOS ---
export const createWithdrawal = async (payload) => {
  try {
    const response = await apiClient.post('/withdrawals', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createPaymentOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/payment-orders', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createDirectPaymentOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/payment-orders/direct', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPaymentMethods = async (country) => {
  try {
    const response = await apiClient.get(`/payment-orders/methods/${country}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTransactions = async (params) => {
  try {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// --- BENEFICIARIOS ---
export const getBeneficiaries = async () => {
  try {
    const response = await apiClient.get('/beneficiaries');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveBeneficiary = async (data) => {
  try {
    const response = await apiClient.post('/beneficiaries', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBeneficiary = async (id, data) => {
  try {
    const response = await apiClient.put(`/beneficiaries/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteBeneficiary = async (id) => {
  try {
    const response = await apiClient.delete(`/beneficiaries/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// --- ADMIN MARKUP/USUARIOS ---
export const getMarkup = async () => {
  try {
    const response = await apiClient.get('/admin/markup');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMarkup = async (newMarkup) => {
  try {
    const response = await apiClient.put('/admin/markup', { markup: newMarkup });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMarkupPairs = async () => {
  try {
    const response = await apiClient.get('/admin/markup/pairs');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMarkupPair = async (pairData) => {
  try {
    const response = await apiClient.put('/admin/markup/pairs', pairData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminUpdateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};