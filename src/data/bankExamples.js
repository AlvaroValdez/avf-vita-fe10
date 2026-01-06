/**
 * Ejemplos y Requisitos Bancarios por País
 * Se usa para guiar al usuario sobre qué datos necesitará del beneficiario.
 */
export const BANK_EXAMPLES = {
    AR: {
        countryName: 'Argentina',
        requirements: [
            'CBU (22 dígitos) o CVU',
            'CUIT/CUIL (11 dígitos, sin guiones)'
        ],
        example: {
            account: '0720000720000000000000',
            doc: '20123456789'
        }
    },
    BR: {
        countryName: 'Brasil',
        requirements: [
            'Clave PIX (Email, Teléfono, CPF o Aleatoria)',
            'CPF (11 dígitos)'
        ],
        example: {
            account: 'usuario@email.com',
            doc: '123.456.789-00'
        }
    },
    CO: {
        countryName: 'Colombia',
        requirements: [
            'Número de Cuenta',
            'Tipo de Cuenta (Ahorros/Corriente)',
            'Nombre del Banco'
        ],
        example: {
            account: '123-456789-00',
            doc: 'Cédula'
        }
    },
    CL: {
        countryName: 'Chile',
        requirements: [
            'Número de Cuenta',
            'Tipo de Cuenta (Vista/Corriente/RUT)',
            'RUT (con dígito verificador)'
        ],
        example: {
            account: '12345678',
            doc: '12.345.678-9'
        }
    },
    MX: {
        countryName: 'México',
        requirements: [
            'CLABE Interbancaria (18 dígitos)'
        ],
        example: {
            account: '012345678901234567',
            doc: 'CURP (Opcional)'
        }
    },
    PE: {
        countryName: 'Perú',
        requirements: [
            'CCI (Código de Cuenta Interbancario - 20 dígitos)'
        ],
        example: {
            account: '002-123-000000000000-00',
            doc: 'DNI'
        }
    },
    BO: {
        countryName: 'Bolivia',
        requirements: [
            'Número de Cuenta',
            'Nombre del Banco',
            'Carnet de Identidad'
        ],
        example: {
            account: '10000012345678',
            doc: '1234567 SC'
        }
    },
    EU: {
        countryName: 'Europa (SEPA)',
        requirements: [
            'IBAN (Código Internacional)'
        ],
        example: {
            account: 'ES12 3456 7890 1234 5678 9012',
            doc: ''
        }
    },
    US: {
        countryName: 'Estados Unidos',
        requirements: [
            'Routing Number (ACH - 9 dígitos)',
            'Account Number'
        ],
        example: {
            account: '123456789 (ABA)',
            doc: ''
        }
    }
};
