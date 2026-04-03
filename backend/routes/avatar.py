from fastapi import APIRouter, HTTPException, UploadFile, File
import os
import logging
import shutil

logger = logging.getLogger("SANKEYTHIKA.AvatarRouter")
router = APIRouter()

def get_models_dir():
    """Resolve the frontend/public/models directory from wherever this file lives."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    project_root = os.path.dirname(backend_dir)
    target_dir = os.path.join(project_root, "frontend", "public", "models")
    os.makedirs(target_dir, exist_ok=True)
    return target_dir

@router.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...)):
    """
    Accepts a .vrm file uploaded directly from the browser (exported from VRoid Studio).
    Saves it as avatar.vrm in frontend/public/models/ for offline serving.
    """
    if not file.filename.lower().endswith(".vrm"):
        raise HTTPException(status_code=400, detail="Only .vrm files are accepted.")

    try:
        target_dir = get_models_dir()
        target_path = os.path.join(target_dir, "avatar.vrm")

        logger.info(f"Saving uploaded VRM to: {target_path}")
        with open(target_path, "wb") as out:
            shutil.copyfileobj(file.file, out)

        return {"status": "success", "path": "/models/avatar.vrm"}

    except Exception as e:
        logger.error(f"Failed to save avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
