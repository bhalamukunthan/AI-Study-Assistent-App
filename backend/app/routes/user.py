from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/user", tags=["User"])

def get_or_create_default_user(db: Session) -> User:
    user = db.query(User).first()
    if not user:
        user = User(
            name="Alex Rivera",
            email="alex.student@studymate.ai",
            avatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@router.get("/profile", response_model=UserResponse)
def get_user_profile(db: Session = Depends(get_db)):
    return get_or_create_default_user(db)

@router.put("/profile", response_model=UserResponse)
def update_user_profile(user_update: UserUpdate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    if user_update.name is not None:
        user.name = user_update.name.strip()
    if user_update.email is not None:
        user.email = user_update.email.strip()
    if user_update.avatar is not None:
        user.avatar = user_update.avatar.strip()
    db.commit()
    db.refresh(user)
    return user

