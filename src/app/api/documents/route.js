import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../../lib/auth';
import { NextResponse } from 'next/server';
import { 
  generateInvoicePDF, 
  generateDeliveryNotePDF, 
  generateContractPDF,
  generateServiceCertificatePDF,
  savePDFToFile 
} from '@/lib/pdf-generator';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const userData = await verifyToken(token);
    if (!userData) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const relatedEntityId = searchParams.get('relatedEntityId');

    const where = {
      userId: userData.id
    };

    // Filter by document type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filter by related entity
    if (relatedEntityId) {
      where.relatedEntityId = relatedEntityId;
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const userData = await verifyToken(token);
    if (!userData) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, 
      relatedEntityId, 
      relatedEntityType,
      data 
    } = body;

    if (!type || !data) {
      return NextResponse.json({ message: 'Document type and data are required' }, { status: 400 });
    }

    let doc;
    let filename;
    let title;

    // Generate PDF based on type
    switch (type) {
      case 'INVOICE':
        if (!data.number || !data.customer || !data.items) {
          return NextResponse.json({ message: 'Invalid invoice data' }, { status: 400 });
        }
        doc = generateInvoicePDF(data);
        filename = `invoice_${data.number}_${Date.now()}.pdf`;
        title = `Facture ${data.number}`;
        break;

      case 'DELIVERY_NOTE':
        if (!data.number || !data.package || !data.carrier) {
          return NextResponse.json({ message: 'Invalid delivery note data' }, { status: 400 });
        }
        doc = generateDeliveryNotePDF(data);
        filename = `delivery_note_${data.number}_${Date.now()}.pdf`;
        title = `Bon de livraison ${data.number}`;
        break;

      case 'CONTRACT':
        if (!data.number || !data.merchant || !data.content) {
          return NextResponse.json({ message: 'Invalid contract data' }, { status: 400 });
        }
        doc = generateContractPDF(data);
        filename = `contract_${data.number}_${Date.now()}.pdf`;
        title = `Contrat ${data.number}`;
        break;

      case 'CERTIFICATE':
        if (!data.number || !data.provider || !data.service) {
          return NextResponse.json({ message: 'Invalid certificate data' }, { status: 400 });
        }
        doc = generateServiceCertificatePDF(data);
        filename = `certificate_${data.number}_${Date.now()}.pdf`;
        title = `Certificat ${data.number}`;
        break;

      default:
        return NextResponse.json({ message: 'Unsupported document type' }, { status: 400 });
    }

    // Save PDF to file system
    const documentsDir = path.join(process.cwd(), 'public', 'documents');
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    const filePath = path.join(documentsDir, filename);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);

    // Get file size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId: userData.id,
        type,
        title,
        description: data.description || `Generated ${type.toLowerCase()}`,
        fileName: filename,
        filePath: `/documents/${filename}`,
        fileSize,
        mimeType: 'application/pdf',
        relatedEntityId,
        relatedEntityType,
        isPublic: false
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const userData = await verifyToken(token);
    if (!userData) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Document ID is required' }, { status: 400 });
    }

    // Get the document to verify ownership
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Only the document owner or admin can delete
    if (document.userId !== userData.id && userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'You can only delete your own documents' }, { status: 403 });
    }

    // Delete the physical file
    const fullFilePath = path.join(process.cwd(), 'public', document.filePath);
    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
    }

    // Delete the document record
    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 