import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../assets/images/logo.png';
import ReceiptContent from './ReceiptContent';

const ReceiptModal = ({ show, onHide, transaction, orderId }) => {
    const handleDownloadPDF = async () => {
        try {
            // Get the receipt content element
            const receiptElement = document.getElementById('receipt-modal-content');
            if (!receiptElement) return;

            // Create canvas from HTML
            const canvas = await html2canvas(receiptElement, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Save PDF
            const fileName = `comprobante-${orderId || transaction?.order || 'alyto'}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
        }
    };

    if (!transaction) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="d-flex align-items-center gap-2">
                    <img src={logo} alt="Alyto" style={{ height: '40px' }} />
                    <span className="fw-bold">Comprobante de Transacción</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body id="receipt-modal-content" className="px-4 py-3">
                {/* Logo for PDF */}
                <div className="text-center mb-3">
                    <img src={logo} alt="Alyto" style={{ height: '70px' }} />
                </div>

                <h5 className="text-center fw-bold mb-3" style={{ color: '#233E58' }}>
                    Comprobante de Transacción
                </h5>

                <ReceiptContent transaction={transaction} orderId={orderId} />
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0">
                <Button variant="outline-secondary" onClick={onHide}>
                    <i className="bi bi-x-circle me-2"></i>
                    Cerrar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleDownloadPDF}
                    className="fw-bold"
                >
                    <i className="bi bi-download me-2"></i>
                    Descargar PDF
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReceiptModal;
