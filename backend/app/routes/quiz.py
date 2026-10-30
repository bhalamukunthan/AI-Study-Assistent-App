import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.quiz import Quiz, QuizQuestion, QuizResult
from app.routes.user import get_or_create_default_user
from app.schemas.quiz import (
    QuizAnswerDetail,
    QuizGenerateRequest,
    QuizQuestionResponse,
    QuizResponse,
    QuizResultResponse,
    QuizSubmitRequest
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/quiz", tags=["Smart Quiz Generator"])

def format_quiz_response(quiz: Quiz) -> QuizResponse:
    q_responses = []
    for q in quiz.questions:
        try:
            opts = json.loads(q.options_json)
        except Exception:
            opts = []
        q_responses.append(
            QuizQuestionResponse(
                id=q.id,
                question=q.question,
                options=opts,
                correct_answer=q.correct_answer,
                explanation=q.explanation
            )
        )
    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        subject=quiz.subject,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        created_at=quiz.created_at,
        questions=q_responses
    )

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(req: QuizGenerateRequest, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)

    # 1. Generate questions via AI
    generated = await ai_service.generate_quiz(
        subject=req.subject,
        topic=req.topic,
        difficulty=req.difficulty,
        question_count=req.question_count
    )

    # 2. Save Quiz to DB
    title = f"{req.subject}: {req.topic} ({req.difficulty})"
    quiz = Quiz(
        user_id=user.id,
        title=title,
        subject=req.subject,
        topic=req.topic,
        difficulty=req.difficulty
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # 3. Save Questions to DB
    for item in generated:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=item["question"],
            options_json=json.dumps(item["options"]),
            correct_answer=item["correct_answer"],
            explanation=item["explanation"]
        )
        db.add(question)
    db.commit()
    db.refresh(quiz)

    return format_quiz_response(quiz)

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    return format_quiz_response(quiz)

@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz(quiz_id: int, req: QuizSubmitRequest, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")

    score = 0
    total = len(quiz.questions)
    answers_detail = []

    for q in quiz.questions:
        try:
            opts = json.loads(q.options_json)
        except Exception:
            opts = []

        chosen = req.answers.get(q.id, "")
        is_correct = (chosen.strip().lower() == q.correct_answer.strip().lower())
        if is_correct:
            score += 1

        answers_detail.append(
            QuizAnswerDetail(
                question_id=q.id,
                question=q.question,
                options=opts,
                selected_answer=chosen,
                correct_answer=q.correct_answer,
                is_correct=is_correct,
                explanation=q.explanation
            )
        )

    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    # Save QuizResult
    result = QuizResult(
        quiz_id=quiz.id,
        user_id=user.id,
        score=score,
        total_questions=total,
        percentage=percentage,
        answers_json=json.dumps([a.dict() for a in answers_detail])
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return QuizResultResponse(
        id=result.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        subject=quiz.subject,
        difficulty=quiz.difficulty,
        score=score,
        total_questions=total,
        percentage=percentage,
        answers_detail=answers_detail,
        completed_at=result.completed_at
    )

@router.get("/results/all")
def get_quiz_results(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    results = db.query(QuizResult).filter(QuizResult.user_id == user.id).order_by(QuizResult.completed_at.desc()).all()
    out = []
    for r in results:
        quiz = db.query(Quiz).filter(Quiz.id == r.quiz_id).first()
        out.append({
            "id": r.id,
            "quiz_id": r.quiz_id,
            "quiz_title": quiz.title if quiz else "Quiz",
            "subject": quiz.subject if quiz else "General",
            "score": r.score,
            "total_questions": r.total_questions,
            "percentage": r.percentage,
            "completed_at": r.completed_at
        })
    return out

@router.get("/results/{result_id}", response_model=QuizResultResponse)
def get_quiz_result_detail(result_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    result = db.query(QuizResult).filter(QuizResult.id == result_id, QuizResult.user_id == user.id).first()
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz result not found.")
    
    quiz = db.query(Quiz).filter(Quiz.id == result.quiz_id).first()
    try:
        details_data = json.loads(result.answers_json)
        details = [QuizAnswerDetail(**item) for item in details_data]
    except Exception:
        details = []

    return QuizResultResponse(
        id=result.id,
        quiz_id=result.quiz_id,
        quiz_title=quiz.title if quiz else "Quiz",
        subject=quiz.subject if quiz else "General",
        difficulty=quiz.difficulty if quiz else "Medium",
        score=result.score,
        total_questions=result.total_questions,
        percentage=result.percentage,
        answers_detail=details,
        completed_at=result.completed_at
    )

