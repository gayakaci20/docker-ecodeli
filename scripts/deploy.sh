#!/bin/bash

# 🚀 Script de déploiement automatisé pour ECO-FRONT
# Usage: ./scripts/deploy.sh [environment] [action]
# Exemples: 
#   ./scripts/deploy.sh local start
#   ./scripts/deploy.sh production deploy
#   ./scripts/deploy.sh staging rollback

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Variables par défaut
ENVIRONMENT=${1:-local}
ACTION=${2:-deploy}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$TIMESTAMP"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

create_backup() {
    log_info "Création de la sauvegarde..."
    mkdir -p "$BACKUP_DIR"
    
    # Sauvegarde de la base de données si elle existe
    if docker ps --format "table {{.Names}}" | grep -q "eco-postgres"; then
        docker exec eco-postgres pg_dump -U postgres eco_db > "$BACKUP_DIR/database_backup.sql" 2>/dev/null || {
            log_warning "Impossible de sauvegarder la base de données (normale lors du premier déploiement)"
        }
    fi
    
    # Sauvegarde de la configuration
    cp .env.* "$BACKUP_DIR/" 2>/dev/null || true
    
    log_success "Sauvegarde créée dans $BACKUP_DIR"
}

deploy_local() {
    log_info "Déploiement en environnement local..."
    
    # Vérifier le fichier de configuration
    if [ ! -f ".env.docker" ]; then
        log_warning "Fichier .env.docker non trouvé, création d'un fichier par défaut..."
        cp .env.docker.example .env.docker 2>/dev/null || {
            log_error "Fichier .env.docker.example non trouvé. Veuillez créer .env.docker manuellement."
            exit 1
        }
    fi
    
    # Arrêter les conteneurs existants
    docker-compose -f docker-compose.dev.yml down --remove-orphans || true
    
    # Construire et démarrer
    log_info "Construction et démarrage des conteneurs..."
    docker-compose -f docker-compose.dev.yml up --build -d
    
    # Attendre que les services soient prêts
    log_info "Attente du démarrage des services..."
    sleep 30
    
    # Exécuter les migrations
    log_info "Exécution des migrations de base de données..."
    docker exec eco-front-app npx prisma migrate deploy || {
        log_warning "Échec des migrations, tentative de création de la base de données..."
        docker exec eco-postgres psql -U postgres -c "CREATE DATABASE eco_db;" || true
        sleep 5
        docker exec eco-front-app sh -c 'echo -e "DATABASE_URL=postgresql://postgres:password@eco-postgres:5432/eco_db\nDIRECT_URL=postgresql://postgres:password@eco-postgres:5432/eco_db" > .env'
        docker exec eco-front-app npx prisma migrate deploy
    }
    
    # Test de santé
    health_check "http://localhost:3000"
}

deploy_production() {
    log_info "Déploiement en environnement de production..."
    
    # Vérifications de sécurité
    if [ ! -f ".env.prod" ]; then
        log_error "Fichier .env.prod requis pour la production"
        exit 1
    fi
    
    # Vérifier que les variables critiques sont définies
    source .env.prod
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_jwt_secret_key_here_change_in_production" ]; then
        log_error "JWT_SECRET doit être défini avec une valeur sécurisée en production"
        exit 1
    fi
    
    if [ -z "$STRIPE_SECRET_KEY" ] || [[ "$STRIPE_SECRET_KEY" == *"fallback"* ]]; then
        log_error "STRIPE_SECRET_KEY doit être défini avec une vraie clé en production"
        exit 1
    fi
    
    # Sauvegarde avant déploiement
    create_backup
    
    # Construction de l'image de production
    log_info "Construction de l'image de production..."
    docker build -f Dockerfile.prod -t eco-front:latest .
    
    # Déploiement
    log_info "Déploiement en production..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    # Migrations
    log_info "Exécution des migrations..."
    sleep 30
    docker exec eco-front-app-prod npx prisma migrate deploy
    
    # Test de santé
    health_check "http://localhost:3000"
}

health_check() {
    local url=$1
    log_info "Vérification de la santé de l'application..."
    
    for i in {1..10}; do
        if curl -f -s "$url" > /dev/null; then
            log_success "Application accessible sur $url"
            return 0
        fi
        log_info "Tentative $i/10 - En attente..."
        sleep 10
    done
    
    log_error "Application non accessible après 100 secondes"
    return 1
}

rollback() {
    log_warning "Démarrage du rollback..."
    
    # Trouver la dernière sauvegarde
    latest_backup=$(ls -t ./backups/ | head -n 1)
    if [ -z "$latest_backup" ]; then
        log_error "Aucune sauvegarde trouvée"
        exit 1
    fi
    
    log_info "Rollback vers la sauvegarde: $latest_backup"
    
    # Arrêter les conteneurs actuels
    docker-compose -f docker-compose.${ENVIRONMENT}.yml down
    
    # Restaurer la base de données
    if [ -f "./backups/$latest_backup/database_backup.sql" ]; then
        log_info "Restauration de la base de données..."
        docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d postgres
        sleep 10
        docker exec -i eco-postgres psql -U postgres eco_db < "./backups/$latest_backup/database_backup.sql"
    fi
    
    # Redémarrer l'application
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
    
    log_success "Rollback terminé"
}

cleanup() {
    log_info "Nettoyage des ressources inutilisées..."
    docker image prune -f
    docker volume prune -f
    log_success "Nettoyage terminé"
}

show_status() {
    log_info "État des conteneurs:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    log_info "Utilisation des ressources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

show_logs() {
    local service=${3:-app}
    log_info "Logs du service $service:"
    docker-compose -f docker-compose.${ENVIRONMENT}.yml logs --tail=50 -f "$service"
}

show_help() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environnements:"
    echo "  local      - Déploiement local (défaut)"
    echo "  production - Déploiement production"
    echo "  staging    - Déploiement staging"
    echo ""
    echo "Actions:"
    echo "  deploy     - Déployer l'application (défaut)"
    echo "  start      - Démarrer les conteneurs existants"
    echo "  stop       - Arrêter les conteneurs"
    echo "  restart    - Redémarrer les conteneurs"
    echo "  rollback   - Effectuer un rollback"
    echo "  status     - Afficher l'état des conteneurs"
    echo "  logs       - Afficher les logs"
    echo "  cleanup    - Nettoyer les ressources Docker"
    echo "  backup     - Créer une sauvegarde"
    echo "  help       - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 local start"
    echo "  $0 production deploy"
    echo "  $0 local logs"
}

# Menu principal
case $ACTION in
    "deploy")
        check_prerequisites
        case $ENVIRONMENT in
            "local")
                deploy_local
                ;;
            "production")
                deploy_production
                ;;
            *)
                log_error "Environnement non supporté: $ENVIRONMENT"
                exit 1
                ;;
        esac
        ;;
    "start")
        log_info "Démarrage des conteneurs..."
        docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
        health_check "http://localhost:3000"
        ;;
    "stop")
        log_info "Arrêt des conteneurs..."
        docker-compose -f docker-compose.${ENVIRONMENT}.yml down
        log_success "Conteneurs arrêtés"
        ;;
    "restart")
        log_info "Redémarrage des conteneurs..."
        docker-compose -f docker-compose.${ENVIRONMENT}.yml restart
        health_check "http://localhost:3000"
        ;;
    "rollback")
        rollback
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "cleanup")
        cleanup
        ;;
    "backup")
        create_backup
        ;;
    "help")
        show_help
        ;;
    *)
        log_error "Action non reconnue: $ACTION"
        show_help
        exit 1
        ;;
esac

log_success "Opération '$ACTION' terminée avec succès !" 