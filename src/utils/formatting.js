// src/utils/formatting.js

export const formatNumberForDisplay = (number) => {
  if (number === '' || number === null || number === undefined || isNaN(number)) return '';
  // Usa formato chileno (puntos para miles)
  return Math.round(number).toLocaleString('es-CL');
};

export const parseFormattedNumber = (formattedString) => {
  if (typeof formattedString !== 'string') return formattedString;
  // Elimina todo lo que no sea número
  const sanitizedString = formattedString.replace(/\D/g, '');
  return sanitizedString === '' ? 0 : parseInt(sanitizedString, 10);
};

export const formatRate = (rate) => {
  if (isNaN(rate) || rate === null) return '0';
  return rate.toFixed(4);
};