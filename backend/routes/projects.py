import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas, auth, audit

router = APIRouter(prefix="/projects")


def get_project_or_404(project_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .options(joinedload(models.Project.owner), joinedload(models.Project.members).joinedload(models.ProjectMember.user))
        .filter(models.Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return project


def effective_project_role(project: models.Project, user: models.User):
    if user.role == models.UserRole.admin:
        return "admin"
    member = next((m for m in project.members if m.user_id == user.id), None)
    if not member:
        return None
    if user.role == models.UserRole.viewer:
        return "viewer"
    if project.owner_id == user.id:
        return "owner"
    if member.role == models.MemberRole.owner:
        return "editor"
    return member.role.value


def check_project_access(
    project: models.Project,
    user: models.User,
    need_editor: bool = False,
    need_owner: bool = False,
):
    """Vérifie que l'utilisateur a accès au projet.
    - need_owner  : réservé au owner du projet (ou admin global)
    - need_editor : interdit aux viewers projet (ou admin global)
    """
    role = effective_project_role(project, user)
    if not role:
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")
    if need_owner and role not in ("admin", "owner"):
        raise HTTPException(status_code=403, detail="Action réservée au propriétaire du projet")
    if need_editor and role == "viewer":
        raise HTTPException(status_code=403, detail="Droits insuffisants (lecture seule)")


# ─── CRUD projets ─────────────────────────────────────────────────────────────

@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role == models.UserRole.admin:
        projects = db.query(models.Project).options(
            joinedload(models.Project.owner),
            joinedload(models.Project.members),
            joinedload(models.Project.snapshots),
        ).all()
    else:
        # projets dont je suis membre
        member_project_ids = [
            m.project_id for m in db.query(models.ProjectMember)
            .filter(models.ProjectMember.user_id == current_user.id).all()
        ]
        projects = db.query(models.Project).options(
            joinedload(models.Project.owner),
            joinedload(models.Project.members),
            joinedload(models.Project.snapshots),
        ).filter(models.Project.id.in_(member_project_ids)).all()

    result = []
    for p in projects:
        out = schemas.ProjectOut.model_validate(p)
        out.effective_role = effective_project_role(p, current_user)
        out.member_count = len(p.members)
        out.snapshot_count = len(p.snapshots)
        if p.snapshots:
            try:
                out.app_count = len(json.loads(p.snapshots[0].apps or "[]"))
                out.flow_count = len(json.loads(p.snapshots[0].flows or "[]"))
            except (ValueError, TypeError):
                pass
        result.append(out)
    return result


@router.post("", response_model=schemas.ProjectOut, status_code=201)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Rôle viewer global : lecture seule, ne peut pas créer de projet
    if current_user.role == models.UserRole.viewer:
        raise HTTPException(status_code=403, detail="Les lecteurs ne peuvent pas créer de projet")
    project = models.Project(
        nom=project_in.nom,
        description=project_in.description or "",
        visibility=project_in.visibility,
        color=project_in.color or "#6366F1",
        icon=project_in.icon or "Network",
        logo=project_in.logo,
        project_type=project_in.project_type or "deal",
        project_subtype=project_in.project_subtype,
        owner_id=current_user.id,
    )
    db.add(project)
    db.flush()

    # Owner est automatiquement membre avec rôle owner
    member = models.ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=models.MemberRole.owner,
    )
    db.add(member)

    # Snapshot initial vide
    snap = models.Snapshot(
        project_id=project.id,
        apps="[]",
        flows="[]",
        dom_colors="{}",
        label="Initialisation",
        created_by=current_user.id,
    )
    db.add(snap)
    audit.record(db, current_user, "project.created", "project", project.id, project.id)
    db.commit()
    db.refresh(project)
    return get_project_or_404(project.id, db)


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    out = schemas.ProjectOut.model_validate(project)
    out.effective_role = effective_project_role(project, current_user)
    out.member_count = len(project.members)
    out.snapshot_count = len(project.snapshots)
    return out


@router.patch("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    # Modifier les métadonnées du projet : owner uniquement
    check_project_access(project, current_user, need_owner=True)
    for field, value in project_in.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    audit.record(db, current_user, "project.updated", "project", project_id, project_id,
                 {"fields": list(project_in.model_dump(exclude_none=True))})
    db.commit()
    db.refresh(project)
    return get_project_or_404(project_id, db)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    if project.owner_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Seul le propriétaire peut supprimer ce projet")
    if current_user.role == models.UserRole.viewer:
        raise HTTPException(status_code=403, detail="Droits insuffisants (lecture seule)")
    audit.record(db, current_user, "project.deleted", "project", project_id, project_id)
    db.query(models.ProjectPptxTemplate).filter_by(project_id=project_id).delete()
    db.delete(project)
    db.commit()


# ─── Membres ──────────────────────────────────────────────────────────────────

@router.get("/{project_id}/members", response_model=list[schemas.MemberOut])
def list_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    return project.members


@router.post("/{project_id}/members", response_model=schemas.MemberOut, status_code=201)
def invite_member(
    project_id: int,
    invite: schemas.MemberInvite,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user, need_owner=True)

    target = db.query(models.User).filter(models.User.email == invite.email).first()
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable avec cet email")

    existing = next((m for m in project.members if m.user_id == target.id), None)
    if existing:
        raise HTTPException(status_code=400, detail="Cet utilisateur est déjà membre")
    if invite.role == models.MemberRole.owner:
        raise HTTPException(status_code=400, detail="Utilisez le transfert de propriété")
    if target.role == models.UserRole.viewer and invite.role != models.MemberRole.viewer:
        raise HTTPException(status_code=400, detail="Un lecteur global ne peut avoir que le rôle lecteur")

    member = models.ProjectMember(
        project_id=project_id,
        user_id=target.id,
        role=invite.role,
    )
    db.add(member)
    audit.record(db, current_user, "member.added", "user", target.id, project_id, {"role": invite.role.value})
    db.commit()
    db.refresh(member)
    return member


@router.patch("/{project_id}/members/{user_id}", response_model=schemas.MemberOut)
def update_member_role(
    project_id: int,
    user_id: int,
    payload: schemas.MemberRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user, need_owner=True)
    member = next((m for m in project.members if m.user_id == user_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    if member.user_id == project.owner_id:
        raise HTTPException(status_code=400, detail="Impossible de modifier le rôle du propriétaire")
    if payload.role == models.MemberRole.owner:
        raise HTTPException(status_code=400, detail="Utilisez le transfert de propriété")
    if member.user.role == models.UserRole.viewer and payload.role != models.MemberRole.viewer:
        raise HTTPException(status_code=400, detail="Un lecteur global ne peut avoir que le rôle lecteur")
    audit.record(db, current_user, "member.role_changed", "user", user_id, project_id,
                 {"old_role": member.role.value, "new_role": payload.role.value})
    member.role = payload.role
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user, need_owner=True)
    member = next((m for m in project.members if m.user_id == user_id), None)
    if not member:
        raise HTTPException(status_code=404, detail="Membre introuvable")
    if member.user_id == project.owner_id:
        raise HTTPException(status_code=400, detail="Impossible de retirer le propriétaire")
    audit.record(db, current_user, "member.removed", "user", user_id, project_id, {"role": member.role.value})
    db.delete(member)
    db.commit()


@router.post("/{project_id}/transfer-ownership", response_model=schemas.ProjectOut)
def transfer_ownership(
    project_id: int,
    payload: schemas.TransferOwnership,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user, need_owner=True)
    target = next((m for m in project.members if m.user_id == payload.user_id), None)
    previous = next((m for m in project.members if m.user_id == project.owner_id), None)
    if not target or target.user.role == models.UserRole.viewer:
        raise HTTPException(status_code=400, detail="Le nouveau propriétaire doit être un membre non lecteur global")
    if not previous:
        raise HTTPException(status_code=409, detail="Le propriétaire actuel n'est pas membre du projet")
    if target.user_id == project.owner_id:
        raise HTTPException(status_code=400, detail="Cet utilisateur est déjà propriétaire")
    old_owner_id = project.owner_id
    updated = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.owner_id == old_owner_id,
    ).update({models.Project.owner_id: target.user_id}, synchronize_session=False)
    if updated != 1:
        db.rollback()
        raise HTTPException(status_code=409, detail="Le propriétaire a changé ; rechargez le projet")
    for member in project.members:
        if member.role == models.MemberRole.owner:
            member.role = models.MemberRole.viewer if member.user.role == models.UserRole.viewer else models.MemberRole.editor
    previous.role = models.MemberRole.viewer if previous.user.role == models.UserRole.viewer else models.MemberRole.editor
    db.flush()
    target.role = models.MemberRole.owner
    db.expire(project, ["owner_id", "owner"])
    audit.record(db, current_user, "project.ownership_transferred", "project", project_id, project_id,
                 {"old_owner_id": old_owner_id, "new_owner_id": target.user_id})
    db.commit()
    result = schemas.ProjectOut.model_validate(get_project_or_404(project_id, db))
    result.effective_role = effective_project_role(project, current_user)
    return result
