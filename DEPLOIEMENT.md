# Déploiement — rendre Cartographe partageable

Ce guide explique comment héberger Cartographe pour qu'une équipe puisse s'y
connecter via une **URL publique**, avec comptes, projets partagés et
collaboration temps réel.

## Architecture

```
                    Internet / VPN
                          │
                    ┌─────▼─────┐   port 80/443
                    │  frontend │   nginx : sert le build Vite
                    │  (nginx)  │   + reverse proxy /api et /ws
                    └─────┬─────┘
                          │ réseau interne Docker
                 ┌────────┴────────┐
            ┌────▼────┐       ┌─────▼─────┐
            │ backend │◄──────│    db     │
            │ FastAPI │       │ PostgreSQL│
            └─────────┘       └───────────┘
```

Un **seul service est exposé** (`frontend`). Il sert l'application et relaie les
appels API (`/api`) et WebSocket (`/ws`) vers le backend. Front et API partagent
donc la même origine → pas de souci de CORS, et `wss://` fonctionne
automatiquement dès que le site est en HTTPS.

## Prérequis

- Une machine (VPS, serveur d'entreprise, VM cloud…) avec **Docker** et
  **Docker Compose**.
- Un accès réseau vers cette machine (IP publique + nom de domaine pour du
  cloud, ou IP interne pour un déploiement VPN/intranet).

## 1. Configuration

```bash
git clone https://github.com/robin698808/Cartograpgie.git
cd Cartograpgie
cp .env.example .env
```

Éditer `.env` et renseigner **au minimum** :

```env
POSTGRES_PASSWORD=<un mot de passe fort>
SECRET_KEY=<résultat de : openssl rand -hex 32>
FRONTEND_URL=https://cartographe.mondomaine.fr   # ton URL publique
```

> `SECRET_KEY` et `POSTGRES_PASSWORD` sont **obligatoires** : le `docker compose`
> refuse de démarrer s'ils sont absents. Ne jamais committer le `.env`
> (déjà dans `.gitignore`).

## 2. Lancement

```bash
docker compose up --build -d
```

L'application est accessible sur `http://<ip-ou-domaine>` (port 80 par défaut,
réglable via `HTTP_PORT`).

Vérifier que tout tourne :

```bash
docker compose ps
curl http://localhost/api/health   # → {"status":"ok","version":"1.0.0"}
```

## 3. Créer le premier compte (administrateur)

Ouvrir l'URL dans un navigateur → page **Register**.

> **Le tout premier compte inscrit devient automatiquement `admin`.** Inscris-toi
> en premier, puis gère les autres utilisateurs depuis l'interface admin.

## 4. Inviter d'autres utilisateurs

Deux façons de partager selon le besoin :

1. **Les collègues créent leur compte** eux-mêmes via la page Register, puis le
   propriétaire d'un projet les ajoute (bouton de gestion des membres du projet).
2. **Ajout à un projet** : dans un projet, l'`owner` invite par **email** et
   choisit le rôle :
   - `owner` — contrôle total du projet ;
   - `editor` — modifie apps/flux ;
   - `viewer` — lecture seule.

L'admin global gère les comptes (rôles, suppression) depuis l'écran
d'administration des utilisateurs.

## 5. HTTPS (fortement recommandé en cloud)

L'app écoute en HTTP sur le port 80. Pour du HTTPS public, place un terminateur
TLS devant. Le plus simple :

- **Caddy** ou **Traefik** en reverse proxy devant le service `frontend` (TLS
  automatique via Let's Encrypt), ou
- un **nginx/Apache système** avec certbot, qui proxifie vers `HTTP_PORT`.

Exemple `Caddyfile` minimal (Caddy sur la même machine) :

```
cartographe.mondomaine.fr {
    reverse_proxy localhost:80
}
```

Dès que le site est servi en HTTPS, le frontend utilise `wss://` sans
modification (l'URL WebSocket est dérivée de l'origine courante).

## 6. Sauvegardes

Les données vivent dans le volume Docker `pg_data`. Sauvegarde régulière :

```bash
# Dump de la base
docker compose exec db pg_dump -U cartographe cartographe > backup_$(date +%F).sql

# Restauration
cat backup_AAAA-MM-JJ.sql | docker compose exec -T db psql -U cartographe cartographe
```

## 7. Mise à jour

```bash
git pull
docker compose up --build -d
```

Le schéma est créé automatiquement au démarrage (`Base.metadata.create_all`).
Pour des évolutions de schéma en production, envisager Alembic (déjà dans les
dépendances) plutôt que la création automatique.

---

## Développement local (sans Docker)

Pour développer, on lance backend et frontend séparément :

```bash
# Backend (SQLite par défaut, port 8001 ici)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Frontend
cd frontend
cp .env.example .env          # décommenter VITE_API_URL / VITE_WS_URL
npm install
npm run dev
```

En dev, décommenter dans `frontend/.env` :

```env
VITE_API_URL=http://localhost:8001/api
VITE_WS_URL=ws://localhost:8001
```

## Notes techniques

- **Un seul worker backend** : l'état de présence WebSocket est en mémoire
  process ; scaler à plusieurs workers/instances casserait la collaboration
  temps réel sans un backend de diffusion partagé (Redis pub/sub, etc.).
- **CORS** : inutile derrière le reverse proxy (même origine). Ne renseigner
  `CORS_ORIGINS` que pour un accès direct à l'API depuis un autre domaine.
```
