from fastapi import FastAPI, Depends

from app.db.session import engine
from app.db.base import Base
from app.models.user import User

from app.routers.auth import router as auth_router

app = FastAPI(title="TODO MINI API", version="0.1.0")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)

@app.get("/health")
def health():
    return {"status": "ok"}

from app.services.auth import require_user

@app.get("/api/v1/protected")
def protected_route(user_email: str = Depends(require_user)):
    return {"message": "you are authorized", "user": user_email}