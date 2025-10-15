// Formatea un número con puntos de miles y sin decimales.
export const formatNumberForDisplay = (number) => {
  if (isNaN(number) || number === null) return '';
  return Math.round(number).toLocaleString('es-CL');
};

// Convierte un string formateado de vuelta a un número (ej: "50.000" -> 50000)
export const parseFormattedNumber = (formattedString) => {
  if (typeof formattedString !== 'string') return 0;
  const sanitizedString = formattedString.replace(/\D/g, '');
  return parseInt(sanitizedString, 10) || 0;
};

// Formatea una tasa de cambio con 4 decimales para mayor precisión.
export const formatRate = (rate) => {
  if (isNaN(rate) || rate === null) return '0';
  return rate.toFixed(4);
};

