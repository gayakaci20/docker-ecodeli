import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Company information for PDFs
const COMPANY_INFO = {
  name: 'EcoDeli',
  address: '123 Rue de la Livraison Verte',
  city: '75001 Paris, France',
  phone: '+33 1 23 45 67 89',
  email: 'contact@ecodeli.fr',
  website: 'www.ecodeli.fr'
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// Helper function to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR').format(date);
}

// Generate contract PDF
function generateContractPDF(contractData: any): jsPDF {
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
  doc.text(`Email: ${COMPANY_INFO.email}`, 30, 125);
  doc.text(`Tél: ${COMPANY_INFO.phone}`, 30, 130);
  
  doc.setFontSize(12);
  doc.text('Le client:', 20, 150);
  doc.setFontSize(10);
  
  const merchantName = contractData.merchant.companyName || 
    `${contractData.merchant.firstName || ''} ${contractData.merchant.lastName || ''}`.trim() ||
    contractData.merchant.name || contractData.merchant.email;
  
  doc.text(merchantName, 30, 160);
  if (contractData.merchant.address) {
    doc.text(contractData.merchant.address, 30, 165);
  }
  doc.text(`Email: ${contractData.merchant.email}`, 30, 170);
  if (contractData.merchant.phoneNumber) {
    doc.text(`Tél: ${contractData.merchant.phoneNumber}`, 30, 175);
  }
  
  // Contract content
  doc.setFontSize(12);
  doc.text('OBJET DU CONTRAT:', 20, 195);
  
  doc.setFontSize(10);
  doc.text(`Titre: ${contractData.title}`, 20, 205);
  
  if (contractData.description) {
    doc.text('Description:', 20, 215);
    const descLines = doc.splitTextToSize(contractData.description, 170);
    doc.text(descLines, 20, 225);
  }
  
  // Terms
  const termsY = contractData.description ? 225 + (doc.splitTextToSize(contractData.description, 170).length * 5) + 10 : 225;
  doc.setFontSize(12);
  doc.text('CONDITIONS:', 20, termsY);
  
  doc.setFontSize(10);
  const termsLines = doc.splitTextToSize(contractData.terms, 170);
  doc.text(termsLines, 20, termsY + 10);
  
  // Value
  if (contractData.value) {
    const valueY = termsY + 10 + (termsLines.length * 5) + 10;
    doc.setFontSize(12);
    doc.text(`Valeur du contrat: ${formatCurrency(contractData.value)}`, 20, valueY);
  }
  
  // Dates
  let datesY = termsY + 10 + (termsLines.length * 5) + (contractData.value ? 20 : 10);
  if (contractData.startDate) {
    doc.text(`Date de début: ${formatDate(new Date(contractData.startDate))}`, 20, datesY);
    datesY += 10;
  }
  if (contractData.endDate) {
    doc.text(`Date de fin: ${formatDate(new Date(contractData.endDate))}`, 20, datesY);
    datesY += 10;
  }
  
  // Signature area
  const signatureY = Math.max(datesY + 20, 250);
  doc.setFontSize(10);
  doc.text('Signature du prestataire:', 20, signatureY);
  doc.text('Signature du client:', 110, signatureY);
  
  doc.text(`Date: ${formatDate(new Date())}`, 20, signatureY + 10);
  doc.text(`Date: ${formatDate(new Date())}`, 110, signatureY + 10);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${COMPANY_INFO.name} - ${COMPANY_INFO.website}`, 20, 280);
  
  return doc;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const contractId = searchParams.get('contractId');
    const userId = searchParams.get('userId');

    const where: any = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (contractId) {
      where.contractId = contractId;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true
          }
        },
        contract: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId, type = 'CONTRACT' } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Fetch contract with merchant details
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.merchant.userType !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'PDFs can only be generated for PROFESSIONAL users' },
        { status: 400 }
      );
    }

    // Generate PDF data
    const pdfData = {
      number: `CONT-${contract.id.substring(0, 8)}`,
      title: contract.title,
      description: contract.description,
      terms: contract.terms,
      value: contract.value,
      startDate: contract.startDate,
      endDate: contract.endDate,
      date: contract.createdAt,
      merchant: contract.merchant
    };

    // Generate PDF
    const doc = generateContractPDF(pdfData);
    const filename = `contract_${contract.id}_${Date.now()}.pdf`;

    // Ensure documents directory exists
    const documentsDir = path.join(process.cwd(), 'public', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    // Save PDF to file system
    const filePath = path.join(documentsDir, filename);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId: contract.merchantId,
        contractId: contract.id,
        type: type as any,
        title: `Contrat ${contract.title}`,
        description: `PDF généré pour le contrat ${contract.title}`,
        fileName: filename,
        filePath: `/documents/${filename}`,
        fileSize,
        mimeType: 'application/pdf',
        relatedEntityId: contract.id,
        relatedEntityType: 'contract',
        isPublic: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true
          }
        },
        contract: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document info before deletion
    const document = await prisma.document.findUnique({
      where: { id },
      select: { fileName: true, filePath: true }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    const fullPath = path.join(process.cwd(), 'public', document.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 