# Admin Dashboard - Docker Setup

## 🚀 Démarrage rapide

### Méthode 1 : Script automatisé (Recommandé)
```bash
./start.sh
```

### Méthode 2 : Docker Compose
```bash
docker-compose up -d
```

### Méthode 3 : Docker direct
```bash
# Construction de l'image
docker build -t admin-dashboard .

# Démarrage du conteneur
docker run -d -p 3001:3001 \
  -e DATABASE_URL="your_database_url_here" \
  --name admin-dashboard \
  admin-dashboard
```

## 📋 Accès à l'application

Une fois démarré, l'admin dashboard est accessible sur :
**http://localhost:3001**

## ⚙️ Configuration

### Réseau Docker

L'admin-dashboard est configuré pour rejoindre le réseau `eco-front_eco-network` existant, permettant la communication avec :
- **eco-front-app** (port 3000)
- **eco-postgres** (port 5432) 
- **eco-redis** (port 6379)

### Variables d'environnement

Les variables d'environnement sont configurées automatiquement dans `docker-compose.yml` :

```env
# Database connection - Configured for eco-front network
DATABASE_URL="postgresql://eco_user:eco_password@eco-postgres:5432/eco_database"
DIRECT_URL="postgresql://eco_user:eco_password@eco-postgres:5432/eco_database"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3001"

# Environment
NODE_ENV="production"
PORT="3001"
```

### Configuration Docker Compose

Le fichier `docker-compose.yml` est configuré pour :
- Port d'exposition : 3001
- Réseau externe : `eco-front_eco-network`
- Container name : `eco-admin-dashboard`
- Accès à la base de données PostgreSQL partagée

## 🛠️ Commandes utiles

### Gestion des conteneurs
```bash
# Voir les logs
docker-compose logs -f admin-dashboard

# Redémarrer
docker-compose restart admin-dashboard

# Arrêter
docker-compose down

# Reconstruire et redémarrer
docker-compose up -d --build
```

### Debug
```bash
# Accéder au conteneur
docker exec -it admin-dashboard-admin-dashboard-1 sh

# Voir l'état des conteneurs
docker ps

# Voir tous les conteneurs (arrêtés inclus)
docker ps -a
```

## 📦 Architecture Docker

- **Image de base** : Node.js 18 Alpine
- **Build multi-étapes** : Optimisation de la taille de l'image
- **Port** : 3001
- **Utilisateur** : nextjs (non-root pour sécurité)
- **Output** : Standalone pour Docker

## 🔧 Développement

Pour le développement local sans Docker :

```bash
# Installation des dépendances
npm install

# Génération du client Prisma
npx prisma generate

# Démarrage en mode développement
npm run dev
```

## 📁 Structure des fichiers Docker

```
admin-dashboard/
├── Dockerfile              # Image de production
├── docker-compose.yml      # Orchestration
├── .dockerignore           # Fichiers exclus du build
├── start.sh                # Script de démarrage automatisé
└── README.md               # Cette documentation
```

## 🚨 Troubleshooting

### Port 3001 déjà utilisé
```bash
# Voir quel processus utilise le port
lsof -i :3001

# Ou arrêter tous les conteneurs Docker sur ce port
docker ps | grep 3001 | awk '{print $1}' | xargs docker stop
```

### Erreurs de base de données
- Vérifiez que `DATABASE_URL` est correctement configuré
- Assurez-vous que la base de données est accessible depuis le conteneur
- Pour une base de données locale, utilisez `host.docker.internal` au lieu de `localhost`

### Problèmes de build
```bash
# Nettoyer le cache Docker
docker system prune -f

# Reconstruire complètement
docker-compose build --no-cache
```

## 🔄 Mise à jour

Pour mettre à jour l'application :

1. Arrêter les conteneurs :
   ```bash
   docker-compose down
   ```

2. Reconstruire :
   ```bash
   docker-compose build --no-cache
   ```

3. Redémarrer :
   ```bash
   docker-compose up -d
   ``` 