import React, { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import CardForm from './CardForm';
import StepBeneficiary from './StepBeneficiary';
import StepConfirm from './StepConfirm';
import { getWithdrawalRules } from '../../services/api';

const RemittanceSteps = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  // ESTE ESTADO AHORA GUARDARÁ EL ARRAY DE CAMPOS DIRECTAMENTE
  const [beneficiaryFields, setBeneficiaryFields] = useState([]); 
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  const handleQuoteSuccess = async (quotePayload) => {
    setFormData(prev => ({ ...prev, ...quotePayload }));
    setIsLoadingRules(true);
    try {
      const response = await getWithdrawalRules({ country: quotePayload.destCountry });
      
      if (response.ok) {
        const countryCode = quotePayload.destCountry.toLowerCase();
        // NAVEGAMOS LA ESTRUCTURA COMPLEJA Y EXTRAEMOS SOLO EL ARRAY 'fields'
        const fields = response.data.rules[countryCode].fields;
        
        if (fields) {
          setBeneficiaryFields(fields); // Guardamos el array de campos
          setStep(2); // Avanzamos al siguiente paso
        } else {
          throw new Error(`No se encontraron 'fields' para el país ${countryCode}`);
        }
      } else {
        throw new Error("La respuesta de la API para las reglas no fue exitosa.");
      }
    } catch (error) {
      console.error("Fallo al obtener u procesar withdrawal rules:", error);
      alert("No se pudieron cargar los requisitos para el país de destino.");
    } finally {
      setIsLoadingRules(false);
    }
  };
  
  const handleBeneficiaryComplete = (beneficiaryData) => {
    setFormData(prev => ({ ...prev, beneficiary: beneficiaryData }));
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    if (isLoadingRules) {
        // ... (código del spinner sin cambios)
    }

    switch (step) {
      case 1:
        return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
      case 2:
        // AHORA LE PASAMOS EL ARRAY 'fields' DIRECTAMENTE
        return <StepBeneficiary 
                  formData={formData} 
                  fields={beneficiaryFields} 
                  onBack={handleBack} 
                  onComplete={handleBeneficiaryComplete} 
               />;
      case 3:
        // El 'StepConfirm' también necesitará los fields para los labels
        return <StepConfirm 
                  formData={formData} 
                  fields={beneficiaryFields} 
                  onBack={handleBack} 
               />;
      default:
        return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
    }
  };

  return <div>{renderStep()}</div>;
};

export default RemittanceSteps;