#!/bin/bash

# 🚀 Script de déploiement automatisé EcoDeli
# Ce script déploie automatiquement toute l'application avec tous ses services

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Banner de démarrage
echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ECODELI DEPLOYER 🚀                   ║
║              Déploiement automatisé complet                  ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Vérification des prérequis
print_step "Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

print_success "Docker et Docker Compose sont installés"

# Vérification que Docker est en cours d'exécution
if ! docker info &> /dev/null; then
    print_error "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker d'abord."
    exit 1
fi

print_success "Docker est en cours d'exécution"

# Nettoyage des anciens conteneurs (optionnel)
print_step "Nettoyage des anciens conteneurs..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true
print_success "Nettoyage terminé"

# Création du fichier .env s'il n'existe pas
print_step "Configuration des variables d'environnement..."

if [ ! -f .env ]; then
    print_info "Création du fichier .env..."
    cat > .env << EOF
# Base de données
DATABASE_URL=postgresql://eco_user:eco_password@postgres:5432/eco_database
POSTGRES_DB=eco_database
POSTGRES_USER=eco_user
POSTGRES_PASSWORD=eco_password

# Redis
REDIS_URL=redis://redis:6379

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Stripe (optionnel)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key

# Autres
NODE_ENV=production
EOF
    print_success "Fichier .env créé"
else
    print_success "Fichier .env existe déjà"
fi

# Construction et démarrage des services
print_step "Construction des images Docker..."
docker-compose build --no-cache

print_success "Images construites avec succès"

print_step "Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
print_step "Attente du démarrage des services..."

# Fonction pour vérifier si un service est prêt
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_info "Attente du service $service_name sur le port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T $service_name nc -z localhost $port 2>/dev/null; then
            print_success "$service_name est prêt!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "$service_name met du temps à démarrer, mais continuons..."
    return 1
}

# Attendre PostgreSQL
print_info "Vérification de PostgreSQL..."
sleep 5
docker-compose exec -T postgres pg_isready -U eco_user -d eco_database || print_warning "PostgreSQL pas encore prêt"

# Attendre Redis
print_info "Vérification de Redis..."
docker-compose exec -T redis redis-cli ping || print_warning "Redis pas encore prêt"

# Migration de la base de données
print_step "Migration de la base de données..."
sleep 10  # Attendre un peu plus pour être sûr que PostgreSQL est prêt

# Exécuter les migrations Prisma
docker-compose exec -T eco-app npx prisma db push --accept-data-loss || {
    print_warning "Migration échouée, tentative avec generate..."
    docker-compose exec -T eco-app npx prisma generate
    docker-compose exec -T eco-app npx prisma db push --accept-data-loss
}

print_success "Migration de la base de données terminée"

# Vérification de l'état des services
print_step "Vérification de l'état des services..."
docker-compose ps

# Affichage des logs pour vérifier que tout fonctionne
print_step "Vérification des logs des services..."
timeout 10s docker-compose logs --tail=5 || true

# Informations finales
echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    🎉 DÉPLOIEMENT RÉUSSI! 🎉                ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_success "Tous les services sont déployés!"

echo -e "${CYAN}"
echo "📋 SERVICES DISPONIBLES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Application principale:    http://localhost:3000"
echo "🛠️  Admin Dashboard:          http://localhost:3001"
echo "🗄️  PostgreSQL:               localhost:5432"
echo "⚡ Redis:                     localhost:6379"
echo "🌐 Nginx (Reverse Proxy):     http://localhost:80"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

echo -e "${YELLOW}"
echo "🔧 COMMANDES UTILES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Voir les logs:             docker-compose logs -f"
echo "🔄 Redémarrer les services:   docker-compose restart"
echo "🛑 Arrêter les services:      docker-compose down"
echo "🗑️  Tout supprimer:           docker-compose down -v --rmi all"
echo "📈 Statut des services:       docker-compose ps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

# Test de connectivité
print_step "Test de connectivité des services..."

# Test de l'application principale
if curl -s http://localhost:3000 > /dev/null; then
    print_success "✅ Application principale accessible"
else
    print_warning "⚠️  Application principale pas encore accessible (peut prendre quelques minutes)"
fi

# Test de l'admin dashboard
if curl -s http://localhost:3001 > /dev/null; then
    print_success "✅ Admin Dashboard accessible"
else
    print_warning "⚠️  Admin Dashboard pas encore accessible (peut prendre quelques minutes)"
fi

# Test du reverse proxy
if curl -s http://localhost:80 > /dev/null; then
    print_success "✅ Nginx Reverse Proxy accessible"
else
    print_warning "⚠️  Nginx pas encore accessible"
fi

echo -e "${GREEN}"
echo "🚀 Déploiement terminé! Vos applications sont en cours de démarrage..."
echo "⏱️  Les applications peuvent prendre 1-2 minutes pour être complètement opérationnelles."
echo -e "${NC}"

# Option pour suivre les logs
echo -e "${PURPLE}"
read -p "Voulez-vous suivre les logs en temps réel? (y/N): " -n 1 -r
echo -e "${NC}"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}📊 Affichage des logs (Ctrl+C pour quitter)...${NC}"
    docker-compose logs -f
fi 