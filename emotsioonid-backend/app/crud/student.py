from typing import Optional, List
from sqlmodel import Session, select
from app.models.student import Student

class CRUDStudent:
    def get(self, session: Session, student_id: int) -> Optional[Student]:
        return session.get(Student, student_id)

    def create(self, session: Session, data: dict) -> Student:
        obj = Student(**data)
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    def update(self, session: Session, student: Student, data: dict) -> Student:
        for k, v in data.items():
            setattr(student, k, v)
        session.add(student)
        session.commit()
        session.refresh(student)
        return student

    def list(self, session: Session, class_label: Optional[str] = None) -> List[Student]:
        stmt = select(Student)
        if class_label:
            stmt = stmt.where(Student.class_label == class_label)
        return session.exec(stmt).all()

    def remove(self, session: Session, student_id: int) -> Optional[Student]:
        obj = session.get(Student, student_id)
        if obj:
            session.delete(obj)
            session.commit()
        return obj

crud_student = CRUDStudent()
