from typing import List
from sqlmodel import Session, select
from app.models.emotion import EmotionEntry

class CRUDEmotion:
    def create(self, session: Session, data: dict) -> EmotionEntry:
        obj = EmotionEntry(**data)
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    def list_by_student(self, session: Session, student_id: int, limit: int = 100) -> List[EmotionEntry]:
        stmt = select(EmotionEntry).where(EmotionEntry.student_id == student_id).order_by(EmotionEntry.created_at.desc()).limit(limit)
        return session.exec(stmt).all()

crud_emotion = CRUDEmotion()
