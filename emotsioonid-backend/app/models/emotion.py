from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class EmotionEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="student.id", index=True)
    mood: int = Field(ge=1, le=5, description="1=väga halb, 5=väga hea")
    note: Optional[str] = None
    created_by_user_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
