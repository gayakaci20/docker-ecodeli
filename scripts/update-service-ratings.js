const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateServiceRatings() {
  try {
    console.log('🔄 Updating service ratings...');

    // Get all services
    const services = await prisma.service.findMany({
      include: {
        bookings: {
          where: {
            rating: {
              not: null
            }
          },
          select: {
            rating: true
          }
        }
      }
    });

    console.log(`📊 Found ${services.length} services to update`);

    for (const service of services) {
      const ratings = service.bookings.map(booking => booking.rating).filter(rating => rating !== null);
      
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
      
      const reviewCount = ratings.length;

      await prisma.service.update({
        where: { id: service.id },
        data: {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          reviewCount: reviewCount
        }
      });

      console.log(`✅ Updated service "${service.name}": ${averageRating.toFixed(1)}/5 (${reviewCount} reviews)`);
    }

    console.log('✅ All service ratings updated successfully!');

  } catch (error) {
    console.error('❌ Error updating service ratings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateServiceRatings(); 