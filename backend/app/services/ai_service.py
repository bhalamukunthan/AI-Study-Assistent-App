import json
import logging
import os
import re
from typing import Any
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from google.genai.errors import APIError
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TUTOR = """You are StudyMate AI, a patient, encouraging, and highly knowledgeable personal AI tutor.
Your mission is to help students learn effectively across subjects including Computer Science (Python, Java, C, C++, Data Structures & Algorithms, DBMS, Operating Systems, Computer Networks), Mathematics, and Science.

Teaching Principles:
1. Explain complex concepts using intuitive, simple analogies and beginner-friendly language.
2. Break explanations into clear, logical step-by-step points.
3. Include real-world practical examples and well-commented code snippets whenever relevant.
4. Use standard Markdown formatting: code blocks with language identifiers (e.g. ```python, ```cpp, ```java, ```sql), bold terms, and lists.
5. If a student's question is vague, answer the most likely question first, then offer 2-3 specific follow-up directions.
6. Maintain an encouraging and supportive tone to boost the student's confidence.
"""

class AIService:
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL

    def _get_api_key(self) -> str:
        # Check settings or direct os.environ (in case .env was modified after startup)
        key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        return key.strip()

    def is_configured(self) -> bool:
        key = self._get_api_key()
        return bool(key and not key.startswith("your_gemini_api_key"))

    def _get_client(self) -> genai.Client:
        key = self._get_api_key()
        if not key or key.startswith("your_gemini_api_key"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Gemini API key is not configured. "
                    "Please set your GEMINI_API_KEY in backend/.env file to activate AI features."
                )
            )
        try:
            return genai.Client(api_key=key)
        except Exception as e:
            logger.error(f"Failed to initialize GenAI client: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initialize AI client: {str(e)}"
            )

    def _clean_json_response(self, text: str) -> str:
        """Strip markdown fences if present and extract JSON block."""
        text = text.strip()
        # Remove ```json ... ```
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        return text

    async def generate_chat_reply(
        self,
        messages: list[dict[str, str]],
        subject: str = "General"
    ) -> str:
        client = self._get_client()

        # Build prompt from conversation history
        formatted_contents = []
        for msg in messages:
            role = "user" if msg.get("sender") == "user" else "model"
            content = msg.get("content", "")
            formatted_contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=content)]
                )
            )

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=formatted_contents,
                config=types.GenerateContentConfig(
                    system_instruction=f"{SYSTEM_PROMPT_TUTOR}\nCurrent Study Focus: {subject}",
                    temperature=0.7,
                    max_output_tokens=2048,
                )
            )
            if not response.text:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="AI returned an empty response."
                )
            return response.text
        except HTTPException:
            raise
        except APIError as e:
            logger.error(f"Gemini API error in chat: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini API Error: {e.message if hasattr(e, 'message') else str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in chat: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"AI generation failed: {str(e)}"
            )

    async def generate_quiz(
        self,
        subject: str,
        topic: str,
        difficulty: str,
        question_count: int
    ) -> list[dict[str, Any]]:
        client = self._get_client()

        prompt = f"""Generate a high-quality educational quiz with exactly {question_count} multiple-choice questions.
Subject: {subject}
Topic: {topic}
Difficulty: {difficulty}

Return ONLY a JSON array with exactly {question_count} objects.
Each object must have the exact structure:
{{
  "question": "Clear, educational question text",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correct_answer": "The exact matching text of the correct option from options array",
  "explanation": "Detailed explanation of why this answer is correct and why other options are incorrect."
}}

Requirements:
- Exactly 4 options per question.
- Ensure the correct_answer is verbatim identical to one of the 4 items in options.
- The difficulty must match '{difficulty}'.
- Do not output markdown text outside the JSON. Return pure JSON.
"""

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                )
            )
            raw_text = self._clean_json_response(response.text or "")
            data = json.loads(raw_text)

            if isinstance(data, dict) and "questions" in data:
                data = data["questions"]
            if not isinstance(data, list):
                raise ValueError("Expected a JSON array of questions.")

            # Validate each question
            validated = []
            for item in data:
                opts = item.get("options", [])
                correct = item.get("correct_answer", "")
                if len(opts) < 2:
                    continue
                if correct not in opts and opts:
                    correct = opts[0]
                validated.append({
                    "question": str(item.get("question", "Question")),
                    "options": [str(o) for o in opts],
                    "correct_answer": str(correct),
                    "explanation": str(item.get("explanation", "Explanation not provided."))
                })

            if not validated:
                raise ValueError("Failed to parse valid questions from AI response.")
            return validated

        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode quiz JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI failed to generate a valid structured quiz format. Please retry."
            )
        except Exception as e:
            logger.error(f"Quiz generation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Quiz generation failed: {str(e)}"
            )

    async def generate_study_plan(
        self,
        student_name: str,
        subject: str,
        topics: str,
        hours_per_day: float,
        target_date: str,
        knowledge_level: str
    ) -> dict[str, Any]:
        client = self._get_client()

        prompt = f"""You are an expert curriculum planner and study strategist.
Create a structured, highly realistic daily study plan for a student.

Student Name: {student_name}
Subject: {subject}
Topics to Cover: {topics}
Available Study Time: {hours_per_day} hours per day
Target Completion Date: {target_date}
Current Knowledge Level: {knowledge_level}

Requirements:
Return ONLY a JSON object with this exact structure:
{{
  "title": "Comprehensive Study Plan for {subject}",
  "overview": "A concise motivating overview and strategy for mastering these topics.",
  "tasks": [
    {{
      "day_number": 1,
      "date_str": "Day 1",
      "topic": "Specific Topic",
      "task_title": "Actionable task title",
      "description": "Clear step-by-step instructions on what to read, code, or solve.",
      "duration_minutes": 45,
      "task_type": "study" 
    }}
  ]
}}
Allowed values for "task_type": "study", "practice", "revision", "break".
Include active learning, practice activities, revision checkpoints, and brief break recommendations.
Return pure JSON only.
"""

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4,
                )
            )
            raw_text = self._clean_json_response(response.text or "")
            data = json.loads(raw_text)

            if not isinstance(data, dict) or "tasks" not in data:
                raise ValueError("Expected a JSON object with a 'tasks' array.")

            return data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode study plan JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI failed to return valid JSON for study plan. Please retry."
            )
        except Exception as e:
            logger.error(f"Study plan generation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Study plan generation failed: {str(e)}"
            )

    async def summarize_notes(
        self,
        content: str,
        summary_type: str
    ) -> tuple[str, Any]:
        client = self._get_client()

        # Build prompt based on summary_type
        if summary_type == "short":
            prompt = f"""Provide a concise, high-impact executive summary (2-3 paragraphs) of the following study notes.
Highlight core definitions and central takeaways. Use clean Markdown formatting.

Notes:
{content[:12000]}
"""
            is_json = False

        elif summary_type == "detailed":
            prompt = f"""Provide a thorough, comprehensive study guide based on the following notes.
Include:
1. Executive Summary
2. In-depth Concept Breakdown with headings
3. Key Definitions & Formulas / Code
4. Critical Takeaways & Best Practices
Format using clear Markdown.

Notes:
{content[:12000]}
"""
            is_json = False

        elif summary_type == "key_points":
            prompt = f"""Extract the most essential key points and core concepts from the following notes as bullet points.
Group them under logical category headers.
Format using Markdown bullet points and bold keywords.

Notes:
{content[:12000]}
"""
            is_json = False

        elif summary_type == "flashcards":
            prompt = f"""Generate 6 to 10 high-retention flashcards from the following notes.
Return ONLY a JSON array of objects with this exact structure:
[
  {{
    "front": "Question or Key Concept on front of flashcard",
    "back": "Clear, concise answer or explanation on back"
  }}
]

Notes:
{content[:12000]}
"""
            is_json = True

        elif summary_type == "questions":
            prompt = f"""Generate 5 practice questions with detailed model answers and explanations based on the following notes.
Return ONLY a JSON array of objects with this exact structure:
[
  {{
    "question": "Practice question text",
    "answer": "Complete model answer",
    "explanation": "Why this answer is complete and key points to remember"
  }}
]

Notes:
{content[:12000]}
"""
            is_json = True
        else:
            summary_type = "short"
            prompt = f"Summarize the following notes concisely:\n{content[:12000]}"
            is_json = False

        try:
            config = types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json" if is_json else "text/plain"
            )
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            raw_text = response.text or ""

            if is_json:
                cleaned = self._clean_json_response(raw_text)
                parsed_data = json.loads(cleaned)
                summary_text = f"Generated {len(parsed_data)} interactive {summary_type} items from your notes."
                return summary_text, parsed_data
            else:
                return raw_text, None

        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode notes JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to parse structured {summary_type} from AI."
            )
        except Exception as e:
            logger.error(f"Notes summarization error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Notes summarization failed: {str(e)}"
            )

    async def solve_doubt(
        self,
        subject: str,
        category: str,
        question: str,
        code_snippet: str | None = None
    ) -> dict[str, str]:
        client = self._get_client()

        prompt = f"""You are a master academic and technical tutor solving a student's specific doubt.

Subject: {subject}
Category: {category}
Question/Problem:
{question}
"""
        if code_snippet:
            prompt += f"\nCode / Math Snippet:\n```{code_snippet}\n```"

        prompt += """
Please provide a comprehensive, clear, structured solution.
Return ONLY a JSON object with this exact structure:
{
  "title": "A short, descriptive summary of the problem and its core theme",
  "step_by_step_solution": "Detailed, step-by-step resolution. If there is code, include the corrected, commented code block. If math or theory, explain each transformation clearly.",
  "core_concepts": "Key underlying concepts, principles, or formulas the student needs to understand.",
  "related_topics": "Bullet list or suggestions of 2-3 related topics/next steps the student should practice."
}
"""

        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3,
                )
            )
            raw_text = self._clean_json_response(response.text or "")
            data = json.loads(raw_text)

            return {
                "title": data.get("title", f"Solution for {subject} problem"),
                "step_by_step_solution": data.get("step_by_step_solution", ""),
                "core_concepts": data.get("core_concepts", ""),
                "related_topics": data.get("related_topics", "")
            }
        except json.JSONDecodeError:
            # Fallback if raw text wasn't strict JSON
            return {
                "title": f"Doubt Solution: {subject}",
                "step_by_step_solution": response.text or "Solution generated.",
                "core_concepts": "Key principles of the subject.",
                "related_topics": "Practice similar problems and review fundamentals."
            }
        except Exception as e:
            logger.error(f"Doubt solver error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Doubt resolution failed: {str(e)}"
            )

ai_service = AIService()

