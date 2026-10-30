from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.study_session import StudySession
from app.routes.user import get_or_create_default_user
from app.schemas.session import StudySessionCreate, StudySessionResponse

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])

@router.post("", response_model=StudySessionResponse)
def log_study_session(req: StudySessionCreate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    session = StudySession(
        user_id=user.id,
        subject=req.subject,
        duration_minutes=req.duration_minutes,
        notes=req.notes
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("", response_model=list[StudySessionResponse])
def get_study_sessions(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    sessions = db.query(StudySession).filter(StudySession.user_id == user.id).order_by(StudySession.created_at.desc()).all()
    return sessions

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_session(session_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    sess = db.query(StudySession).filter(StudySession.id == session_id, StudySession.user_id == user.id).first()
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    db.delete(sess)
    db.commit()
    return None

