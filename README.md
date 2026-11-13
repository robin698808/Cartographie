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

Au-delà de 100 flux, les applications reliées au plus grand nombre de domaines
distincts sont placées au centre de leur grille. Les autres sont ordonnées
selon les domaines partenaires des flux entrants et sortants, afin de rendre
les parcours plus directs. Le routeur continue d'éviter les cartes ; les
croisements entre flux restent possibles sur les graphes denses.

À chaque ouverture d'une cartographie, cette optimisation est lancée
automatiquement après le chargement des données. Dans un projet modifiable,
les nouvelles positions suivent la sauvegarde automatique habituelle ; le
bouton « Annuler l'optimisation » permet de revenir à la disposition précédente.
Cette annulation devient indisponible si les applications sont modifiées par
un autre utilisateur, afin de ne pas écraser ses changements.
En lecture seule, la disposition optimisée reste temporaire et n'est pas
enregistrée dans le projet.

Avec au plus 120 flux et les trois espacements à leurs valeurs par défaut,
l'optimisation compare également une disposition compacte. Elle la retient si
elle réduit la surface de la carte d'au moins 10 %, sans augmenter les flux
non routés, les étiquettes sur les applications, les recouvrements de zones
ou les tracés droits de remplacement. Les autres chevauchements d'étiquettes
et croisements peuvent augmenter au maximum de 10 % ou de deux occurrences.
Les espacements personnalisés désactivent cette variante.

Les étiquettes de flux sont mesurées avec leur police et peuvent être
réparties sur plusieurs lignes sans tronquer le texte. La même géométrie sert
à leur placement et à l'évaluation des dispositions ; elles restent sur
leur flux. Une forte densité peut néanmoins nécessiter un zoom ou le survol.

L'optimisation augmente les polices d'applications, de domaines et de flux,
l'épaisseur des flux ainsi que la taille des applications uniquement lorsque ces valeurs sont
encore à leurs valeurs par défaut. Les valeurs personnalisées restent
inchangées. Pour les flux, les valeurs automatiques tiennent compte du zoom
de la carte entière et visent 12 pixels pour les étiquettes et 1,5 pixel pour
les traits, dans les limites des réglages disponibles. Un avertissement invite
à zoomer lorsque ces limites ne suffisent pas. Les espacements prennent aussi en compte la hauteur mesurée des
étiquettes de flux, y compris celles sur plusieurs lignes.
L'optimisation et « Recentrer » cadrent toute la carte. L'annulation restaure
les valeurs automatiquement modifiées, sauf si elles ont été changées depuis.

L'optimisation conserve les polices personnalisées, notamment celles des
catégories et flux, ainsi que les autres réglages d'affichage.
Elle adapte les espaces entre applications, catégories et domaines aux
dimensions existantes, aux en-têtes et aux étiquettes de flux. Les dimensions
manuelles des domaines et catégories sont conservées ; les dimensions des
catégories générées automatiquement s'adaptent au contenu.
Si aucune disposition évaluée ne peut les respecter tout en contenant leurs
applications, l'optimisation ne déplace rien et invite à agrandir les zones
ou à réduire les espacements. Les domaines sans redimensionnement manuel
continuent à s'ajuster au contenu.
Selon le zoom et la densité, la lisibilité de tous les éléments simultanément
ne peut pas être garantie.

Dans **Affichage**, la police générale peut atteindre 400 %, les polices des
applications, domaines et catégories 600 %, les applications 800 %, la marge
des domaines 1 000 px et la taille des catégories 400 %. Dans **Flux**, les
libellés peuvent atteindre 96 points. Les grandes tailles peuvent nécessiter
une nouvelle optimisation pour limiter les chevauchements.

Après optimisation, « Recentrer » cadre toute la carte sans déplacer les
applications ; l'annulation restaure également le zoom et la position précédents.
Le pourcentage de zoom peut être saisi dans la barre de zoom, entre 1 et 250 %.
Les éventuels messages d'erreur sont affichés au-dessus de la zone de dessin ;
« Recentrer » tient compte des bordures et en-têtes des domaines et catégories.
Les modifications de positions suivent les
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
