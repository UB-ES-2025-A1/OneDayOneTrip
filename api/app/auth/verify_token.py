from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer
from firebase_admin import auth

security = HTTPBearer()

async def verify_token(request: Request):
    """Verifica el token JWT de Firebase enviado desde el frontend"""
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Falta token de autenticación")

    token = token.replace("Bearer ", "")

    try:
        decoded_token = auth.verify_id_token(token)
        request.state.user = decoded_token
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")
