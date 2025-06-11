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

    // Get all unique conversation partners
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT
        CASE 
          WHEN sender_id = ${userData.id} THEN receiver_id
          ELSE sender_id
        END as partner_id,
        MAX(created_at) as last_message_time,
        COUNT(CASE WHEN receiver_id = ${userData.id} AND read = false THEN 1 END) as unread_count
      FROM messages 
      WHERE sender_id = ${userData.id} OR receiver_id = ${userData.id}
      GROUP BY partner_id
      ORDER BY last_message_time DESC
    `;

    // Get user details for each conversation partner
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const partner = await prisma.user.findUnique({
          where: { id: conv.partner_id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true
          }
        });

        // Get the last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userData.id, receiverId: conv.partner_id },
              { senderId: conv.partner_id, receiverId: userData.id }
            ]
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true
          }
        });

        return {
          partner,
          lastMessage,
          unreadCount: Number(conv.unread_count),
          lastMessageTime: conv.last_message_time
        };
      })
    );

    return NextResponse.json(conversationsWithUsers);
  } catch (error) {
    console.error('Error fetching conversations:', error);
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
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json({ message: 'Partner ID is required' }, { status: 400 });
    }

    // Mark all unread messages from this partner as read
    const result = await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userData.id,
        read: false
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({ 
      message: 'Conversation marked as read',
      updatedCount: result.count
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 