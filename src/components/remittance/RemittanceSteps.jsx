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

  // --- ESTADOS PARA EL BLOQUEO DE KYC ---
  const [showKycModal, setShowKycModal] = useState(false);
  const [pendingQuote, setPendingQuote] = useState(null);

  // --- ESTADO PARA SABER SI ES FAVORITO ---
  const [isFromFavorite, setIsFromFavorite] = useState(false);

  // Función para avanzar después de validar/completar KYC
  const processQuoteAndAdvance = async (quotePayload) => {
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

  const handleQuoteSuccess = (quotePayload) => {
    // Validamos si el usuario necesita completar KYC antes de seguir
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

  // Recibe la data del beneficiario y si vino de un favorito
  const handleBeneficiaryComplete = (beneficiaryData, isFav = false) => {
    setFormData(prev => ({ ...prev, beneficiary: beneficiaryData }));
    setIsFromFavorite(isFav);
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
        return <StepConfirm
          formData={formData}
          fields={beneficiaryFields}
          onBack={handleBack}
          isFromFavorite={isFromFavorite} // Pasamos la bandera al paso final
        />;
      default:
        return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
    }
  };

  return (
    <div>
      {renderStep()}

      {/* Modal de KYC Bloqueante */}
      <Modal
        show={showKycModal}
        onHide={() => setShowKycModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
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