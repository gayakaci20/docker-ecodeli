import jsPDF from 'jspdf';

// Company information
const COMPANY_INFO = {
  name: 'EcoDeli',
  address: '123 Eco Street',
  city: 'Green City, 12345',
  phone: '+33 1 23 45 67 89',
  email: 'contact@ecodeli.com',
  website: 'www.ecodeli.com'
};

// Helper function to format currency
function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Helper function to format date
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// Generate invoice PDF
export function generateInvoicePDF(invoiceData) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(COMPANY_INFO.name, 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.address, 20, 40);
  doc.text(COMPANY_INFO.city, 20, 45);
  doc.text(COMPANY_INFO.phone, 20, 50);
  doc.text(COMPANY_INFO.email, 20, 55);
  
  // Invoice title
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('FACTURE', 150, 30);
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Numéro: ${invoiceData.number}`, 150, 40);
  doc.text(`Date: ${formatDate(invoiceData.date)}`, 150, 45);
  doc.text(`Échéance: ${formatDate(invoiceData.dueDate)}`, 150, 50);
  
  // Customer information
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Facturé à:', 20, 80);
  
  doc.setFontSize(10);
  doc.text(invoiceData.customer.name, 20, 90);
  if (invoiceData.customer.address) {
    doc.text(invoiceData.customer.address, 20, 95);
  }
  doc.text(invoiceData.customer.email, 20, 100);
  
  // Table header
  const tableTop = 120;
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(40, 40, 40);
  doc.rect(20, tableTop, 170, 10, 'F');
  
  doc.text('Description', 25, tableTop + 7);
  doc.text('Quantité', 100, tableTop + 7);
  doc.text('Prix unitaire', 130, tableTop + 7);
  doc.text('Total', 165, tableTop + 7);
  
  // Table content
  let currentY = tableTop + 15;
  doc.setTextColor(40, 40, 40);
  doc.setFillColor(245, 245, 245);
  
  invoiceData.items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(20, currentY - 5, 170, 10, 'F');
    }
    
    doc.text(item.description, 25, currentY);
    doc.text(item.quantity.toString(), 105, currentY);
    doc.text(formatCurrency(item.unitPrice), 135, currentY);
    doc.text(formatCurrency(item.total), 170, currentY);
    
    currentY += 10;
  });
  
  // Totals
  const totalsY = currentY + 10;
  doc.setFontSize(10);
  
  if (invoiceData.subtotal) {
    doc.text('Sous-total:', 130, totalsY);
    doc.text(formatCurrency(invoiceData.subtotal), 170, totalsY);
  }
  
  if (invoiceData.tax) {
    doc.text(`TVA (${invoiceData.taxRate}%):`, 130, totalsY + 10);
    doc.text(formatCurrency(invoiceData.tax), 170, totalsY + 10);
  }
  
  // Total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 130, totalsY + 20);
  doc.text(formatCurrency(invoiceData.total), 170, totalsY + 20);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Merci pour votre confiance!', 20, 270);
  doc.text(`${COMPANY_INFO.name} - ${COMPANY_INFO.website}`, 20, 275);
  
  return doc;
}

// Generate delivery note PDF
export function generateDeliveryNotePDF(deliveryData) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(COMPANY_INFO.name, 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.address, 20, 40);
  doc.text(COMPANY_INFO.city, 20, 45);
  
  // Document title
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('BON DE LIVRAISON', 120, 30);
  
  // Delivery details
  doc.setFontSize(10);
  doc.text(`Numéro: ${deliveryData.number}`, 120, 40);
  doc.text(`Date: ${formatDate(deliveryData.date)}`, 120, 45);
  
  // Package information
  doc.setFontSize(12);
  doc.text('Informations du colis:', 20, 70);
  
  doc.setFontSize(10);
  doc.text(`Titre: ${deliveryData.package.title}`, 20, 80);
  doc.text(`Description: ${deliveryData.package.description}`, 20, 85);
  if (deliveryData.package.weight) {
    doc.text(`Poids: ${deliveryData.package.weight} kg`, 20, 90);
  }
  if (deliveryData.package.dimensions) {
    doc.text(`Dimensions: ${deliveryData.package.dimensions}`, 20, 95);
  }
  
  // Addresses
  doc.setFontSize(12);
  doc.text('Adresse de collecte:', 20, 115);
  doc.setFontSize(10);
  doc.text(deliveryData.package.pickupAddress, 20, 125);
  
  doc.setFontSize(12);
  doc.text('Adresse de livraison:', 20, 145);
  doc.setFontSize(10);
  doc.text(deliveryData.package.deliveryAddress, 20, 155);
  
  // Carrier information
  doc.setFontSize(12);
  doc.text('Transporteur:', 20, 175);
  doc.setFontSize(10);
  doc.text(`${deliveryData.carrier.firstName} ${deliveryData.carrier.lastName}`, 20, 185);
  doc.text(deliveryData.carrier.email, 20, 190);
  if (deliveryData.carrier.phoneNumber) {
    doc.text(deliveryData.carrier.phoneNumber, 20, 195);
  }
  
  // Signature areas
  doc.setFontSize(10);
  doc.text('Signature expéditeur:', 20, 230);
  doc.rect(20, 235, 60, 20);
  
  doc.text('Signature destinataire:', 110, 230);
  doc.rect(110, 235, 60, 20);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${COMPANY_INFO.name} - ${COMPANY_INFO.website}`, 20, 275);
  
  return doc;
}

// Generate contract PDF
export function generateContractPDF(contractData) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('CONTRAT DE SERVICE', 105, 30, { align: 'center' });
  
  // Contract details
  doc.setFontSize(12);
  doc.text(`Contrat N°: ${contractData.number}`, 20, 50);
  doc.text(`Date: ${formatDate(contractData.date)}`, 20, 60);
  
  // Parties
  doc.setFontSize(14);
  doc.text('ENTRE LES PARTIES SUIVANTES:', 20, 80);
  
  doc.setFontSize(12);
  doc.text('Le prestataire:', 20, 100);
  doc.setFontSize(10);
  doc.text(COMPANY_INFO.name, 30, 110);
  doc.text(COMPANY_INFO.address, 30, 115);
  doc.text(COMPANY_INFO.city, 30, 120);
  
  doc.setFontSize(12);
  doc.text('Le client:', 20, 140);
  doc.setFontSize(10);
  doc.text(contractData.merchant.name, 30, 150);
  if (contractData.merchant.address) {
    doc.text(contractData.merchant.address, 30, 155);
  }
  doc.text(contractData.merchant.email, 30, 160);
  
  // Contract content
  doc.setFontSize(12);
  doc.text('OBJET DU CONTRAT:', 20, 180);
  
  doc.setFontSize(10);
  const contentLines = doc.splitTextToSize(contractData.content, 170);
  doc.text(contentLines, 20, 190);
  
  // Terms
  if (contractData.terms) {
    const termsY = 190 + (contentLines.length * 5) + 10;
    doc.setFontSize(12);
    doc.text('CONDITIONS:', 20, termsY);
    
    doc.setFontSize(10);
    const termsLines = doc.splitTextToSize(contractData.terms, 170);
    doc.text(termsLines, 20, termsY + 10);
  }
  
  // Signature area
  doc.setFontSize(10);
  doc.text('Signature du prestataire:', 20, 250);
  doc.text('Signature du client:', 110, 250);
  
  doc.text(`Date: ${formatDate(new Date())}`, 20, 260);
  doc.text(`Date: ${formatDate(new Date())}`, 110, 260);
  
  return doc;
}

// Generate service certificate PDF
export function generateServiceCertificatePDF(serviceData) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('CERTIFICAT DE SERVICE', 105, 40, { align: 'center' });
  
  // Certificate details
  doc.setFontSize(12);
  doc.text(`Certificat N°: ${serviceData.number}`, 105, 60, { align: 'center' });
  doc.text(`Date d'émission: ${formatDate(serviceData.date)}`, 105, 70, { align: 'center' });
  
  // Service information
  doc.setFontSize(14);
  doc.text('CERTIFIE QUE:', 105, 100, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${serviceData.provider.firstName} ${serviceData.provider.lastName}`, 105, 120, { align: 'center' });
  doc.text('A fourni le service suivant:', 105, 135, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text(serviceData.service.name, 105, 155, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Pour: ${serviceData.customer.firstName} ${serviceData.customer.lastName}`, 105, 175, { align: 'center' });
  doc.text(`Date du service: ${formatDate(serviceData.serviceDate)}`, 105, 185, { align: 'center' });
  
  if (serviceData.rating) {
    doc.text(`Évaluation: ${serviceData.rating}/5 étoiles`, 105, 195, { align: 'center' });
  }
  
  // Footer
  doc.setFontSize(12);
  doc.text('Délivré par:', 105, 230, { align: 'center' });
  doc.text(COMPANY_INFO.name, 105, 240, { align: 'center' });
  doc.text(formatDate(new Date()), 105, 250, { align: 'center' });
  
  return doc;
}

// Save PDF to file system
export function savePDFToFile(doc, filename, directory = 'public/documents') {
  const fs = require('fs');
  const path = require('path');
  
  // Ensure directory exists
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  
  const filePath = path.join(directory, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  fs.writeFileSync(filePath, pdfBuffer);
  
  return filePath;
} 