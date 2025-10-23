from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: str = "teacher"
    class_label: Optional[str] = None  # 👈 lisatud klassijuhataja väli
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
