from io import BytesIO

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader


ALLOWED_TYPES = {"application/pdf", "text/plain"}


async def ingest_edital_file(upload: UploadFile, max_upload_mb: int) -> str:
    if upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de arquivo invalido. Use PDF ou TXT.")

    content = await upload.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > max_upload_mb:
        raise HTTPException(status_code=400, detail=f"Arquivo excede {max_upload_mb}MB")

    if upload.content_type == "text/plain":
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=400, detail="TXT deve estar em UTF-8") from exc

    reader = PdfReader(BytesIO(content))
    pages_text: list[str] = []
    for page in reader.pages:
        pages_text.append(page.extract_text() or "")

    extracted = "\n".join(pages_text).strip()
    if not extracted:
        raise HTTPException(status_code=400, detail="Nao foi possivel extrair texto do PDF")

    return extracted
