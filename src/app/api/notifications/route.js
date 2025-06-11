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
    const unreadOnly = searchParams.get('unreadOnly');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {
      userId: userData.id
    };

    // Filter unread notifications only
    if (unreadOnly === 'true') {
      where.read = false;
    }

    // Filter by notification type
    if (type && type !== 'all') {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userData.id,
        read: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
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
    const { userId, type, message, relatedEntityId } = body;

    if (!userId || !type || !message) {
      return NextResponse.json({ message: 'User ID, type, and message are required' }, { status: 400 });
    }

    // Only admins can create notifications for other users
    if (userId !== userData.id && userData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'You can only create notifications for yourself unless you are an admin' }, { status: 403 });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedEntityId: relatedEntityId || null
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
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
    const { id, read } = body;

    if (!id) {
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 });
    }

    // Get the notification to verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    // Only the notification owner can update it
    if (notification.userId !== userData.id) {
      return NextResponse.json({ message: 'You can only update your own notifications' }, { status: 403 });
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        read: read !== undefined ? read : true
      }
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
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
      return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 });
    }

    // Get the notification to verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    // Only the notification owner can delete it
    if (notification.userId !== userData.id) {
      return NextResponse.json({ message: 'You can only delete your own notifications' }, { status: 403 });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 