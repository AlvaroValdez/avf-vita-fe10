import React, { useState } from 'react';
import { Spinner, Modal, Alert, Button } from 'react-bootstrap';
import CardForm from './CardForm';
import StepBeneficiary from './StepBeneficiary';
import StepConfirm from './StepConfirm';
import KycForm from '../auth/KycForm';
import { getWithdrawalRules } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Mensajes por estado de KYC
const KYC_MESSAGES = {
  unverified: {
    title: '⚠️ Verificación requerida',
    body: 'Para enviar dinero necesitas verificar tu identidad. Completa el formulario a continuación.',
    showForm: true,
  },
  pending: {
    title: '⏳ Verificación en revisión',
    body: 'Recibimos tus documentos y los estamos revisando. Te notificaremos por email cuando esté aprobado.',
    showForm: false,
  },
  review: {
    title: '🔍 Revisión adicional en curso',
    body: 'Nuestro equipo está revisando tu documentación. Te contactaremos pronto.',
    showForm: false,
  },
  rejected: {
    title: '❌ Verificación rechazada',
    body: 'Tu verificación no pudo ser aprobada. Contacta a soporte para más información.',
    showForm: false,
  },
};

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
    // ⭐ GATE: verificar KYC aprobado antes de avanzar al beneficiario
    const kycStatus = user?.kyc?.status;
    if (kycStatus !== 'approved') {
      // Si no tiene perfil completo, necesita completar datos (muestra KycForm)
      // Si ya subió docs y está pendiente/rechazado, mostramos mensaje informativo
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
        console.log('🔍 [RemittanceSteps] formData:', formData);
        console.log('🔍 [RemittanceSteps] keys:', Object.keys(formData));
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

  const kycStatus = user?.kyc?.status;
  const kycInfo = KYC_MESSAGES[kycStatus];

  return (
    <div>
      {renderStep()}
      <Modal show={showKycModal} onHide={() => setShowKycModal(false)} backdrop="static" keyboard={false} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 text-primary">
            {kycInfo?.title || '⚠️ Verificación requerida'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {kycInfo?.showForm !== false ? (
            // Estado unverified → mostrar formulario de carga de documentos
            <KycForm onSuccess={handleKycSuccess} />
          ) : (
            // Estado pending/review/rejected → mensaje informativo, sin formulario
            <>
              <Alert variant={kycStatus === 'rejected' ? 'danger' : 'warning'} className="mb-3">
                {kycInfo.body}
              </Alert>
              {kycStatus === 'rejected' && (
                <p className="small text-muted">
                  Motivo: {user?.kyc?.rejectionReason || 'Contacta a soporte@alyto.com'}
                </p>
              )}
              <div className="text-center">
                <Button variant="secondary" onClick={() => setShowKycModal(false)}>Cerrar</Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RemittanceSteps;