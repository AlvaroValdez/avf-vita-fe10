import axios from 'axios';

// URL del backend en producción
const API_URL = 'https://remesas-avf1-0.onrender.com/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- FUNCIONES DE AUTENTICACIÓN ---

export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data.ok) {
        return response.data; 
    } else {
        throw new Error(response.data.message || 'Error en el login');
    }
  } catch (error) {
    console.error('Error en loginUser:', error.response?.data || error.message);
    throw { 
        ok: false, 
        error: error.response?.data?.message || error.message || 'Error al iniciar sesión.' 
    };
  }
};

export const registerUser = async (userData) => {
    try {
        const response = await apiClient.post('/auth/register', userData);
        return response.data; 
    } catch (error) {
        console.error('Error en registerUser:', error.response?.data || error.message);
        throw { 
            ok: false, 
            error: error.response?.data?.message || error.message || 'Error al registrar usuario.' 
        };
    }
};

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
 * Actualiza el perfil del usuario (KYC).
 * @param {object} profileData - Datos del perfil (nombre, documento, dirección, etc.)
 * @returns {Promise<object>} Respuesta con el usuario actualizado.
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Sube los documentos para el Nivel 2 de KYC.
 * @param {FormData} formData - Objeto FormData con las imágenes.
 * @returns {Promise<object>} Respuesta del backend.
 */
export const uploadKycDocuments = async (formData) => {
  try {
    const response = await apiClient.post('/auth/kyc-documents', formData, {
      headers: {
        // CORRECCIÓN CLAVE:
        // Establecemos Content-Type en undefined para sobrescribir el default 'application/json'.
        // Esto obliga al navegador a detectar que es un FormData y configurar 
        // correctamente 'multipart/form-data; boundary=...'
        'Content-Type': undefined, 
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading documents:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE REMESAS (Cotización y Reglas) ---

export const getPrices = async () => {
  try {
    const response = await apiClient.get('/prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching prices:', error.response?.data || error.message);
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

export const getWithdrawalRules = async (params) => {
  try {
    const response = await apiClient.get('/withdrawal-rules', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching withdrawal rules:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE ENVÍO Y PAGO ---

export const createWithdrawal = async (payload) => {
  try {
    const response = await apiClient.post('/withdrawals', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating withdrawal:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const createPaymentOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/payment-orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE TRANSACCIONES (Historial) ---

export const getTransactions = async (params) => {
  try {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction detail:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE BENEFICIARIOS (Favoritos) ---

export const getBeneficiaries = async () => {
  try {
    const response = await apiClient.get('/beneficiaries');
    return response.data;
  } catch (error) {
    console.error('Error fetching beneficiaries:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const saveBeneficiary = async (data) => {
  try {
    const response = await apiClient.post('/beneficiaries', data);
    return response.data;
  } catch (error) {
    console.error('Error saving beneficiary:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE ADMINISTRACIÓN ---

export const getMarkup = async () => {
  try {
    const response = await apiClient.get('/admin/markup');
    return response.data;
  } catch (error) {
    console.error('Error fetching markup:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateMarkup = async (newMarkup) => {
  try {
    const response = await apiClient.put('/admin/markup', { markup: newMarkup });
    return response.data;
  } catch (error) {
    console.error('Error updating markup:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getMarkupPairs = async () => {
  try {
    const response = await apiClient.get('/admin/markup/pairs');
    return response.data;
  } catch (error) {
    console.error('Error fetching markup pairs:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateMarkupPair = async (pairData) => {
  try {
    const response = await apiClient.put('/admin/markup/pairs', pairData);
    return response.data;
  } catch (error) {
    console.error('Error updating markup pair:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE ADMIN KYC (CUMPLIMIENTO) ---

export const getPendingKycUsers = async () => {
  try {
    const response = await apiClient.get('/admin/kyc/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending KYC:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const reviewKycUser = async (userId, action, reason = '') => {
  try {
    // action debe ser 'approve' o 'reject'
    const response = await apiClient.put(`/admin/kyc/${userId}/review`, { action, reason });
    return response.data;
  } catch (error) {
    console.error('Error reviewing KYC:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- RECUPERACIÓN DE CONTRASEÑA ---

/**
 * Solicita el correo de recuperación de contraseña.
 * @param {string} email - Correo del usuario.
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgotpassword', { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Restablece la contraseña usando el token recibido por correo.
 * @param {string} token - Token de la URL.
 * @param {string} password - Nueva contraseña.
 */
export const resetPassword = async (token, password) => {
  try {
    const response = await apiClient.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


// --- UPLOAD DE AVATAR DE USUARIO ---
export const uploadAvatar = async (formData) => {
  try {
    const response = await apiClient.post('/auth/avatar', formData, {
      headers: {
        // CORRECCIÓN: Eliminar el Content-Type JSON para permitir multipart/form-data
        'Content-Type': undefined, 
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// --- FUNCIONES DE REGLAS DE TRANSACCIÓN ---

export const getTransactionRules = async (country = 'CL') => {
  try {
    const response = await apiClient.get(`/transaction-rules?country=${country}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction rules:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const updateTransactionRules = async (rulesData) => {
  try {
    const response = await apiClient.put('/transaction-rules', rulesData);
    return response.data;
  } catch (error) {
    console.error('Error updating transaction rules:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};