from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlmodel import Session
from app.api.deps import get_db, require_role
from app.schemas.student import StudentCreate, StudentRead, StudentUpdate
from app.crud.student import crud_student
from app.models.student import Student

router = APIRouter(prefix="/students", tags=["students"])

@router.get("/", response_model=List[StudentRead])
def list_students(
    class_label: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "teacher", "counselor"))
):
    # Kui kasutaja on õpetaja, piirame tema klassi järgi
    if user.role == "teacher":
        class_label = user.class_label
    return crud_student.list(db, class_label=class_label)

@router.post("/", response_model=StudentRead, status_code=201)
def create_student(payload: StudentCreate, db: Session = Depends(get_db), user=Depends(require_role("admin","teacher"))):
    return crud_student.create(db, data=payload.model_dump())

@router.put("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db), user=Depends(require_role("admin","teacher"))):
    stu = crud_student.get(db, student_id)
    if not stu:
        raise HTTPException(status_code=404, detail="Student not found")
    return crud_student.update(db, stu, data=payload.model_dump(exclude_unset=True))

@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    obj = crud_student.remove(db, student_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Student not found")
    return
