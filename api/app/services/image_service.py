# api/app/services/image_service.py
import requests
import base64
from fastapi import UploadFile
import os
from dotenv import load_dotenv

load_dotenv()

IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")


def upload_image_to_imgbb(file: UploadFile):
    """Puja una imatge a imageBB o retorna una URL mock si no hi ha API key."""
    if not IMGBB_API_KEY:
        print("[WARN] ⚠️ IMGBB_API_KEY no definit, retornant URL mock.")
        return f"https://fake.imgbb.com/{file.filename or 'mock_image.jpg'}"

    try:
        url = "https://api.imgbb.com/1/upload"
        image_data = base64.b64encode(file.file.read())
        payload = {"key": IMGBB_API_KEY, "image": image_data}
        response = requests.post(url, data=payload)
        response.raise_for_status()
        return response.json()["data"]["url"]
    except Exception as e:
        print(f"[ERROR] ❌ Error pujant imatge a ImgBB: {e}")
        return f"https://fake.imgbb.com/error_{file.filename or 'unknown'}.jpg"
