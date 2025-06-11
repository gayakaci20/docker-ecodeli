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

    // Build where clause
    const where = {
      OR: [
        { package: { userId: userData.id } },
        { ride: { userId: userData.id } }
      ]
    };

    if (status && status !== 'all') {
      // Support multiple statuses separated by comma
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else {
        where.status = {
          in: statuses
        };
      }
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        package: {
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
        },
        ride: {
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

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
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
    const { packageId, rideId, price, proposedByUserId } = body;

    if (!packageId || !rideId) {
      return NextResponse.json({ message: 'Package ID and Ride ID are required' }, { status: 400 });
    }

    // Verify that the package and ride exist
    const packageExists = await prisma.package.findUnique({
      where: { id: packageId }
    });

    const rideExists = await prisma.ride.findUnique({
      where: { id: rideId }
    });

    if (!packageExists || !rideExists) {
      return NextResponse.json({ message: 'Package or ride not found' }, { status: 404 });
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        packageId,
        rideId
      }
    });

    if (existingMatch) {
      return NextResponse.json({ message: 'Match already exists' }, { status: 409 });
    }

    const match = await prisma.match.create({
      data: {
        packageId,
        rideId,
        price: price || null,
        proposedByUserId: proposedByUserId || userData.id,
        status: 'PROPOSED'
      },
      include: {
        package: {
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
        },
        ride: {
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

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
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
    const { id, status, price } = body;

    if (!id) {
      return NextResponse.json({ message: 'Match ID is required' }, { status: 400 });
    }

    // Verify that the match exists and user has permission
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        package: true,
        ride: true
      }
    });

    if (!existingMatch) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 });
    }

    // Check if user is involved in this match
    const isPackageOwner = existingMatch.package.userId === userData.id;
    const isRideOwner = existingMatch.ride.userId === userData.id;

    if (!isPackageOwner && !isRideOwner) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (price !== undefined) updateData.price = price;

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        package: {
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
        },
        ride: {
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

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
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
      return NextResponse.json({ message: 'Match ID is required' }, { status: 400 });
    }

    // Verify that the match exists and user has permission
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        package: true,
        ride: true
      }
    });

    if (!existingMatch) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 });
    }

    // Check if user is involved in this match
    const isPackageOwner = existingMatch.package.userId === userData.id;
    const isRideOwner = existingMatch.ride.userId === userData.id;

    if (!isPackageOwner && !isRideOwner) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.match.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 