#!/bin/bash

# 🛑 Script d'arrêt automatisé EcoDeli
# Ce script arrête tous les services Docker proprement

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
echo -e "${RED}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    🛑 ECODELI STOPPER 🛑                    ║
║               Arrêt automatisé des services                  ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Menu d'options
echo -e "${CYAN}"
echo "Choisissez une option d'arrêt:"
echo "1) 🔄 Arrêt simple (redémarrage possible)"
echo "2) 🗑️  Arrêt complet avec suppression des volumes"
echo "3) 🧹 Nettoyage complet (tout supprimer)"
echo "4) 📊 Voir le statut des services"
echo "5) ❌ Annuler"
echo -e "${NC}"

read -p "Votre choix (1-5): " choice

case $choice in
    1)
        print_step "Arrêt simple des services..."
        docker-compose down
        print_success "Services arrêtés. Utilisez 'docker-compose up -d' pour redémarrer."
        ;;
    2)
        print_step "Arrêt complet avec suppression des volumes..."
        docker-compose down -v
        print_success "Services arrêtés et volumes supprimés."
        ;;
    3)
        print_warning "⚠️  ATTENTION: Cette action va supprimer TOUTES les données!"
        read -p "Êtes-vous sûr? (tapez 'OUI' pour confirmer): " confirm
        if [ "$confirm" = "OUI" ]; then
            print_step "Nettoyage complet en cours..."
            docker-compose down -v --rmi all --remove-orphans
            docker system prune -af --volumes
            print_success "Nettoyage complet terminé."
        else
            print_info "Opération annulée."
        fi
        ;;
    4)
        print_step "Statut des services..."
        docker-compose ps
        echo ""
        print_info "Images Docker:"
        docker images | grep -E "(eco-front|admin-dashboard|postgres|redis|nginx)"
        ;;
    5)
        print_info "Opération annulée."
        exit 0
        ;;
    *)
        print_error "Option invalide."
        exit 1
        ;;
esac

echo -e "${GREEN}"
echo "🏁 Opération terminée!"
echo -e "${NC}" 