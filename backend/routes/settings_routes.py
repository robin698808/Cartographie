import json
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
import models, auth, audit

router = APIRouter(prefix="/settings")

KEY = "option_lists"


class OptionItem(BaseModel):
    value: str = Field(min_length=1, max_length=60)
    en: Optional[str] = Field(default="", max_length=60)
    color: Optional[str] = Field(default="#94A3B8", pattern=r"^#[0-9A-Fa-f]{6}$")


class OptionLists(BaseModel):
    statuts: List[OptionItem] = Field(max_length=60)
    appTypes: List[OptionItem] = Field(max_length=60)


def _dedupe(items: List[OptionItem]) -> List[OptionItem]:
    seen, out = set(), []
    for it in items:
        v = it.value.strip()
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(OptionItem(value=v, en=(it.en or "").strip(), color=it.color or "#94A3B8"))
    return out


@router.get("/option-lists")
def get_option_lists(db: Session = Depends(get_db), _: models.User = Depends(auth.get_current_user)):
    row = db.get(models.AppSetting, KEY)
    return json.loads(row.value) if row and row.value else None


@router.put("/option-lists")
def put_option_lists(body: OptionLists, db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_admin)):
    data = {"statuts": [i.model_dump() for i in _dedupe(body.statuts)],
            "appTypes": [i.model_dump() for i in _dedupe(body.appTypes)]}
    row = db.get(models.AppSetting, KEY)
    if row:
        row.value = json.dumps(data, ensure_ascii=False)
    else:
        db.add(models.AppSetting(key=KEY, value=json.dumps(data, ensure_ascii=False)))
    audit.record(db, current_user, "settings.updated", "settings", 0, details={"key": KEY})
    db.commit()
    return data
