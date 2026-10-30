from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.study_plan import StudyPlan, StudyTask
from app.routes.user import get_or_create_default_user
from app.schemas.study_plan import (
    StudyPlanGenerateRequest,
    StudyPlanResponse,
    StudyTaskResponse
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="", tags=["AI Study Plan Generator"])

def format_plan_response(plan: StudyPlan) -> StudyPlanResponse:
    tasks = plan.tasks
    total = len(tasks)
    completed = sum(1 for t in tasks if t.is_completed)
    pct = round((completed / total) * 100, 1) if total > 0 else 0.0

    task_responses = [
        StudyTaskResponse(
            id=t.id,
            plan_id=t.plan_id,
            day_number=t.day_number,
            date_str=t.date_str,
            topic=t.topic,
            task_title=t.task_title,
            description=t.description,
            duration_minutes=t.duration_minutes,
            task_type=t.task_type,
            is_completed=t.is_completed,
            completed_at=t.completed_at
        )
        for t in tasks
    ]

    return StudyPlanResponse(
        id=plan.id,
        title=plan.title,
        student_name=plan.student_name,
        subject=plan.subject,
        topics=plan.topics,
        hours_per_day=plan.hours_per_day,
        target_date=plan.target_date,
        knowledge_level=plan.knowledge_level,
        overview=plan.overview,
        created_at=plan.created_at,
        tasks=task_responses,
        total_tasks=total,
        completed_tasks=completed,
        progress_percentage=pct
    )

@router.post("/study-plans/generate", response_model=StudyPlanResponse)
async def generate_study_plan(req: StudyPlanGenerateRequest, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)

    # 1. AI Generation
    generated = await ai_service.generate_study_plan(
        student_name=req.student_name or user.name,
        subject=req.subject,
        topics=req.topics,
        hours_per_day=req.hours_per_day,
        target_date=req.target_date,
        knowledge_level=req.knowledge_level
    )

    # 2. Save StudyPlan
    title = generated.get("title") or f"{req.subject} Study Plan ({req.target_date})"
    overview = generated.get("overview", "")
    plan = StudyPlan(
        user_id=user.id,
        title=title,
        student_name=req.student_name or user.name,
        subject=req.subject,
        topics=req.topics,
        hours_per_day=req.hours_per_day,
        target_date=req.target_date,
        knowledge_level=req.knowledge_level,
        overview=overview
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    # 3. Save Tasks
    tasks_raw = generated.get("tasks", [])
    for t_data in tasks_raw:
        task = StudyTask(
            plan_id=plan.id,
            day_number=int(t_data.get("day_number", 1)),
            date_str=str(t_data.get("date_str", f"Day {t_data.get('day_number', 1)}")),
            topic=str(t_data.get("topic", req.subject)),
            task_title=str(t_data.get("task_title", "Study Session")),
            description=str(t_data.get("description", "")),
            duration_minutes=int(t_data.get("duration_minutes", 45)),
            task_type=str(t_data.get("task_type", "study")).lower(),
            is_completed=False
        )
        db.add(task)

    db.commit()
    db.refresh(plan)

    return format_plan_response(plan)

@router.get("/study-plans", response_model=list[StudyPlanResponse])
def get_study_plans(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).order_by(StudyPlan.created_at.desc()).all()
    return [format_plan_response(p) for p in plans]

@router.get("/study-plans/{plan_id}", response_model=StudyPlanResponse)
def get_study_plan(plan_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found.")
    return format_plan_response(plan)

@router.delete("/study-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_plan(plan_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found.")
    db.delete(plan)
    db.commit()
    return None

@router.patch("/study-tasks/{task_id}/toggle", response_model=StudyTaskResponse)
def toggle_study_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(StudyTask).filter(StudyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.is_completed = not task.is_completed
    task.completed_at = datetime.utcnow() if task.is_completed else None
    db.commit()
    db.refresh(task)

    return StudyTaskResponse(
        id=task.id,
        plan_id=task.plan_id,
        day_number=task.day_number,
        date_str=task.date_str,
        topic=task.topic,
        task_title=task.task_title,
        description=task.description,
        duration_minutes=task.duration_minutes,
        task_type=task.task_type,
        is_completed=task.is_completed,
        completed_at=task.completed_at
    )

