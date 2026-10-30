import json
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.note import Note
from app.routes.user import get_or_create_default_user
from app.schemas.note import NoteResponse, NoteSummarizeRequest
from app.services.ai_service import ai_service
from app.services.document_service import document_service

router = APIRouter(prefix="/notes", tags=["Notes Summarizer"])

def format_note_response(note: Note) -> NoteResponse:
    structured = None
    if note.structured_data:
        try:
            structured = json.loads(note.structured_data)
        except Exception:
            structured = None

    return NoteResponse(
        id=note.id,
        title=note.title,
        original_filename=note.original_filename,
        file_type=note.file_type,
        summary_type=note.summary_type,
        content=note.content,
        summary_result=note.summary_result,
        structured_data=structured,
        created_at=note.created_at
    )

@router.post("/summarize", response_model=NoteResponse)
async def summarize_text(req: NoteSummarizeRequest, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)

    summary_text, structured_data = await ai_service.summarize_notes(
        content=req.content,
        summary_type=req.summary_type
    )

    note = Note(
        user_id=user.id,
        title=req.title or "Study Notes Summary",
        original_filename=None,
        file_type="pasted_text",
        summary_type=req.summary_type,
        content=req.content,
        summary_result=summary_text,
        structured_data=json.dumps(structured_data) if structured_data else None
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return format_note_response(note)

@router.post("/upload", response_model=NoteResponse)
async def upload_and_summarize_file(
    file: UploadFile = File(...),
    summary_type: str = Form("short"),
    title: str | None = Form(None),
    db: Session = Depends(get_db)
):
    user = get_or_create_default_user(db)

    # 1. Extract text securely
    extracted_text, filename = await document_service.extract_text_from_upload(file)

    # 2. Summarize using AI
    summary_text, structured_data = await ai_service.summarize_notes(
        content=extracted_text,
        summary_type=summary_type
    )

    note_title = title if title and title.strip() else f"Summary: {filename}"
    file_type = filename.split(".")[-1].lower() if "." in filename else "text"

    note = Note(
        user_id=user.id,
        title=note_title,
        original_filename=filename,
        file_type=file_type,
        summary_type=summary_type,
        content=extracted_text,
        summary_result=summary_text,
        structured_data=json.dumps(structured_data) if structured_data else None
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return format_note_response(note)

@router.get("", response_model=list[NoteResponse])
def get_notes(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    notes = db.query(Note).filter(Note.user_id == user.id).order_by(Note.created_at.desc()).all()
    return [format_note_response(n) for n in notes]

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return format_note_response(note)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == user.id).first()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    db.delete(note)
    db.commit()
    return None

