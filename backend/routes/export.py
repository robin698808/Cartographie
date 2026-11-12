from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io
import zipfile

import os
import auth, models
from database import get_db
from sqlalchemy.orm import Session
from pptx import Presentation
from pptx.exc import PackageNotFoundError
from lxml.etree import XMLSyntaxError
from routes.projects import get_project_or_404, check_project_access
from pptx_generator import generate_pptx, plan_pptx, SECTIONS

router = APIRouter(prefix="/export")

# Chemin relatif au fichier — fonctionne en local ET sur Railway/Docker
_HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(_HERE, "..", "assets", "template.pptx")
MAX_TEMPLATE_SIZE = 25 * 1024 * 1024
MAX_UNCOMPRESSED_SIZE = 150 * 1024 * 1024


class ExportPptxRequest(BaseModel):
    apps: List[Dict[str, Any]] = []
    flows: List[Dict[str, Any]] = []
    opts: Dict[str, Any] = {}
    project_id: Optional[int] = None


def _project_template(project_id, db, current_user, need_editor=False):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user, need_editor=need_editor)
    return db.get(models.ProjectPptxTemplate, project_id)


def _template_for_request(payload, db, current_user):
    if payload.project_id is None:
        return TEMPLATE_PATH, False
    template = _project_template(payload.project_id, db, current_user)
    return (io.BytesIO(template.content), True) if template else (TEMPLATE_PATH, False)


def _validate_template(content):
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            files = archive.infolist()
            names = {item.filename for item in files}
            if len(files) > 5000 or sum(item.file_size for item in files) > MAX_UNCOMPRESSED_SIZE:
                raise ValueError("Le contenu décompressé du modèle est trop volumineux.")
            if "[Content_Types].xml" not in names or "ppt/presentation.xml" not in names:
                raise ValueError("Le fichier n'est pas une présentation PPTX valide.")
            if any(name.lower().endswith("vbaproject.bin") and not name.lower().startswith("ppt/embeddings/") for name in names):
                raise ValueError("Les présentations contenant des macros ne sont pas acceptées.")
        prs = Presentation(io.BytesIO(content))
        if prs.part.content_type != "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml":
            raise ValueError("Le fichier doit être une présentation PPTX sans macros.")
        if not prs.slide_width or not prs.slide_height or not prs.slide_layouts:
            raise ValueError("Le modèle doit contenir au moins une disposition et une taille de diapositive valide.")
    except (zipfile.BadZipFile, PackageNotFoundError, XMLSyntaxError, KeyError, ValueError, OSError) as exc:
        raise HTTPException(status_code=400, detail=f"Modèle PPTX invalide : {exc}") from exc


@router.get("/pptx/template/{project_id}")
def get_template(project_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    template = _project_template(project_id, db, current_user)
    return {"filename": template.filename if template else None}


@router.put("/pptx/template/{project_id}")
async def put_template(project_id: int, file: UploadFile = File(...),
                       db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    template = _project_template(project_id, db, current_user, need_editor=True)
    filename = (file.filename or "").replace("\\", "/").split("/")[-1]
    if not filename.lower().endswith(".pptx") or len(filename) > 255:
        raise HTTPException(status_code=400, detail="Sélectionnez un fichier .pptx valide.")
    content = await file.read(MAX_TEMPLATE_SIZE + 1)
    if len(content) > MAX_TEMPLATE_SIZE:
        raise HTTPException(status_code=413, detail="Le modèle dépasse la limite de 25 Mo.")
    _validate_template(content)
    if template is None:
        template = models.ProjectPptxTemplate(project_id=project_id)
        db.add(template)
    template.filename = filename
    template.content = content
    db.commit()
    return {"filename": filename}


@router.delete("/pptx/template/{project_id}", status_code=204)
def delete_template(project_id: int, db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    template = _project_template(project_id, db, current_user, need_editor=True)
    if template:
        db.delete(template)
        db.commit()


@router.get("/pptx/sections")
async def export_sections(current_user=Depends(auth.get_current_user)):
    return {"sections": SECTIONS}


@router.post("/pptx/plan")
async def export_pptx_plan(
    payload: ExportPptxRequest,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    template, custom = _template_for_request(payload, db, current_user)
    try:
        return await run_in_threadpool(plan_pptx, payload.apps, payload.flows, payload.opts,
                                       template, custom_template=custom)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur plan PPTX: {str(e)}")


@router.post("/pptx")
async def export_pptx(
    payload: ExportPptxRequest,
    current_user=Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Generate PPTX presentation from cartography data using the onepoint template."""
    template, custom = _template_for_request(payload, db, current_user)
    try:
        pptx_bytes = await run_in_threadpool(
            generate_pptx,
            apps=payload.apps,
            flows=payload.flows,
            opts=payload.opts,
            template_path=template,
            custom_template=custom,
        )
        return StreamingResponse(
            io.BytesIO(pptx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": 'attachment; filename="cartographie.pptx"',
                "Content-Length": str(len(pptx_bytes)),
            },
        )
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Template PPTX introuvable sur le serveur")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération PPTX: {str(e)}")
