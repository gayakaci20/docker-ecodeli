const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMatchSystem() {
  console.log('🧪 Test du système de matches...\n');

  try {
    // 1. Vérifier les utilisateurs existants
    console.log('1. Vérification des utilisateurs...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`   ✅ ${users.length} utilisateurs trouvés`);
    
    const carriers = users.filter(u => u.role === 'CARRIER');
    const senders = users.filter(u => u.role === 'SENDER');
    
    console.log(`   📦 ${senders.length} expéditeurs`);
    console.log(`   🚚 ${carriers.length} transporteurs\n`);

    // 2. Vérifier les colis disponibles
    console.log('2. Vérification des colis disponibles...');
    const availablePackages = await prisma.package.findMany({
      where: {
        status: 'PENDING',
        matches: {
          none: {
            status: {
              in: ['ACCEPTED_BY_SENDER', 'CONFIRMED']
            }
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log(`   ✅ ${availablePackages.length} colis disponibles`);
    availablePackages.forEach(pkg => {
      console.log(`   📦 "${pkg.title}" par ${pkg.user.email}`);
    });
    console.log();

    // 3. Vérifier les trajets disponibles
    console.log('3. Vérification des trajets disponibles...');
    const availableRides = await prisma.ride.findMany({
      where: {
        status: 'AVAILABLE'
      },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log(`   ✅ ${availableRides.length} trajets disponibles`);
    availableRides.forEach(ride => {
      console.log(`   🚗 ${ride.startLocation} → ${ride.endLocation} par ${ride.user.email}`);
    });
    console.log();

    // 4. Vérifier les matches existants
    console.log('4. Vérification des matches...');
    const matches = await prisma.match.findMany({
      include: {
        package: {
          include: {
            user: {
              select: {
                email: true,
                role: true
              }
            }
          }
        },
        ride: {
          include: {
            user: {
              select: {
                email: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    console.log(`   ✅ ${matches.length} matches trouvés`);
    
    const matchesByStatus = matches.reduce((acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(matchesByStatus).forEach(([status, count]) => {
      console.log(`   📊 ${status}: ${count}`);
    });
    console.log();

    // 5. Créer un match de test si possible
    if (availablePackages.length > 0 && availableRides.length > 0) {
      console.log('5. Test de création de match...');
      
      const testPackage = availablePackages[0];
      const testRide = availableRides.find(ride => 
        ride.user.email !== testPackage.user.email
      );
      
      if (testRide) {
        try {
          const newMatch = await prisma.match.create({
            data: {
              packageId: testPackage.id,
              rideId: testRide.id,
              proposedByUserId: testRide.userId,
              price: 25.0,
              status: 'PROPOSED'
            },
            include: {
              package: {
                include: {
                  user: {
                    select: {
                      email: true
                    }
                  }
                }
              },
              ride: {
                include: {
                  user: {
                    select: {
                      email: true
                    }
                  }
                }
              }
            }
          });
          
          console.log(`   ✅ Match créé avec succès !`);
          console.log(`   📦 Colis: "${newMatch.package.title}" (${newMatch.package.user.email})`);
          console.log(`   🚗 Trajet: ${newMatch.ride.startLocation} → ${newMatch.ride.endLocation} (${newMatch.ride.user.email})`);
          console.log(`   💰 Prix proposé: ${newMatch.price}€`);
          console.log(`   📊 Statut: ${newMatch.status}\n`);
          
          // Test d'acceptation du match
          console.log('6. Test d\'acceptation du match...');
          const acceptedMatch = await prisma.match.update({
            where: { id: newMatch.id },
            data: { status: 'ACCEPTED_BY_SENDER' }
          });
          
          console.log(`   ✅ Match accepté ! Nouveau statut: ${acceptedMatch.status}\n`);
          
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`   ⚠️  Match déjà existant entre ce colis et ce trajet\n`);
          } else {
            throw error;
          }
        }
      } else {
        console.log(`   ⚠️  Impossible de créer un match de test (pas de trajet compatible)\n`);
      }
    } else {
      console.log('5. ⚠️  Pas assez de données pour créer un match de test\n');
    }

    // 6. Résumé final
    console.log('📊 RÉSUMÉ DU SYSTÈME:');
    console.log(`   👥 Utilisateurs: ${users.length} (${senders.length} expéditeurs, ${carriers.length} transporteurs)`);
    console.log(`   📦 Colis disponibles: ${availablePackages.length}`);
    console.log(`   🚗 Trajets disponibles: ${availableRides.length}`);
    console.log(`   🤝 Matches: ${matches.length}`);
    console.log('\n✅ Test terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMatchSystem(); 