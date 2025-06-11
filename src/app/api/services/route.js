import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../../lib/auth';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      isActive: true
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (location && location !== 'all') {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    // Define sorting options
    let orderBy = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: 'asc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [services, totalCount] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
              isVerified: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.service.count({ where })
    ]);

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
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

    // Only SERVICE_PROVIDER role can create services
    if (userData.role !== 'SERVICE_PROVIDER' && userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Only service providers can create services' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      category, 
      price, 
      duration, 
      location
    } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ message: 'Name, category, and price are required' }, { status: 400 });
    }

    if (price < 0) {
      return NextResponse.json({ message: 'Price must be positive' }, { status: 400 });
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        providerId: userData.id,
        name,
        description,
        category,
        price,
        duration,
        location
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            isVerified: true
          }
        }
      }
    });

    // Create notification for admin about new service
    await prisma.notification.create({
      data: {
        userId: userData.id, // For now, notify the provider
        type: 'ACCOUNT_VERIFIED', // We'll use this as a general notification type
        message: `Your service "${name}" has been created successfully`,
        relatedEntityId: service.id
      }
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
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
      name, 
      description, 
      category, 
      price, 
      duration, 
      location,
      isActive 
    } = body;

    if (!id) {
      return NextResponse.json({ message: 'Service ID is required' }, { status: 400 });
    }

    // Get the service to verify ownership
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    // Only the service provider or admin can update the service
    if (service.providerId !== userData.id && userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'You can only update your own services' }, { status: 403 });
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) {
      if (price < 0) {
        return NextResponse.json({ message: 'Price must be positive' }, { status: 400 });
      }
      updateData.price = price;
    }
    if (duration !== undefined) updateData.duration = duration;
    if (location !== undefined) updateData.location = location;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update the service
    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            isVerified: true
          }
        }
      }
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
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
      return NextResponse.json({ message: 'Service ID is required' }, { status: 400 });
    }

    // Get the service to verify ownership
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
            }
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    // Only the service provider or admin can delete the service
    if (service.providerId !== userData.id && userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'You can only delete your own services' }, { status: 403 });
    }

    // Check if there are active bookings
    if (service.bookings.length > 0) {
      return NextResponse.json({ 
        message: 'Cannot delete service with active bookings. Please complete or cancel all bookings first.' 
      }, { status: 409 });
    }

    // Delete the service
    await prisma.service.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 