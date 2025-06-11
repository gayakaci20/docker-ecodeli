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
    const availability = searchParams.get('availability');
    const location = searchParams.get('location');
    const size = searchParams.get('size');
    const maxPrice = searchParams.get('maxPrice');

    const where = {
      isActive: true // Only show active storage boxes
    };

    // Filter by availability
    if (availability && availability !== 'all') {
      if (availability === 'available') {
        where.isOccupied = false;
      } else if (availability === 'occupied') {
        where.isOccupied = true;
      }
    }

    // Filter by location
    if (location && location !== 'all') {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Filter by size
    if (size && size !== 'all') {
      where.size = size;
    }

    // Filter by max price
    if (maxPrice) {
      where.pricePerDay = {
        lte: parseFloat(maxPrice)
      };
    }

    const storageBoxes = await prisma.storageBox.findMany({
      where,
      include: {
        rentals: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate availability and current rental info
    const storageBoxesWithAvailability = storageBoxes.map(box => {
      const activeRental = box.rentals.find(rental => rental.isActive);
      const isAvailable = !box.isOccupied && !activeRental;
      
      return {
        ...box,
        isAvailable,
        currentRental: activeRental || null,
        rentals: undefined // Remove detailed rentals from response for privacy
      };
    });

    return NextResponse.json(storageBoxesWithAvailability);
  } catch (error) {
    console.error('Error fetching storage boxes:', error);
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

    // Only admins can create storage boxes
    if (userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Only administrators can create storage boxes' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      code,
      location, 
      size, 
      pricePerDay
    } = body;

    if (!code || !location || !size || !pricePerDay) {
      return NextResponse.json({ message: 'Code, location, size, and price per day are required' }, { status: 400 });
    }

    if (pricePerDay < 0) {
      return NextResponse.json({ message: 'Price per day must be positive' }, { status: 400 });
    }

    // Check if code already exists
    const existingBox = await prisma.storageBox.findUnique({
      where: { code }
    });

    if (existingBox) {
      return NextResponse.json({ message: 'Storage box with this code already exists' }, { status: 409 });
    }

    // Create the storage box
    const storageBox = await prisma.storageBox.create({
      data: {
        code,
        location,
        size,
        pricePerDay,
        isOccupied: false,
        isActive: true
      }
    });

    return NextResponse.json(storageBox, { status: 201 });
  } catch (error) {
    console.error('Error creating storage box:', error);
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

    // Only admins can update storage boxes
    if (userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Only administrators can update storage boxes' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id, 
      code,
      location, 
      size, 
      pricePerDay, 
      isOccupied,
      isActive 
    } = body;

    if (!id) {
      return NextResponse.json({ message: 'Storage box ID is required' }, { status: 400 });
    }

    // Get the storage box to verify it exists
    const storageBox = await prisma.storageBox.findUnique({
      where: { id },
      include: {
        rentals: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!storageBox) {
      return NextResponse.json({ message: 'Storage box not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (location !== undefined) updateData.location = location;
    if (size !== undefined) updateData.size = size;
    if (pricePerDay !== undefined) {
      if (pricePerDay < 0) {
        return NextResponse.json({ message: 'Price per day must be positive' }, { status: 400 });
      }
      updateData.pricePerDay = pricePerDay;
    }
    if (isOccupied !== undefined) updateData.isOccupied = isOccupied;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the storage box
    const updatedStorageBox = await prisma.storageBox.update({
      where: { id },
      data: updateData,
      include: {
        rentals: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedStorageBox);
  } catch (error) {
    console.error('Error updating storage box:', error);
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

    // Only admins can delete storage boxes
    if (userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Only administrators can delete storage boxes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Storage box ID is required' }, { status: 400 });
    }

    // Get the storage box to verify it exists and check for active rentals
    const storageBox = await prisma.storageBox.findUnique({
      where: { id },
      include: {
        rentals: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!storageBox) {
      return NextResponse.json({ message: 'Storage box not found' }, { status: 404 });
    }

    // Check if there are active rentals
    if (storageBox.rentals.length > 0) {
      return NextResponse.json({ 
        message: 'Cannot delete storage box with active rentals. Please end all rentals first.' 
      }, { status: 409 });
    }

    // Delete the storage box
    await prisma.storageBox.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Storage box deleted successfully' });
  } catch (error) {
    console.error('Error deleting storage box:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 