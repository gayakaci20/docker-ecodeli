# 🚀 Guide de Déploiement ecodeli

## 📋 Vue d'ensemble

Ce guide vous explique comment déployer rapidement toute l'application ecodeli avec Docker en utilisant les scripts automatisés.

## 🛠️ Scripts Disponibles

### 1. `deploy-full.sh` - Déploiement Complet
**Usage :** `./deploy-full.sh`

**Ce que fait ce script :**
- ✅ Vérifie les prérequis (Docker, Docker Compose)
- ✅ Nettoie les anciens conteneurs
- ✅ Crée le fichier `.env` automatiquement
- ✅ Construit toutes les images Docker
- ✅ Lance tous les services (PostgreSQL, Redis, App, Admin, Nginx)
- ✅ Exécute les migrations de base de données
- ✅ Teste la connectivité des services
- ✅ Affiche les URLs d'accès

### 2. `stop-all.sh` - Arrêt des Services
**Usage :** `./stop-all.sh`

**Options disponibles :**
- 🔄 Arrêt simple (redémarrage possible)
- 🗑️ Arrêt complet avec suppression des volumes
- 🧹 Nettoyage complet (tout supprimer)
- 📊 Voir le statut des services

### 3. `monitor.sh` - Surveillance des Services
**Usage :** `./monitor.sh`

**Fonctionnalités :**
- 📊 État général des services
- 🔧 Vérification détaillée de chaque service
- 🌐 Tests de connectivité HTTP
- 💾 Utilisation des ressources
- 📋 Logs récents et erreurs
- 🔄 Surveillance continue

## 🚀 Déploiement Rapide

### Étape 1 : Préparation
```bash
# Cloner le projet (si pas déjà fait)
git clone <votre-repo>
cd eco-front

# Vérifier que Docker est installé et en cours d'exécution
docker --version
docker-compose --version
```

### Étape 2 : Déploiement
```bash
# Lancer le déploiement complet
./deploy-full.sh
```

### Étape 3 : Vérification
```bash
# Surveiller les services
./monitor.sh
```

## 🌐 URLs d'Accès

Une fois le déploiement terminé, vos services seront accessibles sur :

| Service | URL | Description |
|---------|-----|-------------|
| **Application Principale** | http://localhost:3000 | Interface utilisateur |
| **Admin Dashboard** | http://localhost:3001 | Interface d'administration |
| **Nginx (Reverse Proxy)** | http://localhost:80 | Point d'entrée principal |
| **PostgreSQL** | localhost:5432 | Base de données |
| **Redis** | localhost:6379 | Cache et sessions |

## 🔧 Commandes Utiles

### Gestion des Services
```bash
# Voir le statut
docker-compose ps

# Voir les logs
docker-compose logs -f

# Redémarrer un service spécifique
docker-compose restart eco-app

# Redémarrer tous les services
docker-compose restart
```

### Gestion des Données
```bash
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U eco_user eco_database > backup.sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U eco_user eco_database < backup.sql

# Voir les volumes
docker volume ls
```

### Debugging
```bash
# Accéder à un conteneur
docker-compose exec eco-app sh
docker-compose exec postgres psql -U eco_user eco_database

# Voir les logs d'un service spécifique
docker-compose logs eco-app
docker-compose logs postgres
```

## 🛠️ Configuration Avancée

### Variables d'Environnement
Le fichier `.env` est créé automatiquement avec des valeurs par défaut. Vous pouvez le modifier :

```bash
# Éditer la configuration
nano .env

# Redémarrer après modification
docker-compose down
docker-compose up -d
```

### Personnalisation des Ports
Pour changer les ports, modifiez le fichier `docker-compose.yml` :

```yaml
services:
  eco-app:
    ports:
      - "3000:3000"  # Changez le premier port
```

## 🚨 Résolution de Problèmes

### Problème : Port déjà utilisé
```bash
# Voir qui utilise le port
lsof -i :3000

# Arrêter le processus
kill -9 <PID>
```

### Problème : Erreur de construction Docker
```bash
# Nettoyer et reconstruire
./stop-all.sh  # Option 3 (nettoyage complet)
./deploy-full.sh
```

### Problème : Base de données corrompue
```bash
# Réinitialiser la base de données
docker-compose down -v
./deploy-full.sh
```

### Problème : Services lents à démarrer
```bash
# Surveiller le démarrage
./monitor.sh

# Voir les logs détaillés
docker-compose logs -f
```

## 📊 Architecture des Services

```
┌─────────────────┐
│   Nginx (80)    │ ← Point d'entrée
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──┐
│App    │ │Admin│
│(3000) │ │(3001)│
└───────┘ └─────┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│  PostgreSQL     │
│    (5432)       │
└─────────────────┘
         │
┌────────▼────────┐
│     Redis       │
│    (6379)       │
└─────────────────┘
```

## 🎯 Bonnes Pratiques

### Développement
- Utilisez `./monitor.sh` pour surveiller les services
- Consultez les logs régulièrement
- Sauvegardez vos données importantes

### Production
- Changez les mots de passe par défaut dans `.env`
- Configurez HTTPS avec des certificats SSL
- Mettez en place une stratégie de sauvegarde
- Surveillez les ressources système

### Maintenance
- Nettoyez régulièrement les images Docker inutilisées
- Mettez à jour les images de base
- Surveillez l'espace disque des volumes

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs** : `docker-compose logs -f`
2. **Utilisez le monitoring** : `./monitor.sh`
3. **Consultez ce guide** pour les problèmes courants
4. **Redémarrez les services** : `docker-compose restart`
5. **Nettoyage complet** : `./stop-all.sh` (option 3) puis `./deploy-full.sh`