from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from app.api.deps import get_db
from app.schemas.token import Token
from app.core.security import create_access_token
from app.crud.user import crud_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud_user.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = create_access_token(subject=user.username)
    return Token(access_token=token)
