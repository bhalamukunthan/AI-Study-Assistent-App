from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.chat import Conversation, Message
from app.routes.user import get_or_create_default_user
from app.schemas.chat import (
    ConversationResponse,
    ConversationSummary,
    MessageCreate,
    MessageResponse
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/chat", tags=["AI Chat Tutor"])

@router.get("/conversations", response_model=list[ConversationSummary])
def list_conversations(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    conversations = db.query(Conversation).filter(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc()).all()
    results = []
    for c in conversations:
        results.append(
            ConversationSummary(
                id=c.id,
                title=c.title,
                subject=c.subject,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=len(c.messages)
            )
        )
    return results

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    return conv

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    db.delete(conv)
    db.commit()
    return None

@router.post("/conversations/{conversation_id}/clear")
def clear_conversation(conversation_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    
    db.query(Message).filter(Message.conversation_id == conv.id).delete()
    conv.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Conversation history cleared successfully"}

@router.post("/message", response_model=ConversationResponse)
async def send_chat_message(msg_in: MessageCreate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)

    # 1. Get or create conversation
    if msg_in.conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == msg_in.conversation_id,
            Conversation.user_id == user.id
        ).first()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    else:
        title = msg_in.content[:40] + ("..." if len(msg_in.content) > 40 else "")
        conv = Conversation(
            user_id=user.id,
            title=title,
            subject=msg_in.subject or "General"
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Add user message
    user_msg = Message(
        conversation_id=conv.id,
        sender="user",
        content=msg_in.content
    )
    db.add(user_msg)
    db.commit()

    # 3. Build history context for AI
    all_msgs = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    history = [{"sender": m.sender, "content": m.content} for m in all_msgs]

    # 4. Generate AI tutor reply
    ai_reply_text = await ai_service.generate_chat_reply(messages=history, subject=conv.subject)

    # 5. Save assistant reply
    ai_msg = Message(
        conversation_id=conv.id,
        sender="assistant",
        content=ai_reply_text
    )
    db.add(ai_msg)
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conv)

    return conv

