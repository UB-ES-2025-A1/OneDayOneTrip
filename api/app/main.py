from fastapi import FastAPI
from app.routers import users
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permitir frontend después (por ahora todo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)

@app.get("/")
def root():
    return {"status": "API funcionando"}
