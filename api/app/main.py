from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users

app = FastAPI(title="OneDayOneTrip API")

# Permitir llamadas desde tu frontend (ajusta dominio si lo sabes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # o ["https://tu-frontend.web.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(users.router)

@app.get("/")
def root():
    return {"status": "API funcionando"}
