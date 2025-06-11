const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createStorageBoxes() {
  try {
    console.log('🔧 Creating sample storage boxes...');

    const storageBoxes = [
      {
        code: 'BOX001',
        location: 'Paris 15ème - Gare Montparnasse',
        size: 'SMALL',
        pricePerDay: 5.99,
        isOccupied: false,
        isActive: true
      },
      {
        code: 'BOX002',
        location: 'Paris 15ème - Gare Montparnasse',
        size: 'MEDIUM',
        pricePerDay: 9.99,
        isOccupied: false,
        isActive: true
      },
      {
        code: 'BOX003',
        location: 'Paris 15ème - Gare Montparnasse',
        size: 'LARGE',
        pricePerDay: 15.99,
        isOccupied: true,
        isActive: true
      },
      {
        code: 'BOX004',
        location: 'Paris 1er - Châtelet',
        size: 'SMALL',
        pricePerDay: 6.99,
        isOccupied: false,
        isActive: true
      },
      {
        code: 'BOX005',
        location: 'Paris 1er - Châtelet',
        size: 'MEDIUM',
        pricePerDay: 11.99,
        isOccupied: false,
        isActive: true
      },
      {
        code: 'BOX006',
        location: 'Lyon Part-Dieu',
        size: 'LARGE',
        pricePerDay: 14.99,
        isOccupied: false,
        isActive: true
      },
      {
        code: 'BOX007',
        location: 'Lyon Part-Dieu',
        size: 'SMALL',
        pricePerDay: 4.99,
        isOccupied: false,
        isActive: true
      },
      {
        code: 'BOX008',
        location: 'Marseille Gare Saint-Charles',
        size: 'MEDIUM',
        pricePerDay: 8.99,
        isOccupied: false,
        isActive: true
      }
    ];

    for (const boxData of storageBoxes) {
      try {
        const box = await prisma.storageBox.create({
          data: boxData
        });
        console.log(`✅ Created storage box: ${box.code} - ${box.location} (${box.size})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`ℹ️  Storage box ${boxData.code} already exists`);
        } else {
          console.error(`❌ Error creating storage box ${boxData.code}:`, error.message);
        }
      }
    }

    console.log('✅ Storage boxes creation completed!');

    // Display summary
    const totalBoxes = await prisma.storageBox.count();
    const availableBoxes = await prisma.storageBox.count({
      where: { isOccupied: false, isActive: true }
    });

    console.log(`📊 Total storage boxes: ${totalBoxes}`);
    console.log(`📦 Available boxes: ${availableBoxes}`);

  } catch (error) {
    console.error('❌ Error creating storage boxes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStorageBoxes(); 