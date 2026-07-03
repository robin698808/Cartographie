from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, settings
from routes import users, projects, snapshots, ws

# Crée les tables au démarrage (dev — en prod, utiliser Alembic)
Base.metadata.create_all(bind=engine)

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
app.include_router(ws.router, tags=["WebSocket"])


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
