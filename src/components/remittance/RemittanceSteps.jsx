import React, { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import CardForm from './CardForm';
import StepBeneficiary from './StepBeneficiary';
import StepConfirm from './StepConfirm';
import { getWithdrawalRules } from '../../services/api';

const RemittanceSteps = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [beneficiaryFields, setBeneficiaryFields] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // --- FUNCIÓN CORREGIDA ---
  // Ahora recibe 'quotePayload' que incluye quoteData, destCountry y quoteTimestamp
  const handleQuoteSuccess = async (quotePayload) => {
    // Guarda TODOS los datos recibidos de CardForm en el estado principal
    setFormData(prev => ({ ...prev, ...quotePayload }));
    setIsLoadingRules(true);
    try {
      const response = await getWithdrawalRules({ country: quotePayload.destCountry });
      if (response.ok) {
        const countryCode = quotePayload.destCountry.toLowerCase();
        const fields = response.data.rules[countryCode]?.fields;
        if (fields) {
          setBeneficiaryFields(fields);
          setStep(2);
        } else {
          throw new Error(`No se encontraron campos para el país ${countryCode}`);
        }
      } else {
        throw new Error("La respuesta para las reglas no fue exitosa.");
      }
    } catch (error) {
      console.error("Fallo al obtener las reglas:", error);
      alert("No se pudieron cargar los requisitos para el país.");
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
      return (
        <div className="text-center p-5">
          <Spinner animation="border" />
          <p className="mt-2">Cargando requisitos del país...</p>
        </div>
      );
    }

    switch (step) {
      case 1:
        return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
      case 2:
        return <StepBeneficiary 
                  formData={formData} 
                  fields={beneficiaryFields} 
                  onBack={handleBack} 
                  onComplete={handleBeneficiaryComplete} 
               />;
      case 3:
        // El objeto 'formData' ahora sí contiene 'quoteTimestamp'
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