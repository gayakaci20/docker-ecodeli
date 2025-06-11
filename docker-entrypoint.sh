#!/bin/sh

# Script d'entrée pour les migrations Prisma

echo "🚀 Démarrage des migrations Prisma..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
until npx prisma db push --accept-data-loss 2>/dev/null; do
  echo "Base de données non prête, attente de 2 secondes..."
  sleep 2
done

echo "✅ Base de données prête!"

# Exécuter les migrations
echo "🔄 Exécution des migrations..."
npx prisma migrate deploy

# Optionnel: seeder la base de données
if [ -f "prisma/seed.ts" ]; then
  echo "🌱 Seeding de la base de données..."
  npx prisma db seed
fi

echo "✅ Migrations terminées avec succès!"

# Migrations pour le dashboard admin
echo "🔄 Migrations pour le dashboard admin..."
cd /app/admin-dashboard
if [ -f "prisma/schema.prisma" ]; then
  npx prisma migrate deploy
  echo "✅ Migrations admin terminées!"
fi

echo "🎉 Toutes les migrations sont terminées!" 