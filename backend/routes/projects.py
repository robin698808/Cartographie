from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas, auth

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
    if user.role == models.UserRole.admin:
        return  # admin global : accès total
    member = next((m for m in project.members if m.user_id == user.id), None)
    if not member:
        raise HTTPException(status_code=403, detail="Accès refusé à ce projet")
    if need_owner and member.role != models.MemberRole.owner:
        raise HTTPException(status_code=403, detail="Action réservée au propriétaire du projet")
    if need_editor and member.role == models.MemberRole.viewer:
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
        out.member_count = len(p.members)
        out.snapshot_count = len(p.snapshots)
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

    member = models.ProjectMember(
        project_id=project_id,
        user_id=target.id,
        role=invite.role,
    )
    db.add(member)
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
    if member.role == models.MemberRole.owner:
        raise HTTPException(status_code=400, detail="Impossible de modifier le rôle du propriétaire")
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
    if member.role == models.MemberRole.owner:
        raise HTTPException(status_code=400, detail="Impossible de retirer le propriétaire")
    db.delete(member)
    db.commit()
