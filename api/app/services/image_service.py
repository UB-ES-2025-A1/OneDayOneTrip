# api/app/services/image_service.py
import requests
import base64
from fastapi import UploadFile
import os
from dotenv import load_dotenv

load_dotenv()

IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")
IMGBB_ALBUM_ID = os.getenv("IMGBB_ALBUM_ID")

def upload_image_to_imgbb(file: UploadFile):
    url = "https://api.imgbb.com/1/upload"
    image_data = base64.b64encode(file.file.read())
    payload = {
        "key": IMGBB_API_KEY,
        "image": image_data,
        "album": IMGBB_ALBUM_ID  # 👈 aquí va el álbum destino
    }
    response = requests.post(url, data=payload)
    response.raise_for_status()
    return response.json()["data"]["url"]
