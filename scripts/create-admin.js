const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('Un administrateur existe déjà:', existingAdmin.email);
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@ecodeli.com',
        password: hashedPassword,
        name: 'Administrateur',
        firstName: 'Admin',
        lastName: 'Ecodeli',
        role: 'ADMIN',
        isVerified: true,
        emailVerified: new Date(),
      }
    });

    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email: admin@ecodeli.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 ID:', admin.id);

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 