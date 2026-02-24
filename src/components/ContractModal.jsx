import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ContractModal = ({ show, onHide, onAccept, country = 'BO' }) => {
    const isBolivia = country === 'BO';

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title className="h5 fw-bold text-primary">
                    {isBolivia ? 'Contrato de Mandato y Declaración de Fondos' : 'Términos y Condiciones de Uso'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }} className="small text-secondary px-4">
                {isBolivia ? (
                    <>
                        <div className="text-center mb-4">
                            <h6 className="fw-bold text-dark">CONTRATO DE MANDATO DE GESTIÓN DE RECURSOS Y DECLARACIÓN DE ORIGEN DE FONDOS</h6>
                            <p className="text-muted fst-italic">Declaración Jurada Digital (Compliance UIF/ASFI)</p>
                        </div>

                        <p><strong>CONSTE POR EL PRESENTE DOCUMENTO DIGITAL</strong>, al que las partes se adhieren mediante la aceptación electrónica (Click-wrap), el acuerdo suscrito entre:</p>

                        <p><strong>A) EL MANDANTE (EL USUARIO):</strong> Persona natural o jurídica identificada mediante sus credenciales de acceso y validación KYC en la plataforma.<br />
                            <strong>B) EL MANDATARIO (LA EMPRESA):</strong> <strong>Alyto</strong>, constituida legalmente en el Estado Plurinacional de Bolivia, en proceso de adecuación como Empresa de Tecnología Financiera (ETF) y Proveedor de Servicios de Activos Virtuales (PSAV).</p>

                        <hr className="my-3" />

                        <h6 className="fw-bold fs-5 mt-4">PRIMERA: OBJETO DEL MANDATO</h6>
                        <p className="text-justify">EL USUARIO otorga MANDATO DE GESTIÓN a Alyto para que, por su cuenta y orden, realice operaciones de compra, venta, intercambio y transferencia de Activos Virtuales (USDC/USDT/XLM) y moneda fiduciaria (Bolivianos/Dólares), utilizando la infraestructura tecnológica de la Billetera "Alyto". <strong>Los fondos gestionados son propiedad exclusiva de EL USUARIO.</strong></p>

                        <h6 className="fw-bold fs-5 mt-4">SEGUNDA: DECLARACIÓN DE ORIGEN DE FONDOS</h6>
                        <p className="text-justify">EL USUARIO declara bajo juramento que los fondos (fiat o cripto) introducidos en la plataforma provienen de actividades lícitas, comerciales, profesionales o de ahorros personales, y no tienen relación alguna con actividades ilícitas tipificadas en la Ley N° 004 o delitos financieros. <strong>EL USUARIO exime a Alyto de toda responsabilidad penal o civil por el origen de dichos fondos.</strong></p>

                        <h6 className="fw-bold fs-5 mt-4">TERCERA: AUTORIZACIÓN DE OPERACIONES</h6>
                        <p className="text-justify">EL USUARIO autoriza expresamente a Alyto a utilizar sus cuentas bancarias custodias y la red Blockchain (Stellar) para ejecutar las instrucciones de pago a proveedores o transferencias. Se entiende que Alyto actúa como un intermediario tecnológico y financiero regulado.</p>

                        <h6 className="fw-bold fs-5 mt-4">CUARTA: COMISIONES Y RECIBOS</h6>
                        <p className="text-justify">Por el servicio de intermediación, EL USUARIO acepta pagar las comisiones (Fees) vigentes en la App. Alyto emitirá el Comprobante de Operación correspondiente para fines de descargo y bancarización conforme a la normativa tributaria vigente.</p>

                        <h6 className="fw-bold text-dark mt-3">CLÁUSULA QUINTA: CONSENTIMIENTO DIGITAL</h6>
                        <p className="text-justify">La aceptación de este contrato mediante el botón "ACEPTAR" o checkbox constituye firma electrónica válida y plena prueba de conformidad, surtiendo todos los efectos legales en el Estado Plurinacional de Bolivia.</p>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-4">
                            <h6 className="fw-bold text-dark">TÉRMINOS Y CONDICIONES GENERALES DE USO - ALYTO</h6>
                            <p className="text-muted fst-italic">Vigente para Chile e Internacional</p>
                        </div>

                        <h6 className="fw-bold fs-6 mt-3">1. NATURALEZA DEL SERVICIO</h6>
                        <p className="text-justify">Alyto es una plataforma tecnológica de servicios financieros digitales que permite la gestión de activos virtuales y transferencias transfronterizas mediante infraestructura blockchain. Alyto no es una entidad bancaria.</p>

                        <h6 className="fw-bold fs-6 mt-3">2. REGISTRO Y VERIFICACIÓN (KYC/AML)</h6>
                        <p className="text-justify">Para utilizar Alyto, el usuario debe completar un proceso de registro y verificación de identidad. El usuario garantiza que toda la información proporcionada es verídica y se compromete a mantenerla actualizada conforme a estándares internacionales.</p>

                        <h6 className="fw-bold fs-6 mt-3">3. USO LÍCITO DE LA PLATAFORMA</h6>
                        <p className="text-justify">El usuario declara que los fondos utilizados en la plataforma provienen de actividades lícitas y no contravienen las leyes internacionales contra el lavado de activos y financiamiento al terrorismo.</p>

                        <h6 className="fw-bold fs-6 mt-3">4. RIESGOS DE ACTIVOS VIRTUALES</h6>
                        <p className="text-justify">El usuario reconoce y acepta los riesgos inherentes a los activos virtuales, incluyendo su volatilidad y la irreversibilidad de las transacciones en la red blockchain.</p>

                        <h6 className="fw-bold fs-6 mt-3">5. TARIFAS Y COMISIONES</h6>
                        <p className="text-justify">Alyto cobrará las comisiones vigentes publicadas en la aplicación por cada operación realizada.</p>

                        <h6 className="fw-bold fs-6 mt-3">6. LIMITACIÓN DE RESPONSABILIDAD</h6>
                        <p className="text-justify">Alyto actúa como proveedor de infraestructura tecnológica y no será responsable por fluctuaciones del mercado o errores del usuario en la gestión de sus claves privadas o direcciones de destino.</p>

                        <h6 className="fw-bold text-dark mt-3">ACEPTACIÓN</h6>
                        <p className="text-justify">Al hacer clic en el botón inferior, usted manifiesta su voluntad expresa de adherirse a estos términos y condiciones.</p>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onAccept} className="w-100 fw-bold">
                    He leído y acepto el contrato
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ContractModal;
