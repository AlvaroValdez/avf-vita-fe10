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
        if (isMounted && pricesResponse) {

          let countryCodesObject = null;
          let rawArray = null;

          // ESTRATEGIA DE DETECCIÓN DE FORMATO

          // CASO A: Array Directo (Nuevo Estándar api.js)
          if (Array.isArray(pricesResponse)) {
            rawArray = pricesResponse;
          }
          // CASO B: Objeto con propiedad .data (Legacy Wrapper)
          else if (pricesResponse.data && Array.isArray(pricesResponse.data)) {
            rawArray = pricesResponse.data;
          }
          // CASO C: Objeto Legacy Anidado
          else {
            // Buscamos dinámicamente el nodo raíz (CLP, USD, etc)
            const nestedRootKey = Object.keys(pricesResponse).find(key =>
              pricesResponse[key]?.withdrawal?.prices?.attributes
            );

            if (nestedRootKey) {
              const attributes = pricesResponse[nestedRootKey].withdrawal.prices.attributes;
              const sellKey = Object.keys(attributes).find(k => k.endsWith('_sell'));
              if (sellKey && attributes[sellKey]) {
                countryCodesObject = attributes[sellKey];
              }
            } else {
              // Fallback: búsqueda plana de keys '_sell'
              const flatSellKey = Object.keys(pricesResponse).find(k => k.endsWith('_sell') && typeof pricesResponse[k] === 'object');
              if (flatSellKey) {
                countryCodesObject = pricesResponse[flatSellKey];
              }
            }
          }

          // CONSTRUCCIÓN DE LA LISTA FINAL
          let countryList = [];

          // Opción 1: Desde Array
          if (rawArray) {
            countryList = rawArray
              .filter(item => item.code && !blacklistedCodes.includes(item.code.toUpperCase()))
              .map(item => ({
                code: item.code.toUpperCase(),
                name: getCountryName(item.code),
              }));
          }
          // Opción 2: Desde Objeto (Legacy)
          else if (countryCodesObject) {
            countryList = Object.keys(countryCodesObject)
              .filter(code => !blacklistedCodes.includes(code.toUpperCase()))
              .map(code => ({
                code: code.toUpperCase(),
                name: getCountryName(code),
              }));
          }

          if (countryList.length > 0) {
            // Eliminar duplicados por código
            const uniqueCountries = [];
            const seen = new Set();
            for (const c of countryList) {
              if (!seen.has(c.code)) {
                seen.add(c.code);
                uniqueCountries.push(c);
              }
            }

            // Ordenar alfabéticamente
            uniqueCountries.sort((a, b) => a.name.localeCompare(b.name));
            setCountries(uniqueCountries);
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