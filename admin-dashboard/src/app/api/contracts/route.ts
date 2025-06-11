import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const merchantId = searchParams.get('merchantId');
    const limit = searchParams.get('limit');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (merchantId) {
      where.merchantId = merchantId;
    }

    const contracts = await prisma.contract.findMany({
      where,
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
        },
        documents: {
          select: {
            id: true,
            type: true,
            title: true,
            fileName: true,
            filePath: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      merchantId, 
      title, 
      description, 
      terms, 
      value, 
      currency = 'EUR',
      startDate,
      endDate 
    } = body;

    if (!merchantId || !title || !terms) {
      return NextResponse.json(
        { error: 'Merchant ID, title, and terms are required' },
        { status: 400 }
      );
    }

    // Verify merchant exists and is PROFESSIONAL
    const merchant = await prisma.user.findUnique({
      where: { id: merchantId },
      select: { id: true, userType: true }
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.userType !== 'PROFESSIONAL') {
      return NextResponse.json(
        { error: 'Contracts can only be created for PROFESSIONAL users' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.create({
      data: {
        merchantId,
        title,
        description,
        terms,
        value: value ? parseFloat(value) : null,
        currency,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'DRAFT'
      },
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
        },
        documents: true
      }
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, signedDate, value, startDate, endDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (signedDate) updateData.signedDate = new Date(signedDate);
    if (value !== undefined) updateData.value = value ? parseFloat(value) : null;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
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
        },
        documents: {
          select: {
            id: true,
            type: true,
            title: true,
            fileName: true,
            filePath: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
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
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Check if contract can be deleted (only DRAFT contracts)
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { status: true }
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (contract.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT contracts can be deleted' },
        { status: 400 }
      );
    }

    await prisma.contract.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
} 