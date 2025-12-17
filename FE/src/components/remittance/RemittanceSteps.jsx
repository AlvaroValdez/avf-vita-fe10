import React, { useState } from 'react';
import { Spinner, Modal } from 'react-bootstrap';
import CardForm from './CardForm';
import StepBeneficiary from './StepBeneficiary';
import StepConfirm from './StepConfirm';
import KycForm from '../auth/KycForm';
import { getWithdrawalRules } from '../../services/api'; // Importación crítica
import { useAuth } from '../../context/AuthContext';

const RemittanceSteps = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [beneficiaryFields, setBeneficiaryFields] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [pendingQuote, setPendingQuote] = useState(null);
  const [isFromFavorite, setIsFromFavorite] = useState(false);

  const processQuoteAndAdvance = async (quotePayload) => {
    setFormData(prev => ({ ...prev, ...quotePayload }));
    setIsLoadingRules(true);
    try {
      // Llamada a la API
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
      alert("No se pudieron cargar los requisitos para el país. Intenta de nuevo.");
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleQuoteSuccess = (quotePayload) => {
    // Validación de KYC antes de avanzar
    if (user && !user.isProfileComplete) {
      setPendingQuote(quotePayload);
      setShowKycModal(true);
      return;
    }
    processQuoteAndAdvance(quotePayload);
  };

  const handleKycSuccess = () => {
    setShowKycModal(false);
    if (pendingQuote) {
      processQuoteAndAdvance(pendingQuote);
      setPendingQuote(null);
    }
  };

  const handleBeneficiaryComplete = (beneficiaryData, isFav = false) => {
    setFormData(prev => ({ ...prev, beneficiary: beneficiaryData }));
    setIsFromFavorite(isFav);
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    if (isLoadingRules) {
      return <div className="text-center p-5"><Spinner animation="border" /><p className="mt-2">Cargando requisitos...</p></div>;
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
        return <StepConfirm
          formData={formData}
          fields={beneficiaryFields}
          onBack={handleBack}
          isFromFavorite={isFromFavorite}
        />;
      default:
        return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
    }
  };

  return (
    <div>
      {renderStep()}
      <Modal show={showKycModal} onHide={() => setShowKycModal(false)} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 text-primary">Falta un paso importante</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <KycForm onSuccess={handleKycSuccess} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RemittanceSteps;