import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.session import Base, SessionLocal, engine
from app.models import Conversation, Doubt, Message, Note, Quiz, QuizQuestion, QuizResult, StudyPlan, StudyTask, StudySession, User
from app.routes.analytics import router as analytics_router
from app.routes.chat import router as chat_router
from app.routes.doubt import router as doubt_router
from app.routes.health import router as health_router
from app.routes.notes import router as notes_router
from app.routes.quiz import router as quiz_router
from app.routes.sessions import router as sessions_router
from app.routes.study_plan import router as study_plan_router
from app.routes.user import router as user_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studymate")

def seed_initial_data():
    """Seeds initial starter records so the dashboard has rich database-backed data out of the box."""
    db = SessionLocal()
    try:
        # 1. Ensure User exists
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

        # 2. Seed starter study sessions if none exist
        if db.query(StudySession).count() == 0:
            now = datetime.utcnow()
            sessions_seed = [
                StudySession(user_id=user.id, subject="Python & DSA", duration_minutes=90, notes="Binary Search & Trees", created_at=now - timedelta(days=2)),
                StudySession(user_id=user.id, subject="DBMS & SQL", duration_minutes=60, notes="Indexing & Normalization", created_at=now - timedelta(days=1)),
                StudySession(user_id=user.id, subject="Operating Systems", duration_minutes=75, notes="Process Scheduling & Deadlocks", created_at=now),
            ]
            db.add_all(sessions_seed)

        # 3. Seed a starter Quiz if none exist
        if db.query(Quiz).count() == 0:
            quiz = Quiz(
                user_id=user.id,
                title="Data Structures: Binary Trees & Graphs",
                subject="DSA",
                topic="Binary Trees",
                difficulty="Medium"
            )
            db.add(quiz)
            db.commit()
            db.refresh(quiz)

            q1 = QuizQuestion(
                quiz_id=quiz.id,
                question="What is the time complexity of searching in a Balanced Binary Search Tree (AVL / Red-Black)?",
                options_json=json.dumps(["O(1)", "O(log n)", "O(n)", "O(n log n)"]),
                correct_answer="O(log n)",
                explanation="In a balanced BST, the tree height is guaranteed to be O(log n), making search, insertion, and deletion O(log n)."
            )
            q2 = QuizQuestion(
                quiz_id=quiz.id,
                question="Which traversal of a Binary Search Tree produces values in strictly sorted ascending order?",
                options_json=json.dumps(["Pre-order", "In-order", "Post-order", "Level-order"]),
                correct_answer="In-order",
                explanation="In-order traversal visits (Left Subtree, Root, Right Subtree), which outputs BST keys in ascending order."
            )
            q3 = QuizQuestion(
                quiz_id=quiz.id,
                question="Which data structure is primarily used to implement Breadth-First Search (BFS)?",
                options_json=json.dumps(["Stack", "Queue", "Priority Queue", "Linked List"]),
                correct_answer="Queue",
                explanation="BFS operates on a First-In-First-Out (FIFO) basis, which is inherently provided by a Queue."
            )
            db.add_all([q1, q2, q3])
            db.commit()

            # Record starter QuizResult
            answers = [
                {"question_id": q1.id, "question": q1.question, "options": json.loads(q1.options_json), "selected_answer": "O(log n)", "correct_answer": "O(log n)", "is_correct": True, "explanation": q1.explanation},
                {"question_id": q2.id, "question": q2.question, "options": json.loads(q2.options_json), "selected_answer": "In-order", "correct_answer": "In-order", "is_correct": True, "explanation": q2.explanation},
                {"question_id": q3.id, "question": q3.question, "options": json.loads(q3.options_json), "selected_answer": "Stack", "correct_answer": "Queue", "is_correct": False, "explanation": q3.explanation},
            ]
            res = QuizResult(
                quiz_id=quiz.id,
                user_id=user.id,
                score=2,
                total_questions=3,
                percentage=66.7,
                answers_json=json.dumps(answers),
                completed_at=datetime.utcnow() - timedelta(hours=3)
            )
            db.add(res)
            db.commit()

        # 4. Seed starter Study Plan if none exists
        if db.query(StudyPlan).count() == 0:
            plan = StudyPlan(
                user_id=user.id,
                title="Full-Stack Engineering & DSA Mastery",
                student_name=user.name,
                subject="Computer Science",
                topics="Algorithms, System Design, React, Python",
                hours_per_day=3.0,
                target_date="2026-11-20",
                knowledge_level="Intermediate",
                overview="A structured 7-day sprint balancing algorithmic problem solving and practical full-stack system architecture."
            )
            db.add(plan)
            db.commit()
            db.refresh(plan)

            t1 = StudyTask(
                plan_id=plan.id,
                day_number=1,
                date_str="Day 1",
                topic="Algorithms",
                task_title="Master Sliding Window & Two Pointers",
                description="Solve 4 medium LeetCode problems on array sliding window technique.",
                duration_minutes=60,
                task_type="practice",
                is_completed=True,
                completed_at=datetime.utcnow() - timedelta(days=1)
            )
            t2 = StudyTask(
                plan_id=plan.id,
                day_number=2,
                date_str="Day 2",
                topic="DBMS",
                task_title="Database Indexing (B+ Trees & Hash Indexes)",
                description="Read internal workings of B+ Tree storage and composite indexes in PostgreSQL / SQLite.",
                duration_minutes=45,
                task_type="study",
                is_completed=False
            )
            t3 = StudyTask(
                plan_id=plan.id,
                day_number=3,
                date_str="Day 3",
                topic="System Design",
                task_title="Caching Strategies & Redis Architecture",
                description="Study Cache-Aside, Write-Through, and LRU eviction policies.",
                duration_minutes=60,
                task_type="study",
                is_completed=False
            )
            db.add_all([t1, t2, t3])
            db.commit()

        # 5. Seed a starter Conversation if none exists
        if db.query(Conversation).count() == 0:
            conv = Conversation(
                user_id=user.id,
                title="Understanding Dynamic Programming",
                subject="Algorithms"
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

            m1 = Message(
                conversation_id=conv.id,
                sender="user",
                content="Can you explain the difference between Memoization and Tabulation in Dynamic Programming?"
            )
            m2 = Message(
                conversation_id=conv.id,
                sender="assistant",
                content="""Great question! Both **Memoization** and **Tabulation** are techniques used in Dynamic Programming to avoid redundant computations, but they approach the problem from opposite directions:

### 1. Memoization (Top-Down Approach)
- **Concept:** You start solving the problem from the top (original problem) and break it down recursively. Whenever you solve a subproblem, you cache the result (e.g., in a dictionary or array).
- **Control Flow:** Follows recursive call stack.
- **Example:**
```python
def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]
```

### 2. Tabulation (Bottom-Up Approach)
- **Concept:** You start from the smallest base cases and fill up a table iteratively until you reach the target answer.
- **Control Flow:** Uses iterative loops, eliminating recursion call stack overhead.
- **Example:**
```python
def fib_tab(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
```

### Summary Comparison:
| Feature | Memoization (Top-Down) | Tabulation (Bottom-Up) |
|---|---|---|
| Approach | Recursive | Iterative |
| Space Overhead | Recursion stack + cache | Only DP table/array |
| State Transition | Lazy (only calculates needed states) | Eager (calculates all subproblems) |

Would you like to solve a classic problem like *0/1 Knapsack* or *Longest Common Subsequence* next to practice?"""
            )
            db.add_all([m1, m2])
            db.commit()

        logger.info("Database tables initialized and starter records verified.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed starter data
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield

app = FastAPI(
    title="StudyMate AI - Backend API",
    description="Your Personal AI Study Assistant - REST API powered by FastAPI, SQLite, and Google Gemini API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Include API Routers under /api
app.include_router(health_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(quiz_router, prefix="/api")
app.include_router(study_plan_router, prefix="/api")
app.include_router(notes_router, prefix="/api")
app.include_router(doubt_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Welcome to StudyMate AI API",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

