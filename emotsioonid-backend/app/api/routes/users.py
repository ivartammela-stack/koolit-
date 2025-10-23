from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.api.deps import get_db, require_role
from app.schemas.user import UserCreate, UserRead
from app.models.user import User
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    # kontrollime, kas kasutaja juba olemas
    existing = db.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = get_password_hash(payload.password)
    new_user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        class_label=payload.class_label,
        hashed_password=hashed_pw,
        is_active=payload.is_active,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/", response_model=List[UserRead])
def list_users(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    return db.exec(select(User)).all()
