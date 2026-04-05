from io import BytesIO
import logging

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError


ALLOWED_TYPES = {"application/pdf", "text/plain"}
logger = logging.getLogger("app.services.file_ingestion")


async def ingest_edital_file(upload: UploadFile, max_upload_mb: int) -> str:
    content = await upload.read()
    size_mb = len(content) / (1024 * 1024)

    logger.info(
        "Iniciando ingestao de arquivo",
        extra={
            "upload_filename": upload.filename,
            "upload_content_type": upload.content_type,
            "upload_size_mb": round(size_mb, 3),
        },
    )

    if upload.content_type not in ALLOWED_TYPES:
        logger.warning(
            "Tipo de arquivo invalido recebido",
            extra={
                "upload_filename": upload.filename,
                "upload_content_type": upload.content_type,
            },
        )
        raise HTTPException(
            status_code=400,
            detail=(
                "Tipo de arquivo invalido. Use PDF ou TXT. "
                f"Recebido: {upload.content_type or 'desconhecido'}"
            ),
        )

    if size_mb > max_upload_mb:
        logger.warning(
            "Arquivo excedeu limite de upload",
            extra={
                "upload_filename": upload.filename,
                "upload_size_mb": round(size_mb, 3),
                "max_upload_mb": max_upload_mb,
            },
        )
        raise HTTPException(
            status_code=400,
            detail=(
                f"Arquivo excede {max_upload_mb}MB "
                f"(tamanho recebido: {size_mb:.2f}MB)"
            ),
        )

    if upload.content_type == "text/plain":
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError as exc:
            logger.warning(
                "Falha ao decodificar TXT como UTF-8",
                extra={
                    "upload_filename": upload.filename,
                    "upload_content_type": upload.content_type,
                },
            )
            raise HTTPException(status_code=400, detail="TXT deve estar em UTF-8") from exc

    try:
        reader = PdfReader(BytesIO(content))
    except PdfReadError as exc:
        logger.exception(
            "Falha ao abrir PDF para leitura",
            extra={
                "upload_filename": upload.filename,
                "upload_content_type": upload.content_type,
                "upload_size_mb": round(size_mb, 3),
            },
        )
        raise HTTPException(
            status_code=400,
            detail="PDF invalido ou corrompido. Nao foi possivel abrir o arquivo.",
        ) from exc

    pages_text: list[str] = []
    try:
        for page in reader.pages:
            pages_text.append(page.extract_text() or "")
    except Exception as exc:  # pragma: no cover - erros variam por PDF
        logger.exception(
            "Falha durante extracao de texto do PDF",
            extra={
                "upload_filename": upload.filename,
                "upload_content_type": upload.content_type,
                "upload_size_mb": round(size_mb, 3),
            },
        )
        raise HTTPException(
            status_code=400,
            detail="Falha ao extrair texto do PDF. O arquivo pode estar em formato nao suportado.",
        ) from exc

    extracted = "\n".join(pages_text).strip()
    if not extracted:
        logger.warning(
            "Extracao de PDF retornou texto vazio",
            extra={
                "upload_filename": upload.filename,
                "upload_content_type": upload.content_type,
                "upload_size_mb": round(size_mb, 3),
                "pages": len(reader.pages),
            },
        )
        raise HTTPException(
            status_code=400,
            detail=(
                "Nao foi possivel extrair texto do PDF. "
                "Possivel PDF escaneado (imagem) ou sem camada de texto."
            ),
        )

    logger.info(
        "Ingestao concluida com sucesso",
        extra={
            "upload_filename": upload.filename,
            "upload_content_type": upload.content_type,
            "upload_size_mb": round(size_mb, 3),
            "pages": len(reader.pages),
            "chars_extracted": len(extracted),
        },
    )

    print(extracted)

    return extracted
