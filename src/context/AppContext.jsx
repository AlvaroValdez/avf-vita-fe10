import React, { createContext, useState, useEffect, useContext } from 'react';
import { getPrices } from '../services/api';
import { getCountryName, blacklistedCodes } from '../utils/countries'; // 1. Importamos la lista negra

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  //... dentro de AppProvider en src/context/AppContext.jsx

  useEffect(() => {
    let isMounted = true; // 1. Creamos una bandera para saber si el componente está "montado"

    const loadInitialData = async () => {
      try {
        const pricesResponse = await getPrices();

        // 2. Solo actualizamos el estado si el componente sigue montado
        if (isMounted && pricesResponse.ok && pricesResponse.data) {
          const rawData = pricesResponse.data;

          // 1. Intento: Estructura Anidada (Consumer / Legacy)
          // Buscamos dinámicamente el nodo raíz (CLP, USD, etc)
          const nestedRootKey = Object.keys(rawData).find(key =>
            rawData[key]?.withdrawal?.prices?.attributes
          );

          let countryCodesObject = null;

          if (nestedRootKey) {
            const attributes = rawData[nestedRootKey].withdrawal.prices.attributes;
            const sellKey = Object.keys(attributes).find(k => k.endsWith('_sell'));
            if (sellKey && attributes[sellKey]) {
              countryCodesObject = attributes[sellKey];
            }
          }

          // 2. Intento: Estructura Plana (Business API / Raw)
          // Buscamos keys tipo 'usd_sell', 'clp_sell' directamente en la raiz
          if (!countryCodesObject) {
            const flatSellKey = Object.keys(rawData).find(k => k.endsWith('_sell') && typeof rawData[k] === 'object');
            if (flatSellKey) {
              countryCodesObject = rawData[flatSellKey];
            }
          }

          // 3. Procesar y setear si encontramos algo
          if (countryCodesObject) {
            const countryList = Object.keys(countryCodesObject)
              .filter(code => !blacklistedCodes.includes(code.toUpperCase()))
              .map(code => ({
                code: code.toUpperCase(),
                name: getCountryName(code),
              }));

            // Ordenar
            countryList.sort((a, b) => a.name.localeCompare(b.name));
            setCountries(countryList);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading initial app data:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    // 3. RETORNAMOS UNA FUNCIÓN DE LIMPIEZA
    // Esta función se ejecuta cuando el componente se "desmonta"
    return () => {
      isMounted = false; // Cambiamos la bandera a falso
    };
  }, []); // El array vacío sigue siendo correcto

  return (
    <AppContext.Provider value={{ countries, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppContext);
};