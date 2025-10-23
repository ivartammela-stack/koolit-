from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import date, datetime

class Student(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    personal_code: Optional[str] = Field(default=None, index=True, unique=True)  # valikuline
    birth_date: Optional[date] = None
    class_label: Optional[str] = Field(default=None, index=True)  # nt 7B
    created_at: datetime = Field(default_factory=datetime.utcnow)
