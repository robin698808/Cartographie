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

Le menu propose quatre parties :

1. **Modèle** : choix du modèle PowerPoint du projet.
2. **Vue exécutive** : page de garde, graphiques, informations et messages clés.
3. **Vue cartographie** : applications regroupées par domaine et leurs statuts,
   sans flux, puis vues des applications et flux par domaine. Pour un projet Deal,
   les statuts Day 1 et Day 2 sont présentés ; sinon, le statut courant est utilisé.
   Les pastilles numérotées renvoient à la légende des statuts sur la
   diapositive ; pour un Deal, la pastille gauche correspond à Day 1 et celle
   de droite à Day 2. La vue globale tient sur une seule diapositive : le texte peut être réduit
   pour y inclure tous les domaines et applications. Les vues détaillées par
   domaine restent paginées si nécessaire.
4. **Annexes** : matrice détaillée paginée avec domaine, applications émettrice
   et réceptrice, objet, priorité, protocole, licences et coût annuel. Les
   domaines, scores de priorité, licences et coûts sont indiqués pour les deux
   applications (É : émettrice, R : réceptrice). Le score est le même que dans
   le tableau de bord, calculé sur l'ensemble des applications et flux du projet.
   Ces valeurs applicatives sont répétées pour chaque flux et ne
   doivent pas être additionnées comme s'il s'agissait de coûts de flux.

Les vues de domaine tentent une carte consolidée avec des trajets orthogonaux.
Lorsque l'analyse géométrique approximative détecte des conflits ou estime le
texte trop étroit, des lignes de flux paginées la remplacent ; l'aperçu le signale.
Une extrémité absente est signalée comme inconnue. Le contrôle ne garantit pas
la lisibilité des textes longs ni des modèles personnalisés aux masques chargés.
Lorsqu'un sous-ensemble de domaines est sélectionné, les vues de domaine
incluent les applications externes directement liées. Les annexes, les graphiques
et informations clés portent sur les applications sélectionnées et les flux
dont les deux extrémités sont dans ce périmètre.

---

## Lisibilité des flux sur la cartographie

L'optimisation de la disposition conserve les applications par domaine et
catégorie et reste annulable. Elle privilégie les domaines et les applications
très connectés près du centre de leur grille et agrandit les couloirs en
fonction des connexions. Jusqu'à 120 flux, elle compare plusieurs espacements
selon les conflits de tracé et d'étiquettes. Au-delà, elle utilise une
disposition aérée sans évaluation détaillée. Les croisements ne peuvent pas
toujours être éliminés.

Dans **Affichage**, la police des applications et celle des domaines peuvent
atteindre 360 %. Au-delà de 240 %, la taille des applications augmente avec
leur police ; il peut être nécessaire de relancer l'optimisation pour éviter
les chevauchements. Dans **Flux**, les libellés peuvent atteindre 64 points ;
une grande police peut également nécessiter davantage d'espacement.
Les dimensions des applications peuvent atteindre 400 % et la marge des
domaines 500 px. Après un agrandissement, relancer l'optimisation de la
disposition si les éléments se chevauchent.

Après optimisation, la vue conserve un zoom lisible et cadre l'application la
plus connectée et ses voisins proches si la carte ne tient pas à l'écran. Utiliser
« Recentrer » pour cadrer toute la carte ; l'annulation restaure également le
zoom et la position précédents. Les modifications de positions suivent les
règles habituelles de sauvegarde du projet.

En affichage statique comme au survol, les flux restent individuels. Le routage
privilégie les couloirs moins encombrés et pénalise les croisements. Les
étiquettes restent sur leur flux et leur emplacement est choisi pour limiter les
chevauchements avec les applications, les autres étiquettes et les autres flux.
Certains chevauchements peuvent rester inévitables sur une carte dense. Les
styles de tracé et les filtres restent disponibles.

Dans **Flux → Forme des flux**, « Courbes » applique aux flux visibles un
tracé courbe basé sur les mêmes trajets, en modes statique et survol. Certains
segments restent droits lorsque la courbe risquerait de traverser une
application. « Par défaut » rétablit les styles individuels ; ce choix est
enregistré avec les vues sauvegardées. Il ne garantit pas moins de croisements.

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
