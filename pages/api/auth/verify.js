import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }

    const token = authHeader.substring(7)
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      
      // Rechercher l'utilisateur dans la base de données
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          createdAt: true
        }
      })

      if (!user) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' })
      }

      res.status(200).json({ user })
    } catch (jwtError) {
      return res.status(401).json({ error: 'Token invalide' })
    }
  } catch (error) {
    console.error('Verify error:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  } finally {
    await prisma.$disconnect()
  }
} 