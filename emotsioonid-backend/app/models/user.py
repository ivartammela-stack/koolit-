from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)  # <— oluline: tüüp lisatud
    username: str
    hashed_password: str
    role: str
    class_label: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
