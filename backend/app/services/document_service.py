import io
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader
from docx import Document
from app.core.config import settings

class DocumentService:
    @staticmethod
    def validate_file(file: UploadFile) -> str:
        filename = file.filename or "uploaded_document"
        suffix = Path(filename).suffix.lower()

        if suffix not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{suffix}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        return suffix

    @staticmethod
    async def extract_text_from_upload(file: UploadFile) -> tuple[str, str]:
        suffix = DocumentService.validate_file(file)
        content_bytes = await file.read()

        if len(content_bytes) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE // (1024*1024)} MB."
            )

        filename = file.filename or "document"
        text = ""

        try:
            if suffix == ".txt":
                try:
                    text = content_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    text = content_bytes.decode("latin-1", errors="ignore")

            elif suffix == ".pdf":
                pdf_reader = PdfReader(io.BytesIO(content_bytes))
                pages_text = []
                for i, page in enumerate(pdf_reader.pages):
                    extracted = page.extract_text()
                    if extracted:
                        pages_text.append(extracted)
                text = "\n\n".join(pages_text)

            elif suffix == ".docx":
                doc = Document(io.BytesIO(content_bytes))
                paras = [p.text for p in doc.paragraphs if p.text.strip()]
                for table in doc.tables:
                    for row in table.rows:
                        row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_text:
                            paras.append(" | ".join(row_text))
                text = "\n\n".join(paras)

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse document contents: {str(e)}"
            )

        cleaned = text.strip()
        if not cleaned:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file appears to be empty or has no readable text content."
            )

        return cleaned, filename

document_service = DocumentService()

