const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des colis dans la base de données...');

  try {
    const packages = await prisma.package.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        sizeLabel: true,
        pickupAddress: true,
        deliveryAddress: true,
        status: true
      }
    });

    console.log(`📦 Trouvé ${packages.length} colis:`);
    
    packages.forEach((pkg, index) => {
      console.log(`\n${index + 1}. ${pkg.title}`);
      console.log(`   Prix: ${pkg.price ? pkg.price + '€' : 'Non défini'}`);
      console.log(`   Taille: ${pkg.sizeLabel || 'Non définie'}`);
      console.log(`   Départ: ${pkg.pickupAddress}`);
      console.log(`   Arrivée: ${pkg.deliveryAddress}`);
      console.log(`   Statut: ${pkg.status}`);
    });

    if (packages.length === 0) {
      console.log('❌ Aucun colis trouvé dans la base de données');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des colis:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 