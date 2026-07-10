from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import io

import os
import auth
from pptx_generator import generate_pptx

router = APIRouter(prefix="/export")

# Chemin relatif au fichier — fonctionne en local ET sur Railway/Docker
_HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(_HERE, "..", "assets", "template.pptx")


class ExportPptxRequest(BaseModel):
    apps: List[Dict[str, Any]] = []
    flows: List[Dict[str, Any]] = []
    opts: Dict[str, Any] = {}


@router.post("/pptx")
async def export_pptx(
    payload: ExportPptxRequest,
    current_user=Depends(auth.get_current_user),
):
    """Generate PPTX presentation from cartography data using the onepoint template."""
    try:
        pptx_bytes = generate_pptx(
            apps=payload.apps,
            flows=payload.flows,
            opts=payload.opts,
            template_path=TEMPLATE_PATH,
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
