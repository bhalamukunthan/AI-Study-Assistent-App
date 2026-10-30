from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.doubt import Doubt
from app.routes.user import get_or_create_default_user
from app.schemas.doubt import DoubtResponse, DoubtSolveRequest
from app.services.ai_service import ai_service

router = APIRouter(prefix="/doubt", tags=["AI Doubt Solver"])

@router.post("/solve", response_model=DoubtResponse)
async def solve_student_doubt(req: DoubtSolveRequest, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)

    # 1. AI Resolution
    solution_data = await ai_service.solve_doubt(
        subject=req.subject,
        category=req.category,
        question=req.question_text,
        code_snippet=req.code_snippet
    )

    # 2. Save Doubt
    doubt = Doubt(
        user_id=user.id,
        title=solution_data.get("title", f"{req.subject} Doubt"),
        subject=req.subject,
        category=req.category,
        question_text=req.question_text,
        code_snippet=req.code_snippet,
        step_by_step_solution=solution_data.get("step_by_step_solution", ""),
        core_concepts=solution_data.get("core_concepts", ""),
        related_topics=solution_data.get("related_topics", "")
    )
    db.add(doubt)
    db.commit()
    db.refresh(doubt)

    return doubt

@router.get("/history", response_model=list[DoubtResponse])
def get_doubt_history(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    doubts = db.query(Doubt).filter(Doubt.user_id == user.id).order_by(Doubt.created_at.desc()).all()
    return doubts

@router.get("/{doubt_id}", response_model=DoubtResponse)
def get_doubt_detail(doubt_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id, Doubt.user_id == user.id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt entry not found.")
    return doubt

@router.delete("/{doubt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doubt(doubt_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id, Doubt.user_id == user.id).first()
    if not doubt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doubt entry not found.")
    db.delete(doubt)
    db.commit()
    return None

