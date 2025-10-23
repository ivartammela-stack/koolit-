from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.api.deps import get_db, require_role
from app.schemas.emotion import EmotionCreate, EmotionRead
from app.crud.emotion import crud_emotion
from app.crud.student import crud_student

router = APIRouter(prefix="/emotions", tags=["emotions"])

# POST /api/v1/emotions
@router.post("/", response_model=EmotionRead, status_code=201)
def create_emotion_entry(
    payload: EmotionCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "teacher", "counselor")),
):
    # Õpetaja saab lisada ainult oma klassi õpilasele
    stu = crud_student.get(db, payload.student_id)
    if not stu:
        raise HTTPException(status_code=404, detail="Student not found")
    if user.role == "teacher" and stu.class_label != user.class_label:
        raise HTTPException(status_code=403, detail="Forbidden: not your class")

    data = payload.model_dump()
    data["created_by_user_id"] = user.id  # <- pane autor payloadi sisse
    obj = crud_emotion.create(db, data=data)

    return EmotionRead.model_validate(obj.__dict__)

# GET /api/v1/emotions/by-student/{student_id}
@router.get("/by-student/{student_id}", response_model=List[EmotionRead])
def get_emotions_by_student(
    student_id: int,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "teacher", "counselor")),
):
    # Õpetaja näeb ainult oma klassi õpilase emotsioone
    stu = crud_student.get(db, student_id)
    if not stu:
        raise HTTPException(status_code=404, detail="Student not found")
    if user.role == "teacher" and stu.class_label != user.class_label:
        raise HTTPException(status_code=403, detail="Forbidden: not your class")

    items = crud_emotion.list_by_student(db, student_id=student_id, limit=limit)
    return [EmotionRead.model_validate(i.__dict__) for i in items]
