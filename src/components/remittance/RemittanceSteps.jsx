import React, { useState } from 'react';
import { Spinner, Modal } from 'react-bootstrap';
import CardForm from './CardForm';
import StepBeneficiary from './StepBeneficiary';
import StepConfirm from './StepConfirm';
import KycForm from '../auth/KycForm';
import { getWithdrawalRules } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RemittanceSteps = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [beneficiaryFields, setBeneficiaryFields] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [pendingQuote, setPendingQuote] = useState(null);

  // --- ESTADO CLAVE ---
  const [isFromFavorite, setIsFromFavorite] = useState(false);

  const processQuoteAndAdvance = async (quotePayload) => {
    setFormData(prev => ({ ...prev, ...quotePayload }));
    setIsLoadingRules(true);
    try {
      const response = await getWithdrawalRules({ country: quotePayload.destCountry });
      if (response.ok) {
        const countryCode = quotePayload.destCountry.toLowerCase();
        setBeneficiaryFields(response.data.rules[countryCode]?.fields || []);
        setStep(2);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoadingRules(false); }
  };

  const handleQuoteSuccess = (quotePayload) => {
    if (user && !user.isProfileComplete) {
      setPendingQuote(quotePayload);
      setShowKycModal(true);
      return;
    }
    processQuoteAndAdvance(quotePayload);
  };

  const handleKycSuccess = () => {
    setShowKycModal(false);
    if (pendingQuote) { processQuoteAndAdvance(pendingQuote); setPendingQuote(null); }
  };

  // --- CAPTURA DE FAVORITO ---
  const handleBeneficiaryComplete = (beneficiaryData, isFav = false) => {
    setFormData(prev => ({ ...prev, beneficiary: beneficiaryData }));
    setIsFromFavorite(isFav); // Guardamos la bandera
    setStep(3);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const renderStep = () => {
    if (isLoadingRules) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    switch (step) {
      case 1: return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
      case 2: return <StepBeneficiary formData={formData} fields={beneficiaryFields} onBack={handleBack} onComplete={handleBeneficiaryComplete} />;
      case 3: return <StepConfirm formData={formData} fields={beneficiaryFields} onBack={handleBack} isFromFavorite={isFromFavorite} />;
      default: return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
    }
  };

  return (
    <div>
      {renderStep()}
      <Modal show={showKycModal} onHide={() => setShowKycModal(false)}><Modal.Body><KycForm onSuccess={handleKycSuccess} /></Modal.Body></Modal>
    </div>
  );
};

export default RemittanceSteps;