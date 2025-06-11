const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const samplePackages = [
  {
    title: "Colis fragile - Verres en cristal",
    description: "13 verres en cristal très fragiles à transporter avec précaution",
    weight: 2.5,
    price: 15,
    sizeLabel: "XL",
    pickupAddress: "Mantes-la-Jolie, France",
    deliveryAddress: "Boulogne-Billancourt, France",
    status: "PENDING"
  },
  {
    title: "Électroménager - Micro-ondes",
    description: "Micro-ondes en bon état, emballé dans carton d'origine",
    weight: 15,
    price: 78,
    sizeLabel: "XXL",
    pickupAddress: "Paris, France",
    deliveryAddress: "Lyon, France",
    status: "PENDING"
  },
  {
    title: "Vêtements - Lot de vêtements d'hiver",
    description: "Sac de vêtements d'hiver, manteaux et pulls",
    weight: 3,
    price: 23,
    sizeLabel: "L",
    pickupAddress: "Lille, France",
    deliveryAddress: "Marseille, France",
    status: "PENDING"
  },
  {
    title: "Livres - Collection de livres anciens",
    description: "Carton de livres anciens et rares",
    weight: 8,
    price: 34,
    sizeLabel: "M",
    pickupAddress: "Bordeaux, France",
    deliveryAddress: "Strasbourg, France",
    status: "PENDING"
  },
  {
    title: "Plantes - Plantes d'intérieur",
    description: "Lot de 5 plantes d'intérieur en pot",
    weight: 12,
    price: 45,
    sizeLabel: "L",
    pickupAddress: "Toulouse, France",
    deliveryAddress: "Nantes, France",
    status: "PENDING"
  },
  {
    title: "Petit colis - Bijoux",
    description: "Petite boîte contenant des bijoux précieux",
    weight: 0.5,
    price: 9,
    sizeLabel: "S",
    pickupAddress: "Nice, France",
    deliveryAddress: "Rennes, France",
    status: "PENDING"
  },
  {
    title: "Meuble - Table basse",
    description: "Table basse en bois massif, démontée",
    weight: 25,
    price: 125,
    sizeLabel: "XXXL",
    pickupAddress: "Montpellier, France",
    deliveryAddress: "Reims, France",
    status: "PENDING"
  },
  {
    title: "Équipement sportif - Vélo",
    description: "Vélo de course en bon état, roues démontées",
    weight: 18,
    price: 86,
    sizeLabel: "XXL",
    pickupAddress: "Angers, France",
    deliveryAddress: "Dijon, France",
    status: "PENDING"
  }
];

async function main() {
  console.log('🌱 Ajout de colis d\'exemple...');

  // Créer un utilisateur de test s'il n'existe pas
  let testUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'SENDER',
        userType: 'INDIVIDUAL'
      }
    });
    console.log('✅ Utilisateur de test créé');
  }

  // Ajouter les colis d'exemple
  for (const packageData of samplePackages) {
    const existingPackage = await prisma.package.findFirst({
      where: {
        title: packageData.title,
        userId: testUser.id
      }
    });

    if (!existingPackage) {
      await prisma.package.create({
        data: {
          ...packageData,
          userId: testUser.id
        }
      });
      console.log(`✅ Colis ajouté: ${packageData.title} - ${packageData.price}€ ${packageData.sizeLabel}`);
    } else {
      console.log(`⏭️  Colis déjà existant: ${packageData.title}`);
    }
  }

  console.log('🎉 Terminé! Les colis d\'exemple ont été ajoutés.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 