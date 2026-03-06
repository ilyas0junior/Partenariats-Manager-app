# Diagrammes Mermaid – Projet Partenariats CNSS

Copiez chaque bloc de code dans un visualiseur Mermaid (ex: [mermaid.live](https://mermaid.live)) ou dans un README pour les voir rendus.

---

## 0. Structure du projet (dossiers et flux)

```mermaid
flowchart TB
  subgraph Root["Répertoire racine"]
    Server["server.mjs\n(Express API)"]
    DockerCompose["docker-compose.yml"]
    DockerfileServer["Dockerfile.server"]
  end

  subgraph FrontendDir["agent-hub-main/"]
    Vite["vite.config.ts"]
    subgraph Src["src/"]
      App["App.tsx"]
      Main["main.tsx"]
      subgraph Pages["pages/"]
        Auth["Auth.tsx"]
        Dashboard["Dashboard.tsx"]
        AdminUsers["AdminUsers.tsx"]
        NotFound["NotFound.tsx"]
      end
      subgraph Components["components/"]
        AppHeader["AppHeader.tsx"]
        PartenariatTable["PartenariatTable.tsx"]
        PartenariatForm["PartenariatForm.tsx"]
        PartenariatDetail["PartenariatDetail.tsx"]
        PartenariatStats["PartenariatStats.tsx"]
        StatusBadge["StatusBadge.tsx"]
        UI["ui/ (shadcn)"]
      end
      subgraph Hooks["hooks/"]
        useAuth["useAuth.ts"]
        usePartenariats["usePartenariats.ts"]
        useAdminUsers["useAdminUsers.ts"]
      end
      Lib["lib/utils.ts"]
    end
  end

  subgraph Docker["Docker Compose"]
    Mongo["mongo (MongoDB:27017)"]
    ServerC["server (API:4000)"]
    Web["web (Vite:8080)"]
  end

  subgraph MongoDB["Base agent_hub"]
    ColUsers["users"]
    ColLogs["user_logs"]
    ColPartenariats["partenariats"]
  end

  Root --> Server
  Root --> Docker
  App --> Pages
  App --> Components
  App --> Hooks
  Server --> MongoDB
  Docker --> Mongo
  ServerC --> Mongo
  Web --> ServerC
```

```mermaid
flowchart LR
  subgraph Structure["Arborescence simplifiée"]
    direction TB
    A["agent-hub-main/"] --> B["src/"]
    B --> C["pages/"]
    B --> D["components/"]
    B --> E["hooks/"]
    B --> F["lib/"]
    C --> C1["Auth, Dashboard, AdminUsers, NotFound"]
    D --> D1["AppHeader, Partenariat*, StatusBadge, ui/"]
    E --> E1["useAuth, usePartenariats, useAdminUsers"]
    R["Racine"] --> G["server.mjs"]
    R --> H["docker-compose.yml"]
    R --> A
  end
```

---

## 1. Architecture globale

```mermaid
flowchart TB
  subgraph Frontend["Frontend (Vite + React)"]
    App[App.tsx]
    Auth[Auth.tsx]
    Dashboard[Dashboard.tsx]
    AdminUsers[AdminUsers.tsx]
    App --> Auth
    App --> Dashboard
    App --> AdminUsers
  end

  subgraph Hooks["Hooks"]
    useAuth[useAuth]
    usePartenariats[usePartenariats]
    useAdminUsers[useAdminUsers]
  end

  subgraph Backend["Backend (Express :4000)"]
    API[API REST]
    API --> AuthAPI["/api/login, /api/register, /api/me"]
    API --> UsersAPI["/api/users, /api/users/pending, /api/logs"]
    API --> PartenariatsAPI["/api/partenariats"]
  end

  subgraph DB["MongoDB (agent_hub)"]
    users[(users)]
    partenariats[(partenariats)]
    user_logs[(user_logs)]
  end

  Frontend --> Hooks
  Hooks --> Backend
  Backend --> DB
```

---

## 2. Routes et navigation

```mermaid
flowchart LR
  subgraph Public["Public"]
    A["/auth\n(Login / Register)"]
  end

  subgraph Protected["Protection login"]
    B["/\nDashboard\nPartenariats"]
    C["/admin/users\nGestion utilisateurs\n+ Logs"]
  end

  A -->|"session + isAdmin"| C
  A -->|"session + spectate"| B
  B -->|"Lien Utilisateurs (admin)"| C
  C -->|"Lien Partenariats CNSS"| B
  B -->|"Déconnexion"| A
  C -->|"Déconnexion"| A
```

---

## 3. Base de données (tables)

```mermaid
erDiagram
  users {
    ObjectId _id PK
    string email UK
    string full_name
    string password_hash
    string role "admin | editor | spectate | ajouter | modifier | suppression"
    string nickname
    string company_name
    string status "pending | approved | rejected"
    string created_at
  }

  user_logs {
    ObjectId _id PK
    string user_id FK
    string action "login | create_partenariat | ..."
    string details
    string created_at
  }

  partenariats {
    ObjectId _id PK
    string titre
    string type_partenariat
    string nature
    string domaine
    string entite_cnss
    string entite_concernee
    string partenaire
    string date_debut
    string date_fin
    string date_prise_effet
    string statut
    string description
    string company_name
    string created_by FK
    string created_at
    string updated_at
  }

  users ||--o{ user_logs : "user_id"
  users ||--o{ partenariats : "created_by"
```

---

## 4. Flux Auth (inscription → approbation → connexion)

```mermaid
sequenceDiagram
  participant U as Utilisateur
  participant F as Frontend
  participant API as Backend API
  participant DB as SQLite

  U->>F: S'inscrire (email, password)
  F->>API: POST /api/register
  API->>DB: INSERT users (status=pending)
  API-->>F: "Demande envoyée"
  F-->>U: "Attendre approbation admin"

  Note over U,DB: Admin approuve dans /admin/users

  U->>F: Se connecter (email, password)
  F->>API: POST /api/login
  API->>DB: SELECT user, check status
  alt status !== approved
    API-->>F: 403 "Compte non approuvé"
  else status = approved
    API->>DB: INSERT user_logs (login)
    API-->>F: { id, email, role, nickname }
    F-->>U: Redirection Dashboard ou /admin/users
  end
```

---

## 5. Structure des pages et composants (frontend)

```mermaid
flowchart TB
  subgraph App["App.tsx"]
    QueryClient[QueryClientProvider]
    AuthProvider[AuthProvider]
    Router[BrowserRouter]
    QueryClient --> AuthProvider
    AuthProvider --> Router
  end

  subgraph Routes["Routes"]
    R1["/ → Dashboard"]
    R2["/admin/users → AdminUsers"]
    R3["/auth → Auth"]
    R4["* → NotFound"]
  end

  subgraph Dashboard["Dashboard"]
    AppHeader1[AppHeader]
    PartenariatStats[PartenariatStats]
    PartenariatTable[PartenariatTable]
    PartenariatForm[PartenariatForm]
    PartenariatDetail[PartenariatDetail]
  end

  subgraph AdminUsers["AdminUsers"]
    AppHeader2[AppHeader]
    Tabs[Tabs]
    Tabs --> Pending["Demandes en attente"]
    Tabs --> Users["Utilisateurs\n(role, pseudonyme, dernière connexion)"]
    Tabs --> Logs["Logs\n(liste users + historique connexions)"]
  end

  subgraph Auth["Auth"]
    LoginForm[Formulaire Login/Register]
  end

  Router --> Routes
  R1 --> Dashboard
  R2 --> AdminUsers
  R3 --> Auth
  R4 --> NotFound
```

---

## 6. API Backend (résumé)

```mermaid
flowchart LR
  subgraph Auth["Auth"]
    POST_register["POST /api/register"]
    POST_login["POST /api/login"]
    GET_me["GET /api/me\nX-User-Id"]
  end

  subgraph Admin["Admin (X-User-Id + role=admin)"]
    POST_users["POST /api/users\n+ partenariatIds"]
    GET_users["GET /api/users\n+ lastLogin"]
    GET_pending["GET /api/users/pending"]
    GET_logs["GET /api/logs"]
    GET_companies["GET /api/companies"]
    PATCH_user["PATCH /api/users/:id"]
  end

  subgraph Partenariats["Partenariats (requireUser, filtre company_name)"]
    GET_p["GET /api/partenariats"]
    POST_p["POST /api/partenariats"]
    PUT_p["PUT /api/partenariats/:id"]
    DELETE_p["DELETE /api/partenariats/:id"]
  end

  Auth --> users[(users)]
  Auth --> user_logs[(user_logs)]
  Admin --> users
  Admin --> user_logs
  Partenariats --> partenariats[(partenariats)]
```

Vous pouvez coller n’importe quel bloc dans [mermaid.live](https://mermaid.live) pour obtenir le diagramme.
