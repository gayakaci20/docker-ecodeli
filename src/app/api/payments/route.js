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
    const matchId = searchParams.get('matchId');

    const where = {
      userId: userData.id
    };

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by match if provided
    if (matchId) {
      where.matchId = matchId;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        match: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
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
    const { matchId, amount, currency = 'EUR', paymentMethod } = body;

    if (!matchId || !amount) {
      return NextResponse.json({ message: 'Match ID and amount are required' }, { status: 400 });
    }

    // Verify that the match exists and user is involved
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        package: true,
        ride: true,
        payment: true // Check if payment already exists
      }
    });

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 });
    }

    // Check if user is involved in this match
    const isPackageOwner = match.package.userId === userData.id;
    const isRideOwner = match.ride.userId === userData.id;

    if (!isPackageOwner && !isRideOwner) {
      return NextResponse.json({ message: 'You can only create payments for matches you are involved in' }, { status: 403 });
    }

    // Check if payment already exists for this match
    if (match.payment) {
      return NextResponse.json({ message: 'Payment already exists for this match' }, { status: 409 });
    }

    // Check if match is confirmed
    if (match.status !== 'CONFIRMED') {
      return NextResponse.json({ message: 'Match must be confirmed before creating payment' }, { status: 400 });
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        userId: userData.id,
        matchId,
        amount,
        currency,
        paymentMethod: paymentMethod || 'card',
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        match: {
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
        }
      }
    });

    // Create notification for the other party
    const otherUserId = isPackageOwner ? match.ride.userId : match.package.userId;
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'PAYMENT_SUCCESS',
        message: `Payment initiated for your match`,
        relatedEntityId: payment.id
      }
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
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
    const { id, status, transactionId, paymentIntentId } = body;

    if (!id || !status) {
      return NextResponse.json({ message: 'Payment ID and status are required' }, { status: 400 });
    }

    // Get the payment to verify ownership
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        match: {
          include: {
            package: true,
            ride: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    // Check if user is involved in this payment's match
    const isPackageOwner = payment.match.package.userId === userData.id;
    const isRideOwner = payment.match.ride.userId === userData.id;
    const isPaymentOwner = payment.userId === userData.id;

    if (!isPackageOwner && !isRideOwner && !isPaymentOwner) {
      return NextResponse.json({ message: 'You can only update payments you are involved in' }, { status: 403 });
    }

    // Update the payment
    const updateData = { status };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
    if (paymentIntentId) {
      updateData.paymentIntentId = paymentIntentId;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        match: {
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
        }
      }
    });

    // Create notifications based on payment status
    let notificationType = 'PAYMENT_SUCCESS';
    let message = 'Payment completed successfully';

    if (status === 'FAILED') {
      notificationType = 'PAYMENT_FAILED';
      message = 'Payment failed';
    } else if (status === 'REFUNDED') {
      message = 'Payment refunded';
    }

    // Notify all parties involved
    const userIds = [
      payment.match.package.userId,
      payment.match.ride.userId
    ].filter(id => id !== userData.id); // Don't notify the user who made the update

    for (const userId of userIds) {
      await prisma.notification.create({
        data: {
          userId,
          type: notificationType,
          message,
          relatedEntityId: payment.id
        }
      });
    }

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 