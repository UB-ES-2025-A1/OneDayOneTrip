# api/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import trips, comments, ratings, images, users
from app.services.mongo_service import init_indexes, close_client


# Lifespan: sustituye a @app.on_event("startup"/"shutdown")
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    init_indexes()          # crea índices (idempotente)
    yield
    # SHUTDOWN
    close_client()          # cierra el cliente de Mongo si existe


app = FastAPI(
    title="OneDayOneTrip API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS (ajusta orígenes en prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # ej: ["https://tu-frontend.web.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(trips.router)
app.include_router(comments.router)
app.include_router(ratings.router)
app.include_router(images.router)
app.include_router(users.router)


# Health/root
@app.get("/")
def root():
    return {"status": "API funcionando"}
