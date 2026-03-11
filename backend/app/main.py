from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.base import Base

from app.models.user import User
from app.models.task import Task

from app.routers.auth import router as auth_router
from app.routers.tasks import router as tasks_router

from app.services.auth import require_user

app = FastAPI(title="TODO MINI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(tasks_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/v1/protected")
def protected_route(user_email: str = Depends(require_user)):
    return {"message": "you are authorized", "user": user_email}