from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EmotionCreate(BaseModel):
    student_id: int
    mood: int = Field(ge=1, le=5)
    note: Optional[str] = None

class EmotionRead(BaseModel):
    id: int
    student_id: int
    mood: int
    note: Optional[str]
    created_by_user_id: int
    created_at: datetime
