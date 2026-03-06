# Partenariats CNSS

Application de gestion des partenariats (frontend React + Vite).

## Technologies

- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS

## Développement local

```sh
npm install
npm run dev
```

Le serveur de dev écoute sur le port 8080. L’API est proxifiée vers `http://localhost:4000` (configurable via `VITE_PROXY_TARGET`).

## Build

```sh
npm run build
```

Les fichiers de production sont générés dans `dist/`.

## Déploiement

Servir le contenu de `dist/` avec un serveur web (nginx, etc.) et configurer le reverse proxy vers l’API backend.
