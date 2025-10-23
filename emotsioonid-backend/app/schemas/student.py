from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    personal_code: Optional[str] = None
    birth_date: Optional[date] = None
    class_label: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    personal_code: Optional[str] = None
    birth_date: Optional[date] = None
    class_label: Optional[str] = None

class StudentRead(StudentBase):
    id: int
    created_at: datetime
