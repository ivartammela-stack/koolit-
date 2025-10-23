from sqlmodel import SQLModel
from app.db.session import engine
from app.crud.user import crud_user
from sqlmodel import Session

def init_db():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        crud_user.create_admin_if_missing(session)
