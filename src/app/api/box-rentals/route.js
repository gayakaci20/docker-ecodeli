import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../../lib/auth';
import { NextResponse } from 'next/server';

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
    const status = searchParams.get('status');
    const storageBoxId = searchParams.get('storageBoxId');
    const userId = searchParams.get('userId');

    const where = {};

    // Filter by user role
    if (userData.role === 'CUSTOMER') {
      where.userId = userData.id;
    } else if (userData.role === 'ADMIN') {
      // Admin can see all rentals, apply additional filters if provided
      if (userId) {
        where.userId = userId;
      }
    } else {
      // Other roles can only see their own rentals
      where.userId = userData.id;
    }

    // Additional filters
    if (status && status !== 'all') {
      where.status = status;
    }

    if (storageBoxId) {
      where.storageBoxId = storageBoxId;
    }

    const rentals = await prisma.boxRental.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        storageBox: {
          select: {
            id: true,
            name: true,
            location: true,
            size: true,
            pricePerDay: true,
            features: true,
            accessCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate total cost and days for each rental
    const rentalsWithCalculations = rentals.map(rental => {
      const startDate = new Date(rental.startDate);
      const endDate = rental.endDate ? new Date(rental.endDate) : new Date();
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const totalCost = days * rental.storageBox.pricePerDay;

      return {
        ...rental,
        days,
        totalCost,
        // Hide access code from non-admin users unless it's their rental
        storageBox: {
          ...rental.storageBox,
          accessCode: (userData.role === 'ADMIN' || rental.userId === userData.id) 
            ? rental.storageBox.accessCode 
            : null
        }
      };
    });

    return NextResponse.json(rentalsWithCalculations);
  } catch (error) {
    console.error('Error fetching box rentals:', error);
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
      storageBoxId, 
      startDate, 
      endDate, 
      notes 
    } = body;

    if (!storageBoxId || !startDate) {
      return NextResponse.json({ message: 'Storage box ID and start date are required' }, { status: 400 });
    }

    // Verify the storage box exists and is available
    const storageBox = await prisma.storageBox.findUnique({
      where: { id: storageBoxId },
      include: {
        rentals: {
          where: {
            status: {
              in: ['ACTIVE', 'PENDING']
            }
          }
        }
      }
    });

    if (!storageBox) {
      return NextResponse.json({ message: 'Storage box not found' }, { status: 404 });
    }

    if (storageBox.status !== 'AVAILABLE') {
      return NextResponse.json({ message: 'Storage box is not available for rental' }, { status: 400 });
    }

    // Check if there are conflicting rentals
    if (storageBox.rentals.length > 0) {
      return NextResponse.json({ message: 'Storage box is already rented' }, { status: 409 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (start <= new Date()) {
      return NextResponse.json({ message: 'Start date must be in the future' }, { status: 400 });
    }

    if (end && end <= start) {
      return NextResponse.json({ message: 'End date must be after start date' }, { status: 400 });
    }

    // Calculate initial cost (if end date provided)
    let totalCost = null;
    if (end) {
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalCost = days * storageBox.pricePerDay;
    }

    // Create the rental
    const rental = await prisma.boxRental.create({
      data: {
        userId: userData.id,
        storageBoxId,
        startDate: start,
        endDate: end,
        totalCost,
        notes,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        storageBox: {
          select: {
            id: true,
            name: true,
            location: true,
            size: true,
            pricePerDay: true,
            features: true,
            accessCode: true
          }
        }
      }
    });

    // Update storage box status to RENTED
    await prisma.storageBox.update({
      where: { id: storageBoxId },
      data: { status: 'RENTED' }
    });

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: userData.id, // For now, notify the user
        type: 'ACCOUNT_VERIFIED', // Using existing type
        message: `Storage box rental request created for ${storageBox.name}`,
        relatedEntityId: rental.id
      }
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    console.error('Error creating box rental:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
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
      id, 
      status, 
      endDate, 
      notes,
      accessCode 
    } = body;

    if (!id) {
      return NextResponse.json({ message: 'Rental ID is required' }, { status: 400 });
    }

    // Get the rental to verify ownership
    const rental = await prisma.boxRental.findUnique({
      where: { id },
      include: {
        storageBox: true,
        user: true
      }
    });

    if (!rental) {
      return NextResponse.json({ message: 'Rental not found' }, { status: 404 });
    }

    // Check permissions
    const isRenter = rental.userId === userData.id;
    const isAdmin = userData.role === 'ADMIN';

    if (!isRenter && !isAdmin) {
      return NextResponse.json({ message: 'You can only update your own rentals' }, { status: 403 });
    }

    // Prepare update data
    const updateData = {};

    // Status updates
    if (status !== undefined) {
      // Validate status transitions
      if (status === 'ACTIVE' && !isAdmin) {
        return NextResponse.json({ message: 'Only administrators can activate rentals' }, { status: 403 });
      }
      
      if (status === 'COMPLETED' && rental.status !== 'ACTIVE') {
        return NextResponse.json({ message: 'Can only complete active rentals' }, { status: 400 });
      }

      updateData.status = status;

      // If completing rental, set end date to now if not already set
      if (status === 'COMPLETED' && !rental.endDate) {
        updateData.endDate = new Date();
      }
    }

    // End date updates
    if (endDate !== undefined) {
      const newEndDate = new Date(endDate);
      if (newEndDate <= new Date(rental.startDate)) {
        return NextResponse.json({ message: 'End date must be after start date' }, { status: 400 });
      }
      updateData.endDate = newEndDate;
    }

    // Other updates
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate total cost if end date changed
    if (updateData.endDate || status === 'COMPLETED') {
      const finalEndDate = updateData.endDate || rental.endDate || new Date();
      const startDate = new Date(rental.startDate);
      const days = Math.ceil((finalEndDate - startDate) / (1000 * 60 * 60 * 24));
      updateData.totalCost = days * rental.storageBox.pricePerDay;
    }

    // Update the rental
    const updatedRental = await prisma.boxRental.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        storageBox: {
          select: {
            id: true,
            name: true,
            location: true,
            size: true,
            pricePerDay: true,
            features: true,
            accessCode: true
          }
        }
      }
    });

    // Update storage box status based on rental status
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.storageBox.update({
        where: { id: rental.storageBoxId },
        data: { status: 'AVAILABLE' }
      });
    }

    // Create notifications based on status change
    if (status) {
      let notificationMessage = '';
      let notifyUserId = null;

      switch (status) {
        case 'ACTIVE':
          notificationMessage = `Your storage box rental for ${rental.storageBox.name} is now active`;
          notifyUserId = rental.userId;
          break;
        case 'COMPLETED':
          notificationMessage = `Storage box rental for ${rental.storageBox.name} has been completed`;
          notifyUserId = rental.userId;
          break;
        case 'CANCELLED':
          notificationMessage = `Storage box rental for ${rental.storageBox.name} has been cancelled`;
          notifyUserId = rental.userId;
          break;
      }

      if (notificationMessage && notifyUserId && notifyUserId !== userData.id) {
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'ACCOUNT_VERIFIED', // Using existing type
            message: notificationMessage,
            relatedEntityId: rental.id
          }
        });
      }
    }

    return NextResponse.json(updatedRental);
  } catch (error) {
    console.error('Error updating box rental:', error);
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
      return NextResponse.json({ message: 'Rental ID is required' }, { status: 400 });
    }

    // Get the rental to verify ownership
    const rental = await prisma.boxRental.findUnique({
      where: { id },
      include: {
        storageBox: true
      }
    });

    if (!rental) {
      return NextResponse.json({ message: 'Rental not found' }, { status: 404 });
    }

    // Check permissions
    const isRenter = rental.userId === userData.id;
    const isAdmin = userData.role === 'ADMIN';

    if (!isRenter && !isAdmin) {
      return NextResponse.json({ message: 'You can only delete your own rentals' }, { status: 403 });
    }

    // Cannot delete active rentals
    if (rental.status === 'ACTIVE') {
      return NextResponse.json({ message: 'Cannot delete active rentals. Please complete or cancel first.' }, { status: 400 });
    }

    // Delete the rental
    await prisma.boxRental.delete({
      where: { id }
    });

    // Update storage box status to available if it was rented
    if (rental.storageBox.status === 'RENTED') {
      await prisma.storageBox.update({
        where: { id: rental.storageBoxId },
        data: { status: 'AVAILABLE' }
      });
    }

    return NextResponse.json({ message: 'Rental deleted successfully' });
  } catch (error) {
    console.error('Error deleting box rental:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 