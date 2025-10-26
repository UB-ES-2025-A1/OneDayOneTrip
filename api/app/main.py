from fastapi import FastAPI
from .routers import users

app = FastAPI()

# Registrar rutas
app.include_router(users.router)

@app.get("/")
def root():
    return {"status": "API funcionando "}
