from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True, unique=True)
    full_name: Optional[str] = None
    role: str = Field(default="admin")  # admin | teacher | counselor | student | parent
    class_label: str | None = None   # ← UUS: klassijuhataja klass (nt "7B")
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
