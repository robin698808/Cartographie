from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db, settings
from datetime import datetime, timedelta, timezone
import uuid, smtplib, logging, json, urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import models, schemas, auth, audit

router = APIRouter()
logger = logging.getLogger(__name__)


def send_reset_email(to_email: str, reset_link: str):
    """Envoie l'email de réinitialisation. Si SMTP non configuré, log le lien."""
    if not settings.SMTP_HOST and not settings.BREVO_API_KEY:
        logger.warning(f"[DEV] Lien de réinitialisation pour {to_email}: {reset_link}")
        print(f"\n{'='*60}\nLien reset mot de passe ({to_email}):\n{reset_link}\n{'='*60}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Réinitialisation de votre mot de passe — Cartographe"
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F5F3FF;border-radius:12px">
      <div style="background:#fff;border-radius:10px;padding:32px;border:1px solid #E0E7FF">
        <h2 style="color:#1E1B4B;font-size:20px;margin:0 0 8px">Réinitialisation du mot de passe</h2>
        <p style="color:#64748B;font-size:14px;line-height:1.6;margin:0 0 24px">
          Vous avez demandé la réinitialisation de votre mot de passe.<br>
          Ce lien est valable <strong>1 heure</strong>.
        </p>
        <a href="{reset_link}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#94A3B8;font-size:12px;margin:24px 0 0">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </div>
    </div>
    """
    msg.attach(MIMEText(html, "html"))

    try:
        if settings.BREVO_API_KEY:
            req = urllib.request.Request(
                "https://api.brevo.com/v3/smtp/email",
                data=json.dumps({
                    "sender": {"email": msg["From"], "name": "Cartographe"},
                    "to": [{"email": to_email}],
                    "subject": msg["Subject"],
                    "htmlContent": html,
                }).encode(),
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "content-type": "application/json",
                    "accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=10) as r:
                logger.info("Email reset envoyé via Brevo API (%s)", r.status)
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as s:
                s.starttls()
                s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.sendmail(msg["From"], [to_email], msg.as_string())
    except Exception as e:
        # Ne jamais faire échouer la requête (et ne pas révéler si l'email existe)
        detail = getattr(e, "read", lambda: b"")().decode(errors="ignore")
        logger.error("Échec d'envoi de l'email de reset: %s %s", e, detail)


# ─── Auth ─────────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if auth.get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    # Premier utilisateur = admin
    is_first = db.query(models.User).count() == 0
    user = models.User(
        email=user_in.email,
        nom=user_in.nom,
        hashed_password=auth.hash_password(user_in.password),
        role=models.UserRole.admin if is_first else models.UserRole.member,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ─── Users (admin) ───────────────────────────────────────────────────────────

@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    return db.query(models.User).all()


@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.id != user_id and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Accès refusé")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Impossible de modifier son propre rôle")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if payload.role == models.UserRole.viewer:
        if db.query(models.Project).filter(models.Project.owner_id == user_id).first():
            raise HTTPException(status_code=409, detail="Transférez d'abord les projets dont cet utilisateur est propriétaire")
        for membership in user.memberships:
            if membership.role != models.MemberRole.viewer:
                audit.record(db, current_user, "member.role_changed", "user", user_id, membership.project_id,
                             {"old_role": membership.role.value, "new_role": "viewer"})
                membership.role = models.MemberRole.viewer
    audit.record(db, current_user, "user.role_changed", "user", user_id,
                 details={"old_role": user.role.value, "new_role": payload.role.value})
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/auth/me", response_model=schemas.UserOut)
def update_my_profile(
    payload: schemas.UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if payload.current_password or payload.new_password:
        if not payload.current_password or not payload.new_password:
            raise HTTPException(status_code=400, detail="Fournir ancien et nouveau mot de passe")
        if not auth.verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
        current_user.hashed_password = auth.hash_password(payload.new_password)
    if payload.nom is not None:
        current_user.nom = payload.nom
    if payload.prenom is not None:
        current_user.prenom = payload.prenom
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.avatar is not None:
        current_user.avatar = payload.avatar
    if payload.email is not None:
        existing = auth.get_user_by_email(db, payload.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")
        current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/auth/forgot-password", status_code=200)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = auth.get_user_by_email(db, payload.email)
    if user:
        token_str = str(uuid.uuid4())
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        token = models.PasswordResetToken(
            user_id=user.id,
            token=token_str,
            expires_at=expires,
        )
        db.add(token)
        db.commit()
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token_str}"
        send_reset_email(user.email, reset_link)
    return {"message": "Si cet email existe, un lien a été envoyé"}


@router.post("/auth/reset-password", status_code=200)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == payload.token,
        models.PasswordResetToken.used == False,
    ).first()
    if not token:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")
    now = datetime.now(timezone.utc)
    expires = token.expires_at
    if expires.tzinfo is None:
        from datetime import timezone as tz
        expires = expires.replace(tzinfo=tz.utc)
    if now > expires:
        raise HTTPException(status_code=400, detail="Lien expiré")
    token.user.hashed_password = auth.hash_password(payload.new_password)
    token.used = True
    db.commit()
    return {"message": "Mot de passe réinitialisé avec succès"}


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Impossible de supprimer son propre compte")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if db.query(models.Project).filter(models.Project.owner_id == user_id).first():
        raise HTTPException(status_code=409, detail="Transférez d'abord les projets dont cet utilisateur est propriétaire")
    audit.record(db, current_user, "user.deleted", "user", user_id)
    db.delete(user)
    db.commit()
