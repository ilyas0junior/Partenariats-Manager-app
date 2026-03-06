# Démarrer le projet Partenariats CNSS

## Prérequis

- **Node.js** (v18+)
- **MongoDB** (le backend se connecte à `mongodb://localhost:27017`)

## 1. Démarrer MongoDB

Sans MongoDB, le serveur affiche : `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`.

### Ubuntu / Debian

```bash
# Installer MongoDB (si besoin)
sudo apt update
sudo apt install -y mongodb

# Démarrer le service
sudo systemctl start mongodb
# ou selon la version :
sudo systemctl start mongod

# Vérifier qu'il tourne
sudo systemctl status mongod
```

### Avec Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### macOS (Homebrew)

```bash
brew services start mongodb-community
```

## 2. Lancer le projet

```bash
# À la racine du projet (agent-hub-main)
cd /chemin/vers/agent-hub-main

# Installer les dépendances (une fois)
npm install
cd agent-hub-main && npm install && cd ..

# Terminal 1 : backend (port 4000)
npm run server

# Terminal 2 : frontend (port 8080)
cd agent-hub-main && npm run dev
```

Ou en une commande : `./run.sh` (après avoir démarré MongoDB).

## 3. Comptes de test

Après le premier démarrage du backend, des comptes admin sont créés automatiquement :

- **admin@local** / **admin1234**
- **ilyas@local** / **ilyas123**

## Variables d'environnement (optionnel)

- `MONGODB_URI` : URI MongoDB (défaut : `mongodb://localhost:27017`)
- `MONGODB_DB` : nom de la base (défaut : `agent_hub`)
- `VITE_API_URL` : URL de l’API côté frontend (en dev, le proxy Vite utilise `/api`)
