from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.chat import Conversation, Message
from app.models.doubt import Doubt
from app.models.note import Note
from app.models.quiz import Quiz, QuizResult
from app.models.study_plan import StudyPlan, StudyTask
from app.models.study_session import StudySession
from app.routes.user import get_or_create_default_user
from app.schemas.analytics import (
    DashboardAnalytics,
    RecentActivity,
    SubjectBreakdown,
    UpcomingTask,
    WeeklyActivityPoint
)

router = APIRouter(prefix="/analytics", tags=["Progress Tracker"])

@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    # 1. Study Sessions
    sessions = db.query(StudySession).filter(StudySession.user_id == user.id).all()
    today_sessions = [s for s in sessions if s.created_at >= today_start]
    
    today_study_hours = round(sum(s.duration_minutes for s in today_sessions) / 60.0, 1)
    total_study_hours = round(sum(s.duration_minutes for s in sessions) / 60.0, 1)

    # 2. Questions Asked
    # Count user messages across conversations
    user_conversations = db.query(Conversation.id).filter(Conversation.user_id == user.id).all()
    conv_ids = [c[0] for c in user_conversations]
    if conv_ids:
        total_questions = db.query(func.count(Message.id)).filter(
            Message.conversation_id.in_(conv_ids),
            Message.sender == "user"
        ).scalar() or 0
    else:
        total_questions = 0

    # 3. Quizzes & Average Score
    quiz_results = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    quizzes_completed = len(quiz_results)
    if quizzes_completed > 0:
        avg_score = round(sum(r.percentage for r in quiz_results) / quizzes_completed, 1)
    else:
        avg_score = 0.0

    # 4. Study Tasks
    user_plans = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).all()
    plan_ids = [p.id for p in user_plans]
    if plan_ids:
        all_tasks = db.query(StudyTask).filter(StudyTask.plan_id.in_(plan_ids)).all()
        total_tasks = len(all_tasks)
        completed_tasks = sum(1 for t in all_tasks if t.is_completed)
        pending_tasks = [t for t in all_tasks if not t.is_completed]
    else:
        all_tasks = []
        total_tasks = 0
        completed_tasks = 0
        pending_tasks = []

    # 5. Streak Calculation
    # Collect all active dates (from sessions, messages, quiz results)
    active_dates = set()
    for s in sessions:
        active_dates.add(s.created_at.date())
    for qr in quiz_results:
        active_dates.add(qr.completed_at.date())
    
    # Calculate consecutive days backwards from today or yesterday
    today_date = now.date()
    yesterday_date = today_date - timedelta(days=1)
    streak = 0
    check_date = today_date if today_date in active_dates else (yesterday_date if yesterday_date in active_dates else None)
    
    while check_date and check_date in active_dates:
        streak += 1
        check_date = check_date - timedelta(days=1)

    # 6. Weekly Learning Activity (Past 7 days)
    weekly_activity = []
    day_abbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        target_day = today_date - timedelta(days=i)
        day_start = datetime(target_day.year, target_day.month, target_day.day)
        day_end = day_start + timedelta(days=1)

        day_sessions = [s for s in sessions if day_start <= s.created_at < day_end]
        day_quizzes = [q for q in quiz_results if day_start <= q.completed_at < day_end]
        day_hours = round(sum(s.duration_minutes for s in day_sessions) / 60.0, 1)

        weekly_activity.append(
            WeeklyActivityPoint(
                day=day_abbrs[target_day.weekday()],
                date=target_day.strftime("%b %d"),
                hours=day_hours,
                sessions=len(day_sessions),
                quizzes=len(day_quizzes)
            )
        )

    # 7. Subject Distribution
    subject_map: dict[str, dict] = {}
    for s in sessions:
        subj = s.subject or "General"
        if subj not in subject_map:
            subject_map[subj] = {"hours": 0.0, "count": 0}
        subject_map[subj]["hours"] += s.duration_minutes / 60.0
        subject_map[subj]["count"] += 1

    for qr in quiz_results:
        quiz = db.query(Quiz).filter(Quiz.id == qr.quiz_id).first()
        subj = quiz.subject if quiz else "General"
        if subj not in subject_map:
            subject_map[subj] = {"hours": 0.5, "count": 0}  # treat a quiz as ~30 min study
        else:
            subject_map[subj]["hours"] += 0.5
        subject_map[subj]["count"] += 1

    subject_dist = []
    total_subj_hours = sum(v["hours"] for v in subject_map.values()) or 1.0
    for subj, data in sorted(subject_map.items(), key=lambda x: x[1]["hours"], reverse=True)[:5]:
        pct = round((data["hours"] / total_subj_hours) * 100, 1)
        subject_dist.append(
            SubjectBreakdown(
                subject=subj,
                hours=round(data["hours"], 1),
                percentage=pct,
                count=data["count"]
            )
        )

    # 8. Recent Activities
    activities = []
    # Quizzes
    for r in sorted(quiz_results, key=lambda x: x.completed_at, reverse=True)[:3]:
        quiz = db.query(Quiz).filter(Quiz.id == r.quiz_id).first()
        activities.append({
            "id": f"quiz-{r.id}",
            "type": "quiz",
            "title": f"Completed Quiz: {quiz.title if quiz else 'Quiz'}",
            "description": f"Scored {r.score}/{r.total_questions} ({r.percentage}%)",
            "timestamp": r.completed_at.isoformat()
        })
    # Study Sessions
    for s in sorted(sessions, key=lambda x: x.created_at, reverse=True)[:3]:
        activities.append({
            "id": f"sess-{s.id}",
            "type": "session",
            "title": f"Study Session: {s.subject}",
            "description": f"Studied for {s.duration_minutes} minutes" + (f" - {s.notes}" if s.notes else ""),
            "timestamp": s.created_at.isoformat()
        })
    # Doubts
    doubts = db.query(Doubt).filter(Doubt.user_id == user.id).order_by(Doubt.created_at.desc()).limit(2).all()
    for d in doubts:
        activities.append({
            "id": f"doubt-{d.id}",
            "type": "doubt",
            "title": f"Solved Doubt: {d.title}",
            "description": f"Subject: {d.subject} ({d.category})",
            "timestamp": d.created_at.isoformat()
        })
    # Notes
    notes = db.query(Note).filter(Note.user_id == user.id).order_by(Note.created_at.desc()).limit(2).all()
    for n in notes:
        activities.append({
            "id": f"note-{n.id}",
            "type": "note",
            "title": f"Summarized Notes: {n.title}",
            "description": f"Format: {n.summary_type.capitalize()}",
            "timestamp": n.created_at.isoformat()
        })

    # Sort recent activities by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    recent_acts = [RecentActivity(**a) for a in activities[:6]]

    # 9. Upcoming Tasks
    upcoming = []
    for t in pending_tasks[:5]:
        plan = db.query(StudyPlan).filter(StudyPlan.id == t.plan_id).first()
        upcoming.append(
            UpcomingTask(
                id=t.id,
                plan_id=t.plan_id,
                plan_title=plan.title if plan else "Study Plan",
                task_title=t.task_title,
                topic=t.topic,
                duration_minutes=t.duration_minutes,
                task_type=t.task_type,
                date_str=t.date_str,
                is_completed=t.is_completed
            )
        )

    return DashboardAnalytics(
        student_name=user.name,
        today_study_hours=today_study_hours,
        total_study_hours=total_study_hours,
        total_questions_asked=total_questions,
        quizzes_completed=quizzes_completed,
        current_streak_days=streak,
        average_quiz_score=avg_score,
        completed_tasks_count=completed_tasks,
        total_tasks_count=total_tasks,
        weekly_activity=weekly_activity,
        subject_distribution=subject_dist,
        recent_activities=recent_acts,
        upcoming_tasks=upcoming
    )

