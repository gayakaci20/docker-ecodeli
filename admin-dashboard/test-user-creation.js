const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testUserCreation() {
    try {
        console.log('Testing database connection and user creation...');
        
        // Test de connexion
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        
        // Créer un utilisateur de test
        const testUser = await prisma.user.create({
            data: {
                email: 'test@ecodeli.fr',
                password: 'test123',
                name: 'Test User',
                firstName: 'Test',
                lastName: 'User',
                role: 'CUSTOMER',
                userType: 'INDIVIDUAL'
            }
        });
        
        console.log('✅ Test user created successfully:', testUser);
        
        // Compter les utilisateurs
        const userCount = await prisma.user.count();
        console.log(`✅ Total users in database: ${userCount}`);
        
        // Lister tous les utilisateurs
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        
        console.log('✅ All users:', allUsers);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testUserCreation(); 