from typing import Optional
from sqlmodel import Session, select
from app.models.user import User
from app.core.security import get_password_hash, verify_password

class CRUDUser:
    def get_by_username(self, session: Session, username: str) -> Optional[User]:
        return session.exec(select(User).where(User.username == username)).first()

    def create_admin_if_missing(self, session: Session):
        admin = session.exec(select(User).where(User.username == "admin")).first()
        if not admin:
            user = User(username="admin", role="admin", hashed_password=get_password_hash("admin123"))
            session.add(user)
            session.commit()

    def authenticate(self, session: Session, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(session, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

crud_user = CRUDUser()
