import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas, auth, audit
from routes.projects import get_project_or_404, check_project_access

router = APIRouter(prefix="/projects/{project_id}/snapshots")


@router.get("", response_model=list[schemas.SnapshotOut])
def list_snapshots(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    snaps = (
        db.query(models.Snapshot)
        .options(joinedload(models.Snapshot.created_by_user))
        .filter(models.Snapshot.project_id == project_id)
        .order_by(models.Snapshot.created_at.desc())
        .limit(50)
        .all()
    )
    return [_snap_out(s) for s in snaps]


@router.get("/latest", response_model=schemas.SnapshotOut)
def get_latest_snapshot(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    snap = (
        db.query(models.Snapshot)
        .filter(models.Snapshot.project_id == project_id)
        .order_by(models.Snapshot.created_at.desc())
        .first()
    )
    if not snap:
        raise HTTPException(status_code=404, detail="Aucun snapshot trouvé")
    return _snap_out(snap)


@router.post("", response_model=schemas.SnapshotOut, status_code=201)
def create_snapshot(
    project_id: int,
    snap_in: schemas.SnapshotCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user, need_editor=True)

    snap = models.Snapshot(
        project_id=project_id,
        apps=json.dumps(snap_in.apps, ensure_ascii=False),
        flows=json.dumps(snap_in.flows, ensure_ascii=False),
        dom_colors=json.dumps(snap_in.dom_colors, ensure_ascii=False),
        label=snap_in.label or "",
        created_by=current_user.id,
    )
    db.add(snap)
    audit.record(db, current_user, "snapshot.created", "project", project_id, project_id)

    # Garder max 100 snapshots par projet (nettoyage auto)
    old_snaps = (
        db.query(models.Snapshot)
        .filter(models.Snapshot.project_id == project_id)
        .order_by(models.Snapshot.created_at.desc())
        .offset(99)
        .all()
    )
    for old in old_snaps:
        db.delete(old)

    db.commit()
    db.refresh(snap)
    return _snap_out(snap)


@router.get("/{snapshot_id}", response_model=schemas.SnapshotOut)
def get_snapshot(
    project_id: int,
    snapshot_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    snap = db.query(models.Snapshot).filter(
        models.Snapshot.id == snapshot_id,
        models.Snapshot.project_id == project_id,
    ).first()
    if not snap:
        raise HTTPException(status_code=404, detail="Snapshot introuvable")
    return _snap_out(snap)


def _snap_out(snap: models.Snapshot) -> schemas.SnapshotOut:
    """Helper: désérialise les JSON stockés en string."""
    return schemas.SnapshotOut(
        id=snap.id,
        project_id=snap.project_id,
        apps=json.loads(snap.apps or "[]"),
        flows=json.loads(snap.flows or "[]"),
        dom_colors=json.loads(snap.dom_colors or "{}"),
        label=snap.label or "",
        created_by=snap.created_by,
        created_by_user=snap.created_by_user,
        created_at=snap.created_at,
    )
