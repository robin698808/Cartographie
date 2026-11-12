import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db, settings, SessionLocal
import models
from routes.projects import effective_project_role

router = APIRouter()

# Connexions actives par projet : {project_id: {user_id: WebSocket}}
active_connections: dict[int, dict[int, WebSocket]] = {}
# Infos utilisateurs connectés : {user_id: {"nom": str, "project_id": int}}
connected_users: dict[int, dict] = {}


async def broadcast_to_project(project_id: int, message: dict, exclude_user_id: int = None):
    """Envoie un message à tous les connectés sur un projet sauf l'émetteur."""
    if project_id not in active_connections:
        return
    disconnected = []
    for uid, ws in active_connections[project_id].items():
        if uid == exclude_user_id:
            continue
        try:
            await ws.send_json(message)
        except Exception:
            disconnected.append(uid)
    for uid in disconnected:
        active_connections[project_id].pop(uid, None)


def get_presence_list(project_id: int) -> list[dict]:
    if project_id not in active_connections:
        return []
    return [
        {"user_id": uid, "nom": connected_users.get(uid, {}).get("nom", "?")}
        for uid in active_connections[project_id]
    ]


@router.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    # Authentification via token en query param
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            await websocket.close(code=4001, reason="Utilisateur introuvable")
            return
    except (JWTError, Exception):
        await websocket.close(code=4001, reason="Token invalide")
        return

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    initial_role = effective_project_role(project, user) if project else None
    if not initial_role:
        await websocket.close(code=4003, reason="Accès refusé")
        return

    await websocket.accept()

    # Enregistrer la connexion
    if project_id not in active_connections:
        active_connections[project_id] = {}
    active_connections[project_id][user_id] = websocket
    connected_users[user_id] = {"nom": user.nom, "project_id": project_id}

    # Notifier les autres
    await broadcast_to_project(project_id, {
        "type": "user_joined",
        "user_id": user_id,
        "user_nom": user.nom,
        "presence": get_presence_list(project_id),
    }, exclude_user_id=user_id)

    # Envoyer la liste de présence à l'arrivant
    await websocket.send_json({
        "type": "presence_init",
        "presence": get_presence_list(project_id),
    })

    try:
        while True:
            with SessionLocal() as fresh_db:
                fresh_user = fresh_db.get(models.User, user_id)
                fresh_project = fresh_db.get(models.Project, project_id)
                role = effective_project_role(fresh_project, fresh_user) if fresh_user and fresh_project else None
            if role != initial_role:
                await websocket.close(code=4003, reason="Droits du projet modifiés")
                break
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=2)
            except asyncio.TimeoutError:
                continue
            with SessionLocal() as fresh_db:
                fresh_user = fresh_db.get(models.User, user_id)
                fresh_project = fresh_db.get(models.Project, project_id)
                role = effective_project_role(fresh_project, fresh_user) if fresh_user and fresh_project else None
            if role != initial_role:
                await websocket.close(code=4003, reason="Droits du projet modifiés")
                break
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type", "")

            # Broadcasts acceptés : modifications canvas
            if msg_type in ("apps_update", "flows_update", "dom_colors_update") and role == "viewer":
                await websocket.send_json({"type": "error", "message": "Droits insuffisants (lecture seule)"})
                continue
            if msg_type in ("apps_update", "flows_update", "dom_colors_update", "cursor_move"):
                await broadcast_to_project(project_id, {
                    "type": msg_type,
                    "payload": msg.get("payload"),
                    "user_id": user_id,
                    "user_nom": user.nom,
                }, exclude_user_id=user_id)

    except WebSocketDisconnect:
        pass
    finally:
        active_connections.get(project_id, {}).pop(user_id, None)
        connected_users.pop(user_id, None)
        if project_id in active_connections and not active_connections[project_id]:
            del active_connections[project_id]

        await broadcast_to_project(project_id, {
            "type": "user_left",
            "user_id": user_id,
            "user_nom": user.nom,
            "presence": get_presence_list(project_id),
        })
