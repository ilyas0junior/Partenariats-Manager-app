# Docker – Partenariats CNSS

## Démarrer

```bash
docker compose up --build
```

App : http://localhost:8080 — API : http://localhost:4000 — MongoDB : localhost:27017

---

## Erreur : `failed to resolve source metadata for docker.io/library/node:20-alpine` / `lookup registry-1.docker.io ... server misbehaving`

C’est un **problème DNS** : la machine ne résout pas le registre Docker Hub.

### 1. Faire utiliser à Docker des DNS publics

Créez ou éditez `/etc/docker/daemon.json` :

```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Puis redémarrez Docker :

```bash
sudo systemctl restart docker
```

Refaites le build :

```bash
docker compose up --build
```

### 2. Si ça ne suffit pas (ex. Ubuntu avec systemd-resolved)

- Vérifier la connexion internet et qu’aucun VPN/firewall ne bloque l’accès à Docker Hub.
- Tester la résolution : `ping registry-1.docker.io`
- Optionnel : sur la machine, forcer des DNS dans `/etc/systemd/resolved.conf` (par ex. `DNS=8.8.8.8 8.8.4.4`), puis `sudo systemctl restart systemd-resolved`.

### 3. Utiliser une image déjà en cache

Si l’image `node:20-alpine` est déjà téléchargée (build réussi une fois ailleurs), le build peut passer sans réseau. Vérifier avec :

```bash
docker images node
```

---

## Image de base personnalisée (miroir)

Si vous utilisez un miroir de registre, vous pouvez surcharger l’image de base au build :

```bash
docker compose build --build-arg NODE_IMAGE=votre-miroir/node:20-alpine
docker compose up -d
```

Ou dans un fichier `.env` à la racine :

```
NODE_IMAGE=votre-miroir/node:20-alpine
```

Puis dans `docker-compose.yml` passer `args: NODE_IMAGE` aux services qui construisent une image (voir ci‑dessous).
