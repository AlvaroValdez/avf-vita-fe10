import React, { useState } from 'react';
import { Spinner, Modal } from 'react-bootstrap'; // 1. Importamos Modal
import CardForm from './CardForm';
import StepBeneficiary from './StepBeneficiary';
import StepConfirm from './StepConfirm';
import KycForm from '../auth/KycForm'; // 2. Importamos el formulario
import { getWithdrawalRules } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // 3. Importamos el contexto

const RemittanceSteps = () => {
  const { user } = useAuth(); // Accedemos al usuario
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [beneficiaryFields, setBeneficiaryFields] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // --- ESTADOS PARA EL BLOQUEO DE KYC ---
  const [showKycModal, setShowKycModal] = useState(false);
  const [pendingQuote, setPendingQuote] = useState(null); // Guarda la cotización mientras se hace el KYC
  const [isFromFavorite, setIsFromFavorite] = useState(false);

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
    // --- VALIDACIÓN DE KYC ---
    // Si el usuario no ha completado su perfil, mostramos el modal
    if (user && !user.isProfileComplete) {
      setPendingQuote(quotePayload); // Guardamos los datos para usarlos después
      setShowKycModal(true);
      return; // Detenemos el flujo aquí
    }

    // Si ya tiene KYC, procesamos normalmente
    processQuoteAndAdvance(quotePayload);
  };

  // Callback para cuando el KYC se completa exitosamente
  const handleKycSuccess = () => {
    setShowKycModal(false);
    if (pendingQuote) {
      // Retomamos el flujo automáticamente donde lo dejamos
      processQuoteAndAdvance(pendingQuote);
      setPendingQuote(null);
    }
  };

  const handleBeneficiaryComplete = (beneficiaryData, isFav = false) => {
    setFormData(prev => ({ ...prev, beneficiary: beneficiaryData }));
    setIsFromFavorite(isFav); // Guardamos la bandera
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    if (isLoadingRules) return <div className="text-center p-5"><Spinner animation="border" /><p className="mt-2">Cargando...</p></div>;

    switch (step) {
      case 1:
        return <CardForm onQuoteSuccess={(payload) => { /* tu lógica existente */ }} />; // Usa tu lógica actual aquí
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
          isFromFavorite={isFromFavorite} // <--- AQUÍ PASAMOS LA PROP
        />;
      default:
        return <CardForm onQuoteSuccess={handleQuoteSuccess} />;
    }
  };

  return (
    <div>
      {renderStep()}

      {/* --- MODAL DE KYC --- */}
      <Modal
        show={showKycModal}
        onHide={() => setShowKycModal(false)}
        backdrop="static" // Evita cerrar al hacer clic fuera
        keyboard={false}  // Evita cerrar con ESC
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5 text-primary">Falta un paso importante</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Reutilizamos el formulario que creamos */}
          <KycForm onSuccess={handleKycSuccess} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RemittanceSteps;