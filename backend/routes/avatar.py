from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import urllib.request
import os
import logging

logger = logging.getLogger("SANKEYTHIKA.AvatarRouter")
router = APIRouter()

class AvatarUrlRequest(BaseModel):
    url: str

@router.post("/download-avatar")
async def download_avatar(payload: AvatarUrlRequest):
    try:
        # Resolve target path
        frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
        target_dir = os.path.join(frontend_dir, "public", "models")
        os.makedirs(target_dir, exist_ok=True)
        
        target_file = os.path.join(target_dir, "avatar.glb")
        
        logger.info(f"Downloading avatar from {payload.url} to {target_file}")
        
        # Act as a browser to avoid 403s on RPM
        req = urllib.request.Request(payload.url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(target_file, 'wb') as f:
                f.write(response.read())
                
        return {"status": "success", "message": "Avatar downloaded and saved for offline use."}
        
    except Exception as e:
        logger.error(f"Failed to download avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
