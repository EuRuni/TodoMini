from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import RegisterIn
from app.services.security import hash_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):



    existing = db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    try:
        password_hash = hash_password(data.password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    user = User(email=data.email, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "email": user.email}

from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import RegisterIn, LoginIn, TokenOut
from app.services.security import hash_password, verify_password
from app.services.tokens import create_access_token

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=user.email)
    return {"access_token": token}