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
            {/* Header removed - clean modal design */}

            <Modal.Body id="receipt-modal-content" className="px-4 py-4">
                {/* Close button in top right */}
                <button
                    type="button"
                    className="btn-close position-absolute"
                    style={{ top: '15px', right: '15px', zIndex: 10 }}
                    onClick={onHide}
                    aria-label="Cerrar"
                />

                {/* Larger centered logo */}
                <div className="text-center mb-4">
                    <img src={logo} alt="Alyto" style={{ height: '100px' }} />
                </div>

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
