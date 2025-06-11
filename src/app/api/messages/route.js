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
    const conversationWith = searchParams.get('conversationWith');

    if (!conversationWith) {
      return NextResponse.json({ message: 'conversationWith parameter is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: userData.id,
            receiverId: conversationWith
          },
          {
            senderId: conversationWith,
            receiverId: userData.id
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: conversationWith,
        receiverId: userData.id,
        read: false
      },
      data: {
        read: true
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
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
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ message: 'Receiver ID and content are required' }, { status: 400 });
    }

    // Verify that the receiver exists
    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiverExists) {
      return NextResponse.json({ message: 'Receiver not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: userData.id,
        receiverId,
        content: content.trim(),
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create notification for the receiver
    try {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'NEW_MESSAGE',
          message: `New message from ${userData.firstName} ${userData.lastName}`,
          relatedEntityId: message.id,
          read: false
        }
      });
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the message creation if notification fails
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
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
      return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
    }

    // Verify that the message exists and user is the receiver
    const existingMessage = await prisma.message.findUnique({
      where: { id }
    });

    if (!existingMessage) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    if (existingMessage.receiverId !== userData.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const message = await prisma.message.update({
      where: { id },
      data: { read: read !== undefined ? read : true },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
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
      return NextResponse.json({ message: 'Message ID is required' }, { status: 400 });
    }

    // Verify that the message exists and user is the sender
    const existingMessage = await prisma.message.findUnique({
      where: { id }
    });

    if (!existingMessage) {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }

    if (existingMessage.senderId !== userData.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 