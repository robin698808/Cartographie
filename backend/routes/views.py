import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from routes.projects import get_project_or_404, check_project_access

router = APIRouter(prefix="/projects/{project_id}/views")

MAX_VIEW_BYTES = 2_000_000


def _is_viewer(project: models.Project, user: models.User) -> bool:
    if user.role == models.UserRole.admin:
        return False
    member = next((m for m in project.members if m.user_id == user.id), None)
    return bool(member and member.role == models.MemberRole.viewer)


def _out(v: models.MapView, user: models.User) -> schemas.MapViewOut:
    owner = v.owner
    name = " ".join(x for x in [getattr(owner, "prenom", None), getattr(owner, "nom", None)] if x) if owner else ""
    return schemas.MapViewOut(
        id=v.id,
        project_id=v.project_id,
        name=v.name,
        shared=v.shared,
        data=json.loads(v.data or "{}"),
        owner_id=v.owner_id,
        owner_name=name,
        mine=v.owner_id == user.id,
        created_at=v.created_at,
        updated_at=v.updated_at,
    )


def _dump(data) -> str:
    raw = json.dumps(data, ensure_ascii=False)
    if len(raw.encode("utf-8")) > MAX_VIEW_BYTES:
        raise HTTPException(status_code=413, detail="Vue trop volumineuse")
    return raw


def _get_view(project_id: int, view_id: int, db: Session) -> models.MapView:
    v = db.query(models.MapView).filter(
        models.MapView.id == view_id, models.MapView.project_id == project_id
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vue introuvable")
    return v


@router.get("", response_model=list[schemas.MapViewOut])
def list_views(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    views = (
        db.query(models.MapView)
        .filter(
            models.MapView.project_id == project_id,
            or_(models.MapView.shared == True, models.MapView.owner_id == current_user.id),  # noqa: E712
        )
        .order_by(models.MapView.created_at.asc())
        .all()
    )
    return [_out(v, current_user) for v in views]


@router.post("", response_model=schemas.MapViewOut, status_code=201)
def create_view(
    project_id: int,
    body: schemas.MapViewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=422, detail="Nom requis")
    if body.shared and _is_viewer(project, current_user):
        raise HTTPException(status_code=403, detail="Droits insuffisants pour partager une vue")
    v = models.MapView(
        project_id=project_id,
        owner_id=current_user.id,
        name=name[:80],
        shared=body.shared,
        data=_dump(body.data),
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return _out(v, current_user)


@router.patch("/{view_id}", response_model=schemas.MapViewOut)
def update_view(
    project_id: int,
    view_id: int,
    body: schemas.MapViewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    v = _get_view(project_id, view_id, db)
    if v.owner_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Seul le créateur peut modifier cette vue")
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=422, detail="Nom requis")
        v.name = name[:80]
    if body.shared is not None:
        if body.shared and _is_viewer(project, current_user):
            raise HTTPException(status_code=403, detail="Droits insuffisants pour partager une vue")
        v.shared = body.shared
    if body.data is not None:
        v.data = _dump(body.data)
    db.commit()
    db.refresh(v)
    return _out(v, current_user)


@router.delete("/{view_id}", status_code=204)
def delete_view(
    project_id: int,
    view_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    v = _get_view(project_id, view_id, db)
    if v.owner_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Seul le créateur peut supprimer cette vue")
    db.delete(v)
    db.commit()
