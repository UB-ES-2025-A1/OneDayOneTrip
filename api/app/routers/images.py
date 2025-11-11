# api/app/routers/images.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.image_service import upload_image_to_imgbb

router = APIRouter(prefix="/images", tags=["Images"])

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Sube una imagen a ImgBB y devuelve la URL pública.
    """
    try:
        image_url = upload_image_to_imgbb(file)
        return {"url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
