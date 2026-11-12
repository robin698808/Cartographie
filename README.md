# Cartographe — Backend FastAPI

## Démarrage rapide (sans Docker)

### Prérequis
- Python 3.11+
- PowerShell ou terminal

### Installation

```powershell
# Cloner / se placer dans le dossier backend
cd cartographe/backend

# Créer un environnement virtuel
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows PowerShell
# source .venv/bin/activate   # Linux/Mac

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

L'API est accessible sur http://localhost:8000  
La doc Swagger : http://localhost:8000/docs

---

## Démarrage avec Docker

```powershell
cd cartographe
docker-compose up --build
```

---

## Endpoints principaux

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /api/auth/register | Créer un compte |
| POST | /api/auth/login | Login → JWT |
| GET | /api/auth/me | Profil courant |
| GET | /api/projects | Mes projets |
| POST | /api/projects | Créer un projet |
| GET | /api/projects/{id}/snapshots/latest | Dernier état du canvas |
| POST | /api/projects/{id}/snapshots | Sauvegarder le canvas |
| WS | /ws/{project_id}?token=... | Collaboration temps réel |

---

## Export PowerPoint : modèle de projet

Dans **Fichier → Exporter PowerPoint**, un éditeur, propriétaire ou administrateur
peut joindre ou remplacer un modèle `.pptx` (25 Mo maximum). Il est enregistré
en base et partagé avec les membres du projet ; les lecteurs peuvent l'utiliser
pour exporter, mais ne peuvent pas le modifier. Le bouton « Utiliser le modèle
par défaut » supprime le modèle personnalisé. Sa suppression est également
effectuée lors de la suppression du projet.

L'export crée de nouvelles diapositives à partir des masques et du format du
modèle : les diapositives existantes du fichier ne sont pas reprises. Les
éléments générés restent modifiables et utilisent leurs propres couleurs et
polices ; leur position est adaptée au format de la diapositive, mais les
présentations avec des masques très chargés peuvent nécessiter des retouches.
Les présentations à macros ne sont pas acceptées. Les objets incorporés sont
autorisés, mais ne sont pas analysés : utiliser uniquement un modèle de
confiance. Les objets portés uniquement par les diapositives d'origine ne sont
pas repris ; ceux des masques peuvent être conservés. Sans modèle personnalisé,
le modèle livré avec l'application reste utilisé. Après mise à jour, redémarrer
le backend pour créer la table nécessaire.

Les sections « Cartographie globale » et « Vue consolidée par domaine » produisent
respectivement une vue unique du périmètre et une vue par domaine avec ses
applications liées et leurs flux entrants, sortants et internes. L'agencement
compare plusieurs dispositions sur les cartes de taille modérée et cherche des
trajets orthogonaux évitant les applications et les autres flux. Les conflits
géométriques restants, flux sans extrémité visible et cartes denses sont signalés
sur la diapositive et dans l'aperçu ; la lisibilité ne peut pas être garantie
pour tous les périmètres, notamment sur une seule diapositive.
Lorsqu'un sous-ensemble de domaines est sélectionné, la vue globale est limitée
à ce périmètre, mais les vues par domaine incluent aussi les applications
externes directement liées afin de conserver les flux entrants et sortants.

La section facultative « Détail des flux par domaine » présente chaque flux sur
une ligne distincte et se répartit sur plusieurs diapositives si nécessaire.
Elle complète les vues consolidées sans les remplacer. Dans le menu, les
principales diapositives sont sélectionnables directement ; les autres
diapositives, le périmètre et l'identité sont regroupés dans des options
repliables. L'option « Afficher les flux sur la cartographie globale » n'agit
que sur cette vue, sans retirer les flux des vues de domaine ou des tableaux.
Les synthèses des projets Deal présentent la trajectoire Day 1 / Day 2 ; celles
des autres projets présentent les statuts et l'hébergement. La criticité et les
dépendances sont également prises en compte.

---

## Rôles et autorisations

- L'administrateur global gère les utilisateurs et tous les projets. Il ne peut
  pas consulter ni modifier les vues privées d'un autre utilisateur.
- Le membre peut créer des projets. Le lecteur global ne peut pas en créer et
  reste en lecture seule dans tous ses projets.
- Un projet dispose d'un propriétaire, d'éditeurs et de lecteurs. Seul le
  propriétaire enregistré (ou un administrateur) gère les membres et les
  informations du projet. Les éditeurs peuvent enregistrer la cartographie.
- Les membres peuvent créer des vues privées. Le partage et la modification des
  vues partagées nécessitent des droits d'édition ; une vue partagée appartenant
  à un utilisateur devenu lecteur reste consultable mais non modifiable par lui.
- Le propriétaire ou un administrateur peut transférer la propriété à un membre
  non lecteur global. Le transfert doit précéder la rétrogradation en lecteur
  global ou la suppression d'un compte propriétaire.
- Les autorisations WebSocket sont réévaluées à chaque message et au moins toutes
  les deux secondes ; une modification de droits ferme la connexion et demande
  un rechargement. Les événements sensibles sont inscrits dans `audit_events`,
  dans la même transaction que l'action.

La visibilité « privé » ou « équipe » est indicative : l'accès reste réservé aux
membres invités et aux administrateurs. Les nouvelles règles n'attribuent pas
automatiquement de nouveaux propriétaires aux données préexistantes. Dans les
anciennes données, seul `projects.owner_id` est considéré comme propriétaire ;
les éventuels autres membres `owner` sont traités comme éditeurs, ou comme
lecteurs si leur rôle global est lecteur. Un administrateur doit régulariser ces
adhésions et transférer explicitement les projets si nécessaire. Si le propriétaire
enregistré n'est pas membre, le transfert est bloqué jusqu'à régularisation.
Au démarrage, un index unique partiel empêche plusieurs membres `owner` par
projet sur SQLite et PostgreSQL. Si des doublons préexistent, le démarrage
émet un avertissement et n'installe pas cet index : un administrateur doit
régulariser les rôles puis redémarrer. Les transferts concurrents sont contrôlés
par une mise à jour conditionnelle ; un transfert basé sur un propriétaire périmé
est refusé avec un conflit HTTP 409.

Le canvas masque les commandes de modification des données aux lecteurs et
ne sauvegarde pas leurs changements d'affichage. Ils peuvent toujours naviguer,
exporter et utiliser des vues privées.

Pour tester les contrôles avec une base temporaire :

```powershell
python -m unittest discover -s Cartographie\backend\tests -v
```

---

## Variables d'environnement (.env)

```env
DATABASE_URL=sqlite:///./cartographe.db
SECRET_KEY=change-me-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

---

## Migration vers PostgreSQL

1. Décommenter le service `db` dans `docker-compose.yml`
2. Changer `DATABASE_URL` :
```env
DATABASE_URL=postgresql://cartographe:secret@db:5432/cartographe
```
3. Ajouter `psycopg2-binary` dans `requirements.txt`
4. `docker-compose up --build`

---

## Prochaines étapes (Phase 3)

- [ ] Frontend React séparé (Vite)
- [ ] Page Login/Register
- [ ] Liste des projets
- [ ] Barre de présence WebSocket dans le canvas
- [ ] Auto-save toutes les 30s
- [ ] Historique des snapshots dans la sidebar

---

## Déploiement en production

| Service | Plateforme | URL |
|---------|------------|-----|
| Frontend | Vercel | https://cartographie-47pf-lake.vercel.app/ |
| Backend | Railway | https://cartographie-production-76cc.up.railway.app |

### Variables d'environnement Railway

```env
DATABASE_URL=postgresql://...  # fourni par Railway
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=https://cartographie-47pf-lake.vercel.app
```
