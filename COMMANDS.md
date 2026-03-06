# Commandes – Partenariats CNSS

Racine du projet : `/home/black-kaiser/Desktop/agent-hub-main`

---

## 1. Lancer avec Docker (recommandé : tout en un)

```bash
cd /home/black-kaiser/Desktop/agent-hub-main
docker compose up --build
```

En arrière-plan :
```bash
docker compose up -d --build
```

Arrêter :
```bash
docker compose down
```

Arrêter et supprimer les données MongoDB :
```bash
docker compose down -v
```

Logs :
```bash
docker compose logs -f
docker compose logs -f server
docker compose logs -f web
docker compose logs -f mongo
```

Reconstruire sans cache :
```bash
docker compose build --no-cache
docker compose up -d
```

Image de base personnalisée (si problème DNS / miroir) :
```bash
NODE_IMAGE=node:20-alpine docker compose up --build
```

---

## 2. Lancer sans Docker (backend + frontend + MongoDB local)

**MongoDB doit tourner** (ex. `sudo systemctl start mongod`).

Terminal 1 – Backend :
```bash
cd /home/black-kaiser/Desktop/agent-hub-main
npm install
npm run server
```

Terminal 2 – Frontend :
```bash
cd /home/black-kaiser/Desktop/agent-hub-main/agent-hub-main
npm install
npm run dev
```

---

## 3. Commandes Backend (racine)

```bash
cd /home/black-kaiser/Desktop/agent-hub-main
npm install          # installer les deps
npm run server       # lancer l’API (port 4000)
```

---

## 4. Commandes Frontend (agent-hub-main/)

```bash
cd /home/black-kaiser/Desktop/agent-hub-main/agent-hub-main
npm install          # installer les deps
npm run dev          # dev (Vite, port 8080)
npm run build        # build production
npm run preview      # prévisualiser le build
npm run lint         # ESLint
npm run test         # tests (Vitest)
npm run test:watch   # tests en mode watch
```

---

## 5. MongoDB (local, hors Docker)

Démarrer :
```bash
sudo systemctl start mongod
```

Arrêter :
```bash
sudo systemctl stop mongod
```

Connexion shell :
```bash
mongosh
use agent_hub
db.partenariats.find().pretty()
db.users.find().pretty()
db.user_logs.find().pretty()
```

---

## 6. Docker (commandes générales)

Liste des conteneurs :
```bash
docker compose ps
docker ps
```

Entrer dans un conteneur :
```bash
docker compose exec server sh
docker compose exec web sh
docker compose exec mongo mongosh
```

Nettoyer images/volumes inutilisés :
```bash
docker system prune -a
docker volume prune
```

---

## 7. URLs

| Environnement | App (frontend)     | API (backend)     | MongoDB   |
|---------------|--------------------|-------------------|-----------|
| Docker        | http://localhost:8080 | http://localhost:4000 | localhost:27017 |
| Sans Docker   | http://localhost:8080* | http://localhost:4000 | localhost:27017 |

\* Ou le port affiché par Vite (ex. 5173 selon config).

---

## 8. Comptes admin (seed)

| Email        | Mot de passe |
|-------------|--------------|
| admin@local | admin1234    |
| ilyas@local | ilyas123     |
