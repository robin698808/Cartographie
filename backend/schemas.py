from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from models import UserRole, ProjectVisibility, MemberRole


# ─── Auth ───────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    nom: str
    password: str

class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None

class UserProfileUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None        # base64 data URL
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: UserRole

class UserOut(BaseModel):
    id: int
    email: str
    nom: str
    prenom: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ─── Project ─────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    nom: str
    description: Optional[str] = ""
    visibility: Optional[ProjectVisibility] = ProjectVisibility.private
    color: Optional[str] = "#6366F1"
    icon: Optional[str] = "Network"
    logo: Optional[str] = None
    project_type: Optional[str] = "deal"
    project_subtype: Optional[str] = None

class ProjectUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[ProjectVisibility] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    logo: Optional[str] = None
    project_type: Optional[str] = None
    project_subtype: Optional[str] = None

class ProjectOut(BaseModel):
    id: int
    nom: str
    description: str
    visibility: ProjectVisibility
    color: Optional[str] = "#6366F1"
    icon: Optional[str] = "Network"
    logo: Optional[str] = None
    project_type: Optional[str] = "deal"
    project_subtype: Optional[str] = None
    owner_id: int
    owner: UserOut
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = 0
    snapshot_count: Optional[int] = 0
    app_count: Optional[int] = 0
    flow_count: Optional[int] = 0
    effective_role: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Member ──────────────────────────────────────────────────────────────────

class MemberInvite(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.editor

class MemberRoleUpdate(BaseModel):
    role: MemberRole

class TransferOwnership(BaseModel):
    user_id: int

class MemberOut(BaseModel):
    id: int
    user: UserOut
    role: MemberRole
    joined_at: datetime

    class Config:
        from_attributes = True


# ─── Snapshot ────────────────────────────────────────────────────────────────

class SnapshotCreate(BaseModel):
    apps: Any             # list of app objects from the canvas
    flows: Any            # list of flow objects
    dom_colors: Any       # dict of domain colors
    label: Optional[str] = ""

class MapViewCreate(BaseModel):
    name: str
    shared: bool = False
    data: Any

class MapViewUpdate(BaseModel):
    name: Optional[str] = None
    shared: Optional[bool] = None
    data: Optional[Any] = None

class MapViewOut(BaseModel):
    id: int
    project_id: int
    name: str
    shared: bool
    data: Any
    owner_id: int
    owner_name: str = ""
    mine: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

class SnapshotOut(BaseModel):
    id: int
    project_id: int
    apps: Any
    flows: Any
    dom_colors: Any
    label: str
    created_by: Optional[int] = None
    created_by_user: Optional[UserOut] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── WebSocket messages ───────────────────────────────────────────────────────

class WSMessage(BaseModel):
    type: str           # "apps_update" | "flows_update" | "user_joined" | "user_left" | "cursor_move"
    payload: Any
    user_id: Optional[int] = None
    user_nom: Optional[str] = None
