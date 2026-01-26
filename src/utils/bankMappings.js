// Mapeos de códigos bancarios y tipos de cuenta para mostrar nombres legibles

// Bancos de Colombia (códigos numéricos de Vita -> nombres)
export const COLOMBIA_BANKS = {
    '1007': 'Bancolombia',
    '1001': 'Banco de Bogotá',
    '1002': 'Banco Popular',
    '1006': 'Banco Itaú',
    '1009': 'Citibank',
    '1012': 'Banco GNB Sudameris',
    '1013': 'BBVA Colombia',
    '1014': 'Banco de Occidente',
    '1019': 'Scotiabank Colpatria',
    '1023': 'Banco de las Microfinanzas Bancamía',
    '1040': 'Banco Agrario',
    '1051': 'Banco Davivienda',
    '1052': 'Banco AV Villas',
    '1053': 'Banco WWB S.A.',
    '1058': 'Banco Procredit',
    '1059': 'Bancoomeva',
    '1060': 'Banco Pichincha',
    '1061': 'Bancoldex',
    '1062': 'Banco Falabella',
    '1063': 'Banco Finandina',
    '1066': 'Banco Cooperativo Coopcentral',
    '1067': 'Banco Compartir',
    '1069': 'Banco Serfinanza',
    '1283': 'CFA Cooperativa Financiera',
    '1289': 'Cotrafa Cooperativa Financiera',
    '1370': 'COLTEFINANCIERA S.A.',
    '1507': 'Nequi',
    '1551': 'Daviplata',
    '1801': 'Movii',
    '891': 'Bancolombia', // Código alternativo
};

// Tipos de cuenta (códigos cortos -> nombres completos)
export const ACCOUNT_TYPES = {
    'S': 'Cuenta de Ahorros',
    'C': 'Cuenta Corriente',
    'savings': 'Cuenta de Ahorros',
    'checking': 'Cuenta Corriente',
    'current': 'Cuenta Corriente',
    'ahorros': 'Cuenta de Ahorros',
    'corriente': 'Cuenta Corriente',
    'SAVINGS': 'Cuenta de Ahorros',
    'CHECKING': 'Cuenta Corriente',
    'CURRENT': 'Cuenta Corriente',
};

/**
 * Obtiene el nombre completo del banco dado un código
 * @param {string|number} bankCode - Código del banco
 * @param {string} country - País (para seleccionar el mapa correcto)
 * @returns {string} Nombre del banco o el código original si no se encuentra
 */
export const getBankName = (bankCode, country = 'CO') => {
    if (!bankCode) return null;

    const code = String(bankCode);

    // Por ahora solo Colombia, pero se puede expandir
    if (country === 'CO' || country === 'Colombia') {
        return COLOMBIA_BANKS[code] || code;
    }

    return code;
};

/**
 * Obtiene el nombre completo del tipo de cuenta
 * @param {string} accountType - Código del tipo de cuenta
 * @returns {string} Nombre completo o el código original
 */
export const getAccountTypeName = (accountType) => {
    if (!accountType) return null;

    const type = String(accountType).trim();
    return ACCOUNT_TYPES[type] || type;
};
