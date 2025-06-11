import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../../../lib/auth';
import { createPaymentIntent, retrievePaymentIntent } from '@/lib/stripe';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

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
    const { matchId, bookingId, amount, currency = 'eur' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Valid amount is required' }, { status: 400 });
    }

    let relatedEntity = null;
    let metadata = {
      userId: userData.id,
      type: 'unknown'
    };

    // Handle match payments
    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          package: true,
          ride: true,
          payment: true
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

      // Check if payment already exists
      if (match.payment) {
        return NextResponse.json({ message: 'Payment already exists for this match' }, { status: 409 });
      }

      // Check if match is confirmed
      if (match.status !== 'CONFIRMED') {
        return NextResponse.json({ message: 'Match must be confirmed before creating payment' }, { status: 400 });
      }

      relatedEntity = match;
      metadata = {
        userId: userData.id,
        matchId: matchId,
        type: 'match_payment'
      };
    }

    // Handle booking payments
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: true,
          customer: true,
          provider: true
        }
      });

      if (!booking) {
        return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
      }

      // Check if user is the customer
      if (booking.customerId !== userData.id) {
        return NextResponse.json({ message: 'Only the customer can pay for bookings' }, { status: 403 });
      }

      // Check if booking is confirmed
      if (booking.status !== 'CONFIRMED') {
        return NextResponse.json({ message: 'Booking must be confirmed before payment' }, { status: 400 });
      }

      relatedEntity = booking;
      metadata = {
        userId: userData.id,
        bookingId: bookingId,
        type: 'booking_payment'
      };
    }

    if (!relatedEntity) {
      return NextResponse.json({ message: 'Either matchId or bookingId is required' }, { status: 400 });
    }

    // Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent(amount, currency, metadata);

    // Create payment record in database
    let payment;
    if (matchId) {
      payment = await prisma.payment.create({
        data: {
          userId: userData.id,
          matchId: matchId,
          amount: amount,
          currency: currency,
          status: 'PENDING',
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id
        }
      });
    } else if (bookingId) {
      // For bookings, we'll store payment info in a separate table or extend the booking
      // For now, let's update the booking with payment intent
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          // We could add paymentIntentId field to booking model
          notes: `Payment Intent: ${paymentIntent.id}`
        }
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

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
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json({ message: 'Payment intent ID is required' }, { status: 400 });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

    // Verify the payment intent belongs to this user
    if (paymentIntent.metadata.userId !== userData.id) {
      return NextResponse.json({ message: 'Payment intent not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 