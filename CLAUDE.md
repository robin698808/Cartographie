# CLAUDE.md

Ce fichier guide Claude Code (ou tout assistant IA) lors du travail sur ce dépôt.

## Contexte du projet

**Cartographe** est un outil de cartographie applicative IT utilisé en mission de due diligence,
audit de SI et carve-out. Il existait initialement comme un fichier HTML standalone (React +
Babel via CDN, zéro backend, état en mémoire/localStorage). Ce dépôt contient la **migration
vers une architecture client-serveur Python** pour supporter :

- Le travail collaboratif multi-utilisateurs en temps réel
- La gestion des comptes (login, rôles, administration)
- Des espaces de projet isolés par équipe/mission

**Règle d'or : ne jamais régresser sur la logique métier existante.** Toute la logique de
canvas (drag & drop, zoom, flux, filtres, vues Paysage/Cartes/Dashboard/Décisions D1-D2,
exports XLSX/CSV/PPTX) doit être préservée à l'identique. On change l'architecture autour,
pas le produit.

## Stack

| Couche | Techno | Version cible |
|---|---|---|
| Backend | FastAPI | 0.110+ |
| ORM | SQLAlchemy 2.x (async) | 2.0+ |
| Migrations | Alembic | dernière stable |
| Auth | JWT (python-jose) + bcrypt (passlib) | — |
| DB dev | SQLite | fichier local |
| DB prod | PostgreSQL | 15+ |
| Temps réel | WebSocket natif FastAPI | — |
| Frontend | React + Vite | React 18, Vite 5 |
| Conteneurisation | Docker Compose | — |

## Structure du dépôt

```
cartographe/
├── backend/
│   ├── app/
│   │   ├── main.py              # point d'entrée FastAPI, montage des routers
│   │   ├── config.py            # Settings (pydantic-settings), variables d'env
│   │   ├── database.py          # engine SQLAlchemy, session factory
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── project_member.py
│   │   │   └── snapshot.py
│   │   ├── schemas/              # Pydantic — un fichier par modèle, miroir de models/
│   │   ├── routes/
│   │   │   ├── auth.py          # /api/auth/login, /register, /me
│   │   │   ├── users.py         # /api/users (admin only)
│   │   │   ├── projects.py      # /api/projects CRUD + invitations membres
│   │   │   ├── snapshots.py     # /api/projects/{id}/snapshots
│   │   │   └── ws.py            # /ws/projects/{id} — collab temps réel
│   │   ├── auth_utils.py        # hash password, create/verify JWT, dépendances FastAPI
│   │   └── ws_manager.py        # ConnectionManager : broadcast par project_id
│   ├── alembic/                  # migrations
│   ├── tests/                    # pytest, un fichier par router
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # composant racine, logique cartographie héritée du HTML
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ProjectList.jsx   # tableau de bord des projets de l'utilisateur
│   │   │   ├── ProjectAdmin.jsx  # gestion membres/rôles (owner/editor uniquement)
│   │   │   └── AdminUsers.jsx    # gestion utilisateurs globale (admin only)
│   │   ├── components/           # AppNode, FlowLines, Sidebar, Dashboard, etc. (portés du HTML)
│   │   ├── lib/
│   │   │   ├── api.js            # wrapper fetch/axios vers le backend
│   │   │   ├── ws.js             # client WebSocket, reconnexion auto
│   │   │   └── auth.js           # stockage token, contexte React Auth
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml             # services: backend, frontend, db
├── docker-compose.dev.yml         # override pour dev local (SQLite, hot-reload)
└── CLAUDE.md                      # ce fichier
```

## Modèle de données — contraintes à respecter

```
User(id, email UNIQUE, full_name, hashed_password, role[admin|member], created_at)

Project(id, name, description, owner_id→User, visibility[private|team], created_at, updated_at)

ProjectMember(project_id→Project, user_id→User, role[owner|editor|viewer], UNIQUE(project_id,user_id))

Snapshot(id, project_id→Project, apps JSON, flows JSON, dom_colors JSON,
         created_by→User, created_at, label nullable)
```

- `Snapshot.apps` et `Snapshot.flows` gardent **exactement** la même forme que les objets
  JS `apps`/`flows` du HTML d'origine (mêmes clés : `id, name, domain, category, status,
  criticality, vendor, version, owner, users, description, statusD1, statusD2, x, y` pour
  les apps ; `id, from, to, protocol, frequency, label, description` pour les flux).
  Ne jamais renommer ces clés côté backend — le frontend doit pouvoir charger un snapshot
  sans transformation.
- Le dernier snapshot d'un projet = état courant. L'historique (snapshots précédents)
  permet le rollback.

## Permissions — à appliquer sur CHAQUE endpoint sensible

| Action | admin | owner | editor | viewer |
|---|---|---|---|---|
| Voir le projet | ✅ | ✅ | ✅ | ✅ |
| Modifier apps/flux | ✅ | ✅ | ✅ | ❌ |
| Inviter/retirer des membres | ✅ | ✅ | ❌ | ❌ |
| Supprimer le projet | ✅ | ✅ | ❌ | ❌ |
| Gérer les comptes utilisateurs (global) | ✅ | ❌ | ❌ | ❌ |

Toute route de modification doit vérifier le rôle via une dépendance FastAPI
(`Depends(require_role(...))`), jamais en inline dans le handler.

## Conventions de code

### Backend (Python)
- **Type hints partout**, y compris retours de fonction.
- Async de bout en bout : routes `async def`, sessions SQLAlchemy async
  (`AsyncSession`), pas de mélange sync/async.
- Un router FastAPI par ressource, monté dans `main.py` avec un préfixe `/api/...`.
- Pas de logique métier dans les routes : la route appelle un service/repository,
  elle ne contient que validation + appel + réponse.
- Toute erreur métier lève une `HTTPException` avec un `status_code` et un `detail`
  explicite — jamais de message générique.
- Tests : `pytest` + `httpx.AsyncClient`, un test au minimum par cas de permission
  (admin/owner/editor/viewer) sur les routes sensibles.

### Frontend (React)
- Composants fonctionnels uniquement, hooks standards.
- **Aucun hook conditionnel** (cf. bugs déjà rencontrés dans la version HTML — un
  `useState` à l'intérieur d'un bloc `if(view===...)` casse l'app). Tout l'état se
  déclare au top du composant.
- La logique métier portée depuis le HTML (calculs de flux, filtres, export) doit
  être extraite dans des fonctions pures testables, pas mélangée au JSX.
- Le contexte `AuthContext` expose `{ user, token, login, logout }` ; ne jamais
  stocker le token ailleurs que dans ce contexte + localStorage chiffré ou httpOnly
  cookie selon l'option de sécurité retenue.

### Git / commits
- Commits atomiques, message à l'impératif (`Ajoute l'endpoint /api/projects`).
- Ne jamais commit de secret (`.env` dans `.gitignore`, fournir `.env.example`).

## Commandes courantes

```bash
# Backend — dev local
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Backend — tests
pytest -v

# Frontend — dev local
cd frontend
npm install
npm run dev

# Tout via Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Nouvelle migration après modif d'un modèle
cd backend
alembic revision --autogenerate -m "description du changement"
alembic upgrade head
```

## Variables d'environnement attendues (`backend/.env`)

```
DATABASE_URL=sqlite+aiosqlite:///./cartographe.db   # ou postgresql+asyncpg://... en prod
JWT_SECRET_KEY=<générer avec openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
CORS_ORIGINS=http://localhost:5173
```

## Plan de migration (phases)

1. **Fondations** — FastAPI + auth JWT + modèles User/Project + SQLite + tests de base.
2. **API CRUD** — endpoints projets/apps/flux. Frontend : login + liste projets + chargement
   d'une cartographie depuis l'API (réutilise les composants canvas existants).
3. **Collaboration temps réel** — WebSocket, broadcast des modifications, indicateur de
   présence, sauvegarde auto (snapshot toutes les 30s ou sur action significative).
4. **Admin & déploiement** — interface admin users/projets, Dockerfile + docker-compose,
   README de déploiement.

Ne pas paralléliser les phases : chaque phase doit être testée et fonctionnelle avant de
passer à la suivante, car la phase 3 dépend fortement de la structure d'API posée en phase 2.

## Pièges connus à éviter (vécus sur la version HTML)

- **Hooks conditionnels** : un `useState`/`useEffect` à l'intérieur d'un bloc de rendu
  conditionnel casse React. Toujours déclarer l'état en haut du composant.
- **Doubles imports de librairies** : ne jamais charger deux fois React/une lib dans le
  même bundle (problème vécu avec les CDN dupliqués). Avec Vite/npm ce risque disparaît
  mais vérifier les imports dupliqués dans `package.json`.
- **JSX avec doubles accolades involontaires** (`{{expr}}` au lieu de `{expr}`) : erreur
  fréquente en édition manuelle de JSX, source de crash silencieux côté build.
- **Cohérence des clés de données** : ne jamais renommer les champs `apps`/`flows` entre
  le frontend et les snapshots stockés en base — ça casse la compatibilité d'import/export
  XLSX déjà existante.

## Ce qui ne doit PAS changer

- Les vues : Cartographie (canvas), Paysage (macro/zone), Cartes, Dashboard, Décisions D1/D2.
- Les exports : XLSX (4 onglets : Applications, Flux, Dashboard, Config), CSV, PPTX.
- Le format de réimport XLSX (colonnes `Nom, Domaine, Categorie, Statut, Criticite, Editeur,
  Version, Responsable, Utilisateurs, Description, Day 1, Day 2, x, y` pour les apps ;
  `Source, Cible, Protocole, Frequence, Label, Description` pour les flux).
