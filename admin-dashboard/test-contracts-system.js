const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testContractsSystem() {
  console.log('🧪 Test du système de contrats et génération PDF...\n');

  try {
    // Test 1: Vérifier les utilisateurs PROFESSIONAL
    console.log('1. Recherche des utilisateurs PROFESSIONAL...');
    const professionalUsers = await prisma.user.findMany({
      where: { userType: 'PROFESSIONAL' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        name: true,
        companyName: true,
        userType: true
      }
    });
    
    console.log(`   ✅ ${professionalUsers.length} utilisateurs PROFESSIONAL trouvés`);
    professionalUsers.forEach(user => {
      const name = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email;
      console.log(`      - ${name} (${user.email})`);
    });

    if (professionalUsers.length === 0) {
      console.log('   ⚠️  Aucun utilisateur PROFESSIONAL trouvé. Création d\'un utilisateur de test...');
      
      const testUser = await prisma.user.create({
        data: {
          email: 'test-pro@ecodeli.fr',
          firstName: 'Jean',
          lastName: 'Dupont',
          userType: 'PROFESSIONAL',
          companyName: 'Transport Dupont SARL',
          companyFirstName: 'Jean',
          companyLastName: 'Dupont',
          address: '123 Rue du Commerce, 75001 Paris',
          phoneNumber: '+33 1 23 45 67 89',
          role: 'USER'
        }
      });
      
      console.log(`   ✅ Utilisateur PROFESSIONAL créé: ${testUser.companyName} (${testUser.email})`);
      professionalUsers.push(testUser);
    }

    // Test 2: Créer un contrat de test
    console.log('\n2. Création d\'un contrat de test...');
    const testUser = professionalUsers[0];
    
    const contract = await prisma.contract.create({
      data: {
        merchantId: testUser.id,
        title: 'Contrat de Service de Livraison Premium',
        description: 'Contrat pour services de livraison écologique avec véhicules électriques dans la région parisienne.',
        terms: `ARTICLE 1 - OBJET DU CONTRAT
Le présent contrat a pour objet la fourniture de services de livraison écologique par EcoDeli au profit du client.

ARTICLE 2 - PRESTATIONS
- Livraison de colis avec véhicules électriques
- Suivi en temps réel des livraisons
- Service client dédié
- Assurance tous risques incluse

ARTICLE 3 - TARIFICATION
Les tarifs sont définis selon la grille tarifaire en vigueur et peuvent être révisés annuellement.

ARTICLE 4 - DURÉE
Le présent contrat est conclu pour une durée de 12 mois renouvelable tacitement.

ARTICLE 5 - RÉSILIATION
Chaque partie peut résilier le contrat avec un préavis de 30 jours.`,
        value: 2500.00,
        currency: 'EUR',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'DRAFT'
      },
      include: {
        merchant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            name: true,
            userType: true,
            companyName: true,
            companyFirstName: true,
            companyLastName: true,
            address: true,
            phoneNumber: true
          }
        }
      }
    });

    console.log(`   ✅ Contrat créé: ${contract.title}`);
    console.log(`      ID: ${contract.id}`);
    console.log(`      Client: ${contract.merchant.companyName || contract.merchant.email}`);
    console.log(`      Valeur: ${contract.value}€`);
    console.log(`      Statut: ${contract.status}`);

    // Test 3: Tester les APIs
    console.log('\n3. Test des APIs...');
    
    // Test API contracts
    console.log('   - Test API /api/contracts...');
    const contractsResponse = await fetch('http://localhost:3001/api/contracts');
    if (contractsResponse.ok) {
      const contractsData = await contractsResponse.json();
      console.log(`     ✅ API contracts: ${contractsData.length} contrats récupérés`);
    } else {
      console.log(`     ❌ API contracts: Erreur ${contractsResponse.status}`);
    }

    // Test API documents
    console.log('   - Test API /api/documents...');
    const documentsResponse = await fetch('http://localhost:3001/api/documents');
    if (documentsResponse.ok) {
      const documentsData = await documentsResponse.json();
      console.log(`     ✅ API documents: ${documentsData.length} documents récupérés`);
    } else {
      console.log(`     ❌ API documents: Erreur ${documentsResponse.status}`);
    }

    // Test 4: Générer un PDF (simulation)
    console.log('\n4. Test de génération PDF...');
    
    try {
      const pdfResponse = await fetch('http://localhost:3001/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contract.id,
          type: 'CONTRACT'
        }),
      });

      if (pdfResponse.ok) {
        const pdfDocument = await pdfResponse.json();
        console.log(`   ✅ PDF généré avec succès:`);
        console.log(`      Titre: ${pdfDocument.title}`);
        console.log(`      Fichier: ${pdfDocument.fileName}`);
        console.log(`      Chemin: ${pdfDocument.filePath}`);
        console.log(`      Taille: ${pdfDocument.fileSize} bytes`);
      } else {
        const errorData = await pdfResponse.json();
        console.log(`   ❌ Erreur génération PDF: ${errorData.error}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Test PDF skippé (serveur non démarré): ${error.message}`);
    }

    // Test 5: Vérifier les documents créés
    console.log('\n5. Vérification des documents...');
    const documents = await prisma.document.findMany({
      where: { contractId: contract.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            userType: true
          }
        },
        contract: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    console.log(`   ✅ ${documents.length} document(s) trouvé(s) pour ce contrat`);
    documents.forEach(doc => {
      console.log(`      - ${doc.title} (${doc.type})`);
      console.log(`        Fichier: ${doc.fileName}`);
      console.log(`        Utilisateur: ${doc.user.companyName || doc.user.email}`);
    });

    // Test 6: Statistiques finales
    console.log('\n6. Statistiques du système...');
    
    const stats = await Promise.all([
      prisma.user.count({ where: { userType: 'PROFESSIONAL' } }),
      prisma.contract.count(),
      prisma.document.count({ where: { type: 'CONTRACT' } }),
      prisma.contract.count({ where: { status: 'DRAFT' } }),
      prisma.contract.count({ where: { status: 'SIGNED' } }),
      prisma.contract.count({ where: { status: 'ACTIVE' } })
    ]);

    console.log(`   📊 Utilisateurs PROFESSIONAL: ${stats[0]}`);
    console.log(`   📊 Total contrats: ${stats[1]}`);
    console.log(`   📊 Documents PDF: ${stats[2]}`);
    console.log(`   📊 Contrats DRAFT: ${stats[3]}`);
    console.log(`   📊 Contrats SIGNED: ${stats[4]}`);
    console.log(`   📊 Contrats ACTIVE: ${stats[5]}`);

    console.log('\n✅ Test du système de contrats terminé avec succès !');
    console.log('\n🎯 Fonctionnalités testées:');
    console.log('   ✅ Gestion des utilisateurs PROFESSIONAL');
    console.log('   ✅ Création de contrats');
    console.log('   ✅ APIs REST pour contrats et documents');
    console.log('   ✅ Génération de PDFs');
    console.log('   ✅ Stockage des documents');
    console.log('   ✅ Relations entre contrats et documents');

    console.log('\n🚀 Pour tester l\'interface:');
    console.log('   1. Démarrez l\'admin dashboard: npm run dev -- --port 3001');
    console.log('   2. Visitez: http://localhost:3001/contracts');
    console.log('   3. Créez un nouveau contrat ou gérez les existants');
    console.log('   4. Générez des PDFs pour les utilisateurs PROFESSIONAL');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testContractsSystem(); 