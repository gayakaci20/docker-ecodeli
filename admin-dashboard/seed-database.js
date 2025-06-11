const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function seedDatabase() {
    try {
        console.log('🌱 Initializing database with test data...');
        
        // Créer des utilisateurs de test
        const users = await Promise.all([
            prisma.user.create({
                data: {
                    email: 'admin@ecodeli.com',
                    password: 'admin123',
                    name: 'Admin EcoDeli',
                    firstName: 'Admin',
                    lastName: 'EcoDeli',
                    role: 'ADMIN',
                    userType: 'PROFESSIONAL',
                    isVerified: true
                }
            }),
            prisma.user.create({
                data: {
                    email: 'transporteur@ecodeli.com',
                    password: 'transport123',
                    name: 'Jean Transporteur',
                    firstName: 'Jean',
                    lastName: 'Transporteur',
                    role: 'CARRIER',
                    userType: 'PROFESSIONAL',
                    phoneNumber: '0123456789'
                }
            }),
            prisma.user.create({
                data: {
                    email: 'expediteur@ecodeli.com',
                    password: 'expedit123',
                    name: 'Marie Expéditeur',
                    firstName: 'Marie',
                    lastName: 'Expéditeur',
                    role: 'SENDER',
                    userType: 'INDIVIDUAL',
                    phoneNumber: '0123456788'
                }
            }),
            prisma.user.create({
                data: {
                    email: 'client@ecodeli.com',
                    password: 'client123',
                    name: 'Paul Client',
                    firstName: 'Paul',
                    lastName: 'Client',
                    role: 'CUSTOMER',
                    userType: 'INDIVIDUAL',
                    phoneNumber: '0123456787'
                }
            }),
            prisma.user.create({
                data: {
                    email: 'service@ecodeli.com',
                    password: 'service123',
                    name: 'Service Provider',
                    firstName: 'Service',
                    lastName: 'Provider',
                    role: 'SERVICE_PROVIDER',
                    userType: 'PROFESSIONAL',
                    phoneNumber: '0123456786'
                }
            })
        ]);
        
        console.log(`✅ Created ${users.length} users`);
        
        // Créer quelques packages de test
        const packages = await Promise.all([
            prisma.package.create({
                data: {
                    userId: users[2].id, // Marie Expéditeur
                    title: 'Colis électronique',
                    description: 'Ordinateur portable à livrer',
                    weight: 2.5,
                    dimensions: '40x30x10',
                    pickupLocation: 'Paris 75001',
                    pickupAddress: '123 Rue de Rivoli, Paris 75001',
                    deliveryLocation: 'Lyon 69000',
                    deliveryAddress: '456 Place Bellecour, Lyon 69000',
                    status: 'PENDING',
                    pickupDate: new Date('2025-06-15'),
                    deliveryDeadline: new Date('2025-06-18')
                }
            }),
            prisma.package.create({
                data: {
                    userId: users[2].id, // Marie Expéditeur
                    title: 'Documents importants',
                    description: 'Contrats à signer',
                    weight: 0.5,
                    dimensions: '30x25x5',
                    pickupLocation: 'Marseille 13000',
                    pickupAddress: '789 La Canebière, Marseille 13000',
                    deliveryLocation: 'Nice 06000',
                    deliveryAddress: '321 Promenade des Anglais, Nice 06000',
                    status: 'PENDING',
                    pickupDate: new Date('2025-06-20'),
                    deliveryDeadline: new Date('2025-06-22')
                }
            })
        ]);
        
        console.log(`✅ Created ${packages.length} packages`);
        
        const userCount = await prisma.user.count();
        const packageCount = await prisma.package.count();
        
        console.log(`🎉 Database seeded successfully!`);
        console.log(`📊 Final counts: ${userCount} users, ${packageCount} packages`);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter uniquement si lancé directement
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase }; 