# Figma design prompt — Gestion des Partenariats (exact match)

Use this prompt in Figma (AI, FigJam, or brief) to recreate the app design.

---

## Master prompt (paste into Figma AI or design brief)

**Create a high-fidelity UI design for a French web app named "Gestion des Partenariats" (Partnership Management). Match this specification exactly.**

### Design system

- **Typography:** Inter (weights 400, 500, 600, 700). Headings use letter-spacing -0.025em.
- **Border radius:** 10px (0.625rem) for cards, buttons, inputs.
- **Light theme colors (HSL):**
  - Background: `hsl(220, 20%, 97%)` — light gray-blue.
  - Card/surface: `#FFFFFF` with subtle border `hsl(220, 15%, 88%)`.
  - Primary: `hsl(220, 70%, 50%)` — blue.
  - Primary gradient (buttons, icon boxes): linear gradient 135°, from `hsl(220, 70%, 50%)` to `hsl(240, 60%, 55%)`.
  - Text primary: `hsl(220, 30%, 10%)`. Muted text: `hsl(220, 10%, 50%)`.
  - Success: `hsl(160, 60%, 45%)`. Destructive: `hsl(0, 72%, 55%)`. Warning: `hsl(38, 92%, 50%)`.
- **Shadows:** Card default: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)`. Elevated: `0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)`.
- **Spacing:** 4px base; sections use 16px–24px gaps. Max content width 1280px (7xl), side padding 16px–24px.

### Screen 1 — Login (Connexion)

- Full viewport, centered layout. Background: `hsl(220, 20%, 97%)`.
- Top block (centered, max-width ~400px):
  - Icon: 56×56px rounded square (10px radius) with **primary gradient** (blue to purple), white Users/people icon inside.
  - Title: "Gestion des Partenariats" — 24px, bold, dark text.
  - Subtitle: "Connectez-vous à votre compte" — 14px, muted.
- Card below (white, border, elevated shadow, 10px radius):
  - Header: "Connexion" (18px), description "Entrez vos identifiants pour accéder au tableau de bord" (muted, small).
  - Two inputs with left icons (Mail, Lock): placeholder "Email" and "Mot de passe", 40px height, border `hsl(220, 15%, 88%)`.
  - Primary button full width: same gradient (135° blue to purple), white text "Se connecter", rounded.
- All labels above inputs, small muted text.

### Screen 2 — Dashboard (Tableau de bord)

- **Header (sticky):** Height 56px. Background: white with light border-bottom and subtle backdrop blur. Max-width 1280px, horizontal padding.
  - Left: Logo 32×32px with same primary gradient + Handshake icon; title "Partenariats CNSS" (18px bold).
  - Right: Small muted text (user name), ghost button "Utilisateurs" with Users icon, ghost button "Déconnexion" with LogOut icon.
- **Main (max-width 1280px, padding 16–24px):**
  - Row 1: Title "Gestion des Partenariats" (24px bold), subtitle "Suivez et gérez vos partenariats" (muted). Right: primary gradient button "Nouveau partenariat" with Plus icon.
  - **Stats row:** 6 small cards in a grid (1 col mobile, 2–3–6 cols responsive). Each card: white, border, 10px radius, light shadow; left: 44×44px rounded box with muted bg + icon (Handshake, CheckCircle, XCircle, etc.); right: big number (24px bold) + label (e.g. "Total", "Opérationnels", "Échus") in muted 12px.
  - **Table section:** Search bar left (magnifier icon inside input), placeholder "Rechercher un partenariat..."; right: outline button "Exporter en Excel". Table: header row with columns Titre, Type, Partenaire, Date de signature, Date fin, Date prise d'effet, Statut, Description, Créé le, and Actions (dropdown). Rows with same columns; status as small colored badge (En cours, Opérationnel, etc.); actions: Voir, Modifier, Supprimer (icons Eye, Pencil, Trash).

### Screen 3 — Admin users (optional frame)

- Same header as Dashboard. Tabs: "Demandes (désactivé)", "Utilisateurs", "Logs".
- "Utilisateurs" content: block "Créer un utilisateur" — card with 4 inputs (Nom complet, Nom d'entreprise, Email, Mot de passe) in 2-column grid, primary gradient "Créer" button. Below: list/table of users with role, nickname, company.

### Components to create as components in Figma

1. **Button primary:** Gradient fill 135° (blue → purple), white text, 10px radius, medium padding.
2. **Button ghost:** No fill, muted text, hover light bg.
3. **Button outline:** Border, no fill.
4. **Input:** Border `hsl(220, 15%, 88%)`, 10px radius, optional left icon (16×16).
5. **Card:** White, 1px border, 10px radius, shadow-card or shadow-elevated.
6. **Status badges:** Small pill, colors: success green, warning orange, destructive red, muted gray.
7. **Icon box (gradient):** 32–56px square, 8–10px radius, primary gradient, white icon.

### Copy (French)

- App name: "Gestion des Partenariats" / "Partenariats CNSS" in header.
- Login: "Connexion", "Se connecter", "Connectez-vous à votre compte".
- Dashboard: "Nouveau partenariat", "Suivez et gérez vos partenariats", "Rechercher un partenariat...", "Exporter en Excel".
- Table: "Titre", "Type", "Partenaire", "Date de signature", "Date fin", "Date prise d'effet", "Statut", "Description", "Créé le", "Voir", "Modifier", "Supprimer".
- Stats: "Total", "Opérationnels", "Non opérationnels", "Échus", "À renouveler", "En cours".
- Header: "Utilisateurs", "Déconnexion".

Produce frames for: **Login**, **Dashboard (with stats + table)**, and optionally **Admin – Utilisateurs**. Use only the colors, radii, shadows, and typography specified so the result matches the existing app pixel-perfect in style.
