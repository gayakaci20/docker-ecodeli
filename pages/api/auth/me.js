/**
 * API endpoint pour récupérer les informations de l'utilisateur connecté
 * Utilise le token JWT pour authentifier l'utilisateur
 */
import { verifyToken } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== AUTH ME DEBUG START ===');
    console.log('Request cookies:', req.cookies);
    
    // Get token from cookies
    const token = req.cookies.auth_token;
    
    console.log('Token from cookies:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    if (!token) {
      console.log('ERROR: No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token using the same method as generateToken
    console.log('Attempting to verify token...');
    const decoded = await verifyToken(token);
    
    console.log('Decoded token:', decoded ? 'SUCCESS' : 'FAILED');
    console.log('Decoded payload:', decoded);
    
    if (!decoded || !decoded.id) {
      console.log('ERROR: Invalid token or missing ID');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.log('Looking for user with ID:', decoded.id);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        userType: true,
        companyName: true,
        companyFirstName: true,
        companyLastName: true,
        phoneNumber: true,
        address: true,
        isVerified: true,
        createdAt: true,
      }
    });

    console.log('User found:', user ? `${user.email} (${user.id})` : 'NOT FOUND');

    if (!user) {
      console.log('ERROR: User not found in database');
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('SUCCESS: Returning user data');
    console.log('=== AUTH ME DEBUG END ===');
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Auth me error:', error);
    console.log('=== AUTH ME DEBUG END (ERROR) ===');
    return res.status(401).json({ message: 'Invalid token' });
  } finally {
    await prisma.$disconnect();
  }
}