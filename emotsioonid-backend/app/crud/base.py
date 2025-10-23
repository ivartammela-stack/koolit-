from typing import Generic, TypeVar, Type, Optional, List
from sqlmodel import SQLModel, Session, select

ModelType = TypeVar("ModelType", bound=SQLModel)

class CRUDBase(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, session: Session, id: int) -> Optional[ModelType]:
        return session.get(self.model, id)

    def get_multi(self, session: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return session.exec(select(self.model).offset(skip).limit(limit)).all()

    def create(self, session: Session, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def remove(self, session: Session, id: int) -> Optional[ModelType]:
        obj = session.get(self.model, id)
        if obj:
            session.delete(obj)
            session.commit()
        return obj
