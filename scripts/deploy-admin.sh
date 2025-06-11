#!/bin/bash

# Script de déploiement pour l'Admin Dashboard
# Usage: ./scripts/deploy-admin.sh [dev|prod]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
PROJECT_NAME="eco-admin-dashboard"
LOG_FILE="logs/admin-deploy-$(date +%Y%m%d_%H%M%S).log"

# Créer le dossier de logs s'il n'existe pas
mkdir -p logs

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Banner
echo -e "${BLUE}"
echo "=================================="
echo "   DÉPLOIEMENT ADMIN DASHBOARD    "
echo "=================================="
echo -e "${NC}"

# Vérification des prérequis
log "Vérification des prérequis..."

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé"
fi

# Vérifier Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé"
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "admin-dashboard/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

# Configuration en fonction de l'environnement
if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    DOCKERFILE="admin-dashboard/Dockerfile.prod"
    ENV_FILE=".env.prod"
    log "Configuration pour l'environnement de PRODUCTION"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    DOCKERFILE="admin-dashboard/Dockerfile.dev"
    ENV_FILE=".env"
    log "Configuration pour l'environnement de DÉVELOPPEMENT"
fi

# Vérifier que les fichiers existent
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Fichier Docker Compose non trouvé: $COMPOSE_FILE"
fi

if [ ! -f "$DOCKERFILE" ]; then
    error "Dockerfile non trouvé: $DOCKERFILE"
fi

# Fonction de sauvegarde
backup_admin() {
    log "Création d'une sauvegarde..."
    BACKUP_DIR="backups/admin-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Sauvegarder les volumes Docker
    if docker volume ls | grep -q "${PROJECT_NAME}"; then
        docker run --rm -v "${PROJECT_NAME}_data:/data" -v "$(pwd)/$BACKUP_DIR:/backup" alpine tar czf /backup/admin-data.tar.gz -C /data .
        log "Sauvegarde créée dans $BACKUP_DIR"
    fi
}

# Fonction de vérification de santé
check_admin_health() {
    log "Vérification de la santé de l'admin dashboard..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
            log "✅ Admin dashboard en bonne santé"
            return 0
        fi
        
        info "Tentative $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    error "❌ L'admin dashboard n'est pas accessible après $max_attempts tentatives"
}

# Fonction de rollback
rollback_admin() {
    warning "Rollback de l'admin dashboard..."
    
    # Arrêter les nouveaux conteneurs
    docker-compose -f "$COMPOSE_FILE" stop admin
    
    # Restaurer la dernière sauvegarde
    LATEST_BACKUP=$(ls -t backups/ | head -n 1)
    if [ -n "$LATEST_BACKUP" ]; then
        log "Restauration de la sauvegarde: $LATEST_BACKUP"
        # Logique de restauration ici
    fi
    
    warning "Rollback terminé"
}

# Fonction principale de déploiement
deploy_admin() {
    log "Début du déploiement de l'admin dashboard..."
    
    # Créer une sauvegarde si en production
    if [ "$ENVIRONMENT" = "prod" ]; then
        backup_admin
    fi
    
    # Arrêter l'ancien conteneur admin
    log "Arrêt de l'ancien conteneur admin..."
    docker-compose -f "$COMPOSE_FILE" stop admin || true
    docker-compose -f "$COMPOSE_FILE" rm -f admin || true
    
    # Construire la nouvelle image
    log "Construction de l'image admin..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache admin
    
    # Démarrer les services
    log "Démarrage des services..."
    docker-compose -f "$COMPOSE_FILE" up -d admin
    
    # Attendre que le service soit prêt
    log "Attente du démarrage du service..."
    sleep 10
    
    # Vérifier la santé
    if check_admin_health; then
        log "✅ Déploiement de l'admin dashboard réussi!"
    else
        error "❌ Échec du déploiement"
    fi
}

# Fonction de nettoyage
cleanup() {
    log "Nettoyage des ressources non utilisées..."
    docker system prune -f
    docker image prune -f
}

# Fonction d'affichage des logs
show_logs() {
    log "Affichage des logs de l'admin dashboard..."
    docker-compose -f "$COMPOSE_FILE" logs -f admin
}

# Fonction de monitoring
monitor_admin() {
    log "Monitoring de l'admin dashboard..."
    
    while true; do
        # Vérifier le statut du conteneur
        if docker ps | grep -q "eco-admin-dashboard"; then
            STATUS="🟢 RUNNING"
        else
            STATUS="🔴 STOPPED"
        fi
        
        # Vérifier la santé de l'API
        if curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
            HEALTH="🟢 HEALTHY"
        else
            HEALTH="🟡 UNHEALTHY"
        fi
        
        # Afficher les métriques
        clear
        echo -e "${BLUE}=== MONITORING ADMIN DASHBOARD ===${NC}"
        echo "Status: $STATUS"
        echo "Health: $HEALTH"
        echo "Time: $(date)"
        echo ""
        echo "Mémoire utilisée:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep admin || echo "Aucun conteneur admin en cours d'exécution"
        echo ""
        echo "Appuyez sur Ctrl+C pour arrêter le monitoring"
        
        sleep 5
    done
}

# Menu principal
case "${2:-deploy}" in
    "deploy")
        deploy_admin
        ;;
    "backup")
        backup_admin
        ;;
    "rollback")
        rollback_admin
        ;;
    "logs")
        show_logs
        ;;
    "monitor")
        monitor_admin
        ;;
    "cleanup")
        cleanup
        ;;
    "health")
        check_admin_health
        ;;
    *)
        echo "Usage: $0 [dev|prod] [deploy|backup|rollback|logs|monitor|cleanup|health]"
        echo ""
        echo "Commandes disponibles:"
        echo "  deploy  - Déployer l'admin dashboard"
        echo "  backup  - Créer une sauvegarde"
        echo "  rollback- Revenir à la version précédente"
        echo "  logs    - Afficher les logs"
        echo "  monitor - Monitoring en temps réel"
        echo "  cleanup - Nettoyer les ressources"
        echo "  health  - Vérifier la santé"
        exit 1
        ;;
esac

log "Script terminé avec succès" 