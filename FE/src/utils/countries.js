// Este objeto mapea los códigos de país de la API a nombres legibles.
const countryNames = {
  // Países Latinoamericanos
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  DO: 'República Dominicana',
  EC: 'Ecuador',
  GT: 'Guatemala',
  HT: 'Haití',
  MX: 'México',
  PA: 'Panamá',
  PY: 'Paraguay',
  PE: 'Perú',
  SV: 'El Salvador',
  UY: 'Uruguay',
  VE: 'Venezuela',
  
  // Países de otras regiones
  US: 'Estados Unidos',
  ES: 'España',
  CN: 'China',
  GB: 'Reino Unido',
  AU: 'Australia',
  EU: 'Europa',
  PL: 'Polonia',
  
  // Agrega más según sea necesario
};

// Códigos que no son países y queremos ocultar del selector
export const blacklistedCodes = [
  'CNUSD', 'CAUSD', 'EUUSD', 'GBUSD', 'SWIFTUSD', 'USWIRES', 
  'GBEUR', 'HKUSD', 'PEUSD', 'USRTP', 'COCOP'
];

// Función que devuelve el nombre del país o el código si no se encuentra.
export const getCountryName = (code) => {
  return countryNames[code.toUpperCase()] || code.toUpperCase();
};