const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedRides() {
  console.log('🚗 Ajout de trajets de test...\n');

  try {
    // Trouver un transporteur
    const carrier = await prisma.user.findFirst({
      where: { role: 'CARRIER' }
    });

    if (!carrier) {
      console.log('❌ Aucun transporteur trouvé. Créons-en un...');
      
      const newCarrier = await prisma.user.create({
        data: {
          email: 'carrier@example.com',
          password: '$2b$10$example', // Mot de passe hashé pour "password"
          firstName: 'Jean',
          lastName: 'Transporteur',
          role: 'CARRIER',
          userType: 'PROFESSIONAL',
          companyName: 'Transport Express',
          phoneNumber: '+33123456789'
        }
      });
      
      console.log(`✅ Transporteur créé: ${newCarrier.email}`);
      carrier = newCarrier;
    }

    console.log(`🚚 Utilisation du transporteur: ${carrier.email}\n`);

    // Trajets de test
    const testRides = [
      {
        startLocation: 'Paris, France',
        endLocation: 'Lyon, France',
        startLat: 48.8566,
        startLng: 2.3522,
        endLat: 45.7640,
        endLng: 4.8357,
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
        vehicleType: 'Camionnette',
        availableSeats: 3,
        maxPackageWeight: 50,
        maxPackageSize: 'L',
        pricePerKg: 2.5,
        notes: 'Trajet régulier Paris-Lyon, livraison soignée'
      },
      {
        startLocation: 'Marseille, France',
        endLocation: 'Nice, France',
        startLat: 43.2965,
        startLng: 5.3698,
        endLat: 43.7102,
        endLng: 7.2620,
        departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Après-demain
        vehicleType: 'Voiture',
        availableSeats: 2,
        maxPackageWeight: 20,
        maxPackageSize: 'M',
        pricePerKg: 3.0,
        notes: 'Trajet côte d\'azur, idéal pour petits colis'
      },
      {
        startLocation: 'Lille, France',
        endLocation: 'Strasbourg, France',
        startLat: 50.6292,
        startLng: 3.0573,
        endLat: 48.5734,
        endLng: 7.7521,
        departureTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // Dans 3 jours
        vehicleType: 'Camion',
        availableSeats: 5,
        maxPackageWeight: 100,
        maxPackageSize: 'XL',
        pricePerKg: 2.0,
        notes: 'Grand trajet nord-est, capacité importante'
      },
      {
        startLocation: 'Bordeaux, France',
        endLocation: 'Toulouse, France',
        startLat: 44.8378,
        startLng: -0.5792,
        endLat: 43.6047,
        endLng: 1.4442,
        departureTime: new Date(Date.now() + 96 * 60 * 60 * 1000), // Dans 4 jours
        vehicleType: 'Camionnette',
        availableSeats: 4,
        maxPackageWeight: 75,
        maxPackageSize: 'L',
        pricePerKg: 2.2,
        notes: 'Trajet sud-ouest, transport sécurisé'
      },
      {
        startLocation: 'Nantes, France',
        endLocation: 'Rennes, France',
        startLat: 47.2184,
        startLng: -1.5536,
        endLat: 48.1173,
        endLng: -1.6778,
        departureTime: new Date(Date.now() + 120 * 60 * 60 * 1000), // Dans 5 jours
        vehicleType: 'Voiture',
        availableSeats: 1,
        maxPackageWeight: 15,
        maxPackageSize: 'S',
        pricePerKg: 3.5,
        notes: 'Trajet rapide Bretagne, petits colis uniquement'
      }
    ];

    console.log('📦 Création des trajets...');
    
    for (const rideData of testRides) {
      const ride = await prisma.ride.create({
        data: {
          ...rideData,
          userId: carrier.id,
          status: 'AVAILABLE'
        }
      });
      
      console.log(`   ✅ ${ride.startLocation} → ${ride.endLocation} (${ride.vehicleType})`);
    }

    console.log(`\n🎉 ${testRides.length} trajets créés avec succès !`);

    // Vérification finale
    const totalRides = await prisma.ride.count({
      where: { status: 'AVAILABLE' }
    });
    
    console.log(`📊 Total des trajets disponibles: ${totalRides}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des trajets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRides(); 