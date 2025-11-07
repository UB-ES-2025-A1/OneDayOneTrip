from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# Cargar URI desde .env
MONGO_URI = os.getenv("MONGO_URI")

# Conectar al cluster
client = MongoClient(MONGO_URI)
db = client["OneDayOneTrip"]

# Colecciones
trips_collection = db["trips"]
comments_collection = db["comments"] 
ratings_collection = db["ratings"]
