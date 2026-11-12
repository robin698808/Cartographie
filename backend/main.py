import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, settings
from routes import users, projects, snapshots, views, ws, export, settings_routes


def run_migrations(engine):
    """Add new columns to existing tables if they don't exist."""
    from sqlalchemy import text, inspect
    with engine.connect() as conn:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('projects')]
        if 'project_type' not in columns:
            conn.execute(text("ALTER TABLE projects ADD COLUMN project_type VARCHAR DEFAULT 'deal' NOT NULL"))
        if 'project_subtype' not in columns:
            conn.execute(text("ALTER TABLE projects ADD COLUMN project_subtype VARCHAR"))
        duplicates = conn.execute(text(
            "SELECT project_id FROM project_members WHERE role = 'owner' "
            "GROUP BY project_id HAVING COUNT(*) > 1 LIMIT 1"
        )).first()
        if duplicates:
            logging.getLogger(__name__).warning(
                "Contrainte de propriétaire unique non installée : plusieurs propriétaires "
                "existent pour un projet. Régularisez les rôles puis redémarrez."
            )
        elif engine.dialect.name in ("sqlite", "postgresql"):
            conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_project_single_owner "
                "ON project_members (project_id) WHERE role = 'owner'"
            ))
        else:
            logging.getLogger(__name__).warning(
                "Contrainte de propriétaire unique non installée : moteur de base non pris en charge."
            )
        conn.commit()

# Crée les tables au démarrage (dev — en prod, utiliser Alembic)
Base.metadata.create_all(bind=engine)
run_migrations(engine)

app = FastAPI(
    title="Cartographe API",
    description="API backend pour la cartographie applicative collaborative",
    version="1.0.0",
)

# CORS — origines pilotées par la config (CORS_ORIGINS, séparées par des virgules).
# Derrière le reverse proxy (même origine), le CORS n'est pas sollicité ;
# utile surtout en accès direct à l'API depuis un autre domaine.
_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] or ["*"]
# allow_credentials n'est pas compatible avec "*" côté navigateur ; l'auth
# passant par un header Bearer, on ne l'active que pour des origines explicites.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials="*" not in _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router, prefix="/api", tags=["Auth & Users"])
app.include_router(projects.router, prefix="/api", tags=["Projects"])
app.include_router(snapshots.router, prefix="/api", tags=["Snapshots"])
app.include_router(views.router, prefix="/api", tags=["Views"])
app.include_router(ws.router, tags=["WebSocket"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(settings_routes.router, prefix="/api", tags=["Settings"])


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
