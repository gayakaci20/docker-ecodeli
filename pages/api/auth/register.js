import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      password, 
      name, 
      firstName, 
      lastName, 
      userType, 
      role, 
      phone,
      companyName,
      companyFirstName,
      companyLastName 
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Construire le nom complet si firstName et lastName sont fournis
    let fullName = name;
    if (!fullName && firstName && lastName) {
      fullName = `${firstName} ${lastName}`;
    }
    if (!fullName && firstName) {
      fullName = firstName;
    }
    if (!fullName) {
      return res.status(400).json({ error: 'Nom requis' });
    }
    
    // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
      where: { email }
      });

      if (existingUser) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const userCreateData = {
      email,
      password: hashedPassword,
      name: fullName,
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phone || null,
      userType: userType || 'INDIVIDUAL',
      role: role || 'SENDER'
    };

    // Ajouter les champs professionnels si c'est un professionnel
    if (userType === 'PROFESSIONAL') {
      userCreateData.companyName = companyName || null;
      userCreateData.companyFirstName = companyFirstName || null;
      userCreateData.companyLastName = companyLastName || null;
    }

    const user = await prisma.user.create({
      data: userCreateData
    });

    // Créer le token JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production';
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner les données utilisateur (sans le mot de passe)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      createdAt: user.createdAt
    };

    res.status(201).json({ 
      token,
      user: userData
    });
  } catch (error) {
    console.error('Register error:', error);
    
    // Gérer les erreurs de contrainte unique
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà' });
      } else if (field === 'phone_number') {
        return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
      } else {
        return res.status(409).json({ error: 'Ces informations sont déjà utilisées' });
      }
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    await prisma.$disconnect();
  }
}