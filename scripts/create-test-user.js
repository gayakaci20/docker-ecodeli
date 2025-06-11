const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'CUSTOMER',
        userType: 'INDIVIDUAL',
        isVerified: true,
        phoneNumber: '+33123456789',
        address: '123 Test Street, Paris'
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: password123');
    console.log('👤 User ID:', testUser.id);
    console.log('🎭 Role:', testUser.role);

    console.log('\n🚀 You can now login with:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  User already exists!');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: password123');
    } else {
      console.error('❌ Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 