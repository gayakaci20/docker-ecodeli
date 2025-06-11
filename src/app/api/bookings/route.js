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
    const serviceId = searchParams.get('serviceId');
    const customerId = searchParams.get('customerId');
    const providerId = searchParams.get('providerId');

    const where = {};

    // Filter by user role
    if (userData.role === 'CUSTOMER') {
      where.customerId = userData.id;
    } else if (userData.role === 'SERVICE_PROVIDER') {
      where.providerId = userData.id;
    }

    // Additional filters
    if (status && status !== 'all') {
      where.status = status;
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (customerId && userData.role === 'ADMIN') {
      where.customerId = customerId;
    }

    if (providerId && userData.role === 'ADMIN') {
      where.providerId = providerId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
                phoneNumber: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
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
      serviceId, 
      scheduledAt, 
      duration, 
      notes, 
      address 
    } = body;

    if (!serviceId || !scheduledAt) {
      return NextResponse.json({ message: 'Service ID and scheduled time are required' }, { status: 400 });
    }

    // Verify the service exists and is active
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    if (!service.isActive) {
      return NextResponse.json({ message: 'Service is not available for booking' }, { status: 400 });
    }

    // Check if the scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ message: 'Scheduled time must be in the future' }, { status: 400 });
    }

    // Check for provider availability (no overlapping bookings)
    const bookingDuration = duration || service.duration || 60; // Default 60 minutes
    const endTime = new Date(scheduledDate.getTime() + bookingDuration * 60000);

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        providerId: service.providerId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        },
        OR: [
          {
            AND: [
              { scheduledAt: { lte: scheduledDate } },
              { 
                scheduledAt: { 
                  gte: new Date(scheduledDate.getTime() - (bookingDuration * 60000))
                } 
              }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      return NextResponse.json({ 
        message: 'Provider is not available at the requested time' 
      }, { status: 409 });
    }

    // Calculate total amount
    const totalAmount = service.price;

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        customerId: userData.id,
        providerId: service.providerId,
        scheduledAt: scheduledDate,
        duration: bookingDuration,
        totalAmount,
        notes,
        address
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
                phoneNumber: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            phoneNumber: true
          }
        }
      }
    });

    // Create notifications
    await prisma.notification.create({
      data: {
        userId: service.providerId,
        type: 'NEW_MESSAGE', // Using existing type
        message: `New booking request for ${service.name}`,
        relatedEntityId: booking.id
      }
    });

    await prisma.notification.create({
      data: {
        userId: userData.id,
        type: 'ACCOUNT_VERIFIED', // Using existing type
        message: `Your booking for ${service.name} has been created`,
        relatedEntityId: booking.id
      }
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
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
      scheduledAt, 
      notes, 
      address, 
      rating, 
      review 
    } = body;

    if (!id) {
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
    }

    // Get the booking to verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            provider: true
          }
        },
        customer: true
      }
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Check permissions
    const isCustomer = booking.customerId === userData.id;
    const isProvider = booking.providerId === userData.id;
    const isAdmin = userData.role === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ message: 'You can only update bookings you are involved in' }, { status: 403 });
    }

    // Prepare update data
    const updateData = {};

    // Status updates
    if (status !== undefined) {
      // Validate status transitions
      if (status === 'CONFIRMED' && !isProvider && !isAdmin) {
        return NextResponse.json({ message: 'Only service providers can confirm bookings' }, { status: 403 });
      }
      
      if (status === 'CANCELLED' && booking.status === 'COMPLETED') {
        return NextResponse.json({ message: 'Cannot cancel completed bookings' }, { status: 400 });
      }

      updateData.status = status;
    }

    // Schedule updates (only before confirmation)
    if (scheduledAt !== undefined) {
      if (booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') {
        return NextResponse.json({ message: 'Cannot reschedule confirmed or in-progress bookings' }, { status: 400 });
      }
      
      const newScheduledDate = new Date(scheduledAt);
      if (newScheduledDate <= new Date()) {
        return NextResponse.json({ message: 'Scheduled time must be in the future' }, { status: 400 });
      }
      
      updateData.scheduledAt = newScheduledDate;
    }

    // Other updates
    if (notes !== undefined) updateData.notes = notes;
    if (address !== undefined) updateData.address = address;

    // Rating and review (only by customer after completion)
    if (rating !== undefined || review !== undefined) {
      if (!isCustomer) {
        return NextResponse.json({ message: 'Only customers can rate and review' }, { status: 403 });
      }
      
      if (booking.status !== 'COMPLETED') {
        return NextResponse.json({ message: 'Can only rate completed bookings' }, { status: 400 });
      }
      
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return NextResponse.json({ message: 'Rating must be between 1 and 5' }, { status: 400 });
        }
        updateData.rating = rating;
      }
      
      if (review !== undefined) updateData.review = review;
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        service: {
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
                phoneNumber: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
            phoneNumber: true
          }
        }
      }
    });

    // Create notifications based on status change
    if (status) {
      let notificationMessage = '';
      let notifyUserId = null;

      switch (status) {
        case 'CONFIRMED':
          notificationMessage = `Your booking for ${booking.service.name} has been confirmed`;
          notifyUserId = booking.customerId;
          break;
        case 'CANCELLED':
          notificationMessage = `Booking for ${booking.service.name} has been cancelled`;
          notifyUserId = isCustomer ? booking.providerId : booking.customerId;
          break;
        case 'COMPLETED':
          notificationMessage = `Booking for ${booking.service.name} has been completed`;
          notifyUserId = booking.customerId;
          break;
      }

      if (notificationMessage && notifyUserId && notifyUserId !== userData.id) {
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'ACCOUNT_VERIFIED', // Using existing type
            message: notificationMessage,
            relatedEntityId: booking.id
          }
        });
      }
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
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
      return NextResponse.json({ message: 'Booking ID is required' }, { status: 400 });
    }

    // Get the booking to verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Only customer, provider, or admin can delete
    const isCustomer = booking.customerId === userData.id;
    const isProvider = booking.providerId === userData.id;
    const isAdmin = userData.role === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ message: 'You can only delete bookings you are involved in' }, { status: 403 });
    }

    // Cannot delete completed bookings
    if (booking.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Cannot delete completed bookings' }, { status: 400 });
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 