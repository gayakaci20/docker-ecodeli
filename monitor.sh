#!/bin/bash

# 📊 Script de monitoring ecodeli
# Ce script surveille l'état de tous les services Docker

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_header() {
    echo -e "${PURPLE}$1${NC}"
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

# Fonction pour vérifier si un service est en cours d'exécution
check_service() {
    local service_name=$1
    local port=$2
    
    if docker-compose ps | grep -q "$service_name.*Up"; then
        if nc -z localhost $port 2>/dev/null; then
            print_success "$service_name (Port $port) - Service actif et accessible"
        else
            print_warning "$service_name (Port $port) - Service actif mais port inaccessible"
        fi
    else
        print_error "$service_name (Port $port) - Service arrêté"
    fi
}

# Fonction pour vérifier la connectivité HTTP
check_http() {
    local url=$1
    local service_name=$2
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        print_success "$service_name - HTTP accessible ($url)"
    else
        print_error "$service_name - HTTP inaccessible ($url)"
    fi
}

# Banner
clear
echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                   📊 ECODELI MONITOR 📊                     ║
║              Surveillance des services Docker                ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Vérification que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé!"
    exit 1
fi

# Affichage de l'état général
print_header "🔍 ÉTAT GÉNÉRAL DES SERVICES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose ps
echo ""

# Vérification détaillée de chaque service
print_header "🔧 VÉRIFICATION DÉTAILLÉE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# PostgreSQL
check_service "postgres" "5432"

# Redis
check_service "redis" "6379"

# Application principale
check_service "eco-app" "3000"

# Admin Dashboard
check_service "admin-dashboard" "3001"

# Nginx
check_service "nginx" "80"

echo ""

# Tests de connectivité HTTP
print_header "🌐 TESTS DE CONNECTIVITÉ HTTP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_http "http://localhost:3000" "Application principale"
check_http "http://localhost:3001" "Admin Dashboard"
check_http "http://localhost:80" "Nginx Reverse Proxy"

echo ""

# Utilisation des ressources
print_header "💾 UTILISATION DES RESSOURCES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""

# Logs récents (dernières erreurs)
print_header "📋 LOGS RÉCENTS (ERREURS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker-compose logs --tail=10 | grep -i error || print_info "Aucune erreur récente trouvée"

echo ""

# Volumes Docker
print_header "💽 VOLUMES DOCKER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker volume ls | grep eco || print_info "Aucun volume EcoDeli trouvé"

echo ""

# Résumé final
print_header "📊 RÉSUMÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Compter les services actifs
RUNNING_SERVICES=$(docker-compose ps | grep "Up" | wc -l)
TOTAL_SERVICES=5

if [ $RUNNING_SERVICES -eq $TOTAL_SERVICES ]; then
    print_success "Tous les services sont opérationnels ($RUNNING_SERVICES/$TOTAL_SERVICES)"
elif [ $RUNNING_SERVICES -gt 0 ]; then
    print_warning "Certains services sont en cours d'exécution ($RUNNING_SERVICES/$TOTAL_SERVICES)"
else
    print_error "Aucun service n'est en cours d'exécution"
fi

echo ""
print_info "Dernière vérification: $(date)"

# Option pour surveillance continue
echo ""
echo -e "${YELLOW}Options disponibles:${NC}"
echo "1) Surveiller en continu (rafraîchissement toutes les 30s)"
echo "2) Voir les logs en temps réel"
echo "3) Quitter"

read -p "Votre choix (1-3): " choice

case $choice in
    1)
        echo -e "${CYAN}📊 Surveillance continue activée (Ctrl+C pour quitter)...${NC}"
        while true; do
            sleep 30
            clear
            $0  # Relancer le script
        done
        ;;
    2)
        echo -e "${CYAN}📊 Affichage des logs en temps réel (Ctrl+C pour quitter)...${NC}"
        docker-compose logs -f
        ;;
    3)
        print_info "Surveillance terminée."
        ;;
    *)
        print_info "Option invalide. Surveillance terminée."
        ;;
esac 