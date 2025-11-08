# api/app/services/image_service.py
import requests
import base64
from fastapi import UploadFile
import os
from dotenv import load_dotenv

load_dotenv()

IMGBB_API_KEY = os.getenv("IMGBB_API_KEY")

def upload_image_to_imgbb(file: UploadFile):
    url = "https://api.imgbb.com/1/upload"
    image_data = base64.b64encode(file.file.read())
    payload = {
        "key": IMGBB_API_KEY,
        "image": image_data
    }
    response = requests.post(url, data=payload)
    response.raise_for_status()
    return response.json()["data"]["url"]


#Microservicio imgBB