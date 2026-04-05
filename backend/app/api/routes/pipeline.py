import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.schemas.pipeline import ExtractedRequirements, PipelineRunResponse, UserProjectInput
from app.services.compliance_checklist import build_compliance_checklist
from app.services.file_ingestion import ingest_edital_file
from app.services.llm_client import LLMClient
from app.services.project_generation import generate_project_draft
from app.services.requirement_extraction import extract_requirements

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


def _normalize_api_key(openai_api_key: str, settings: Settings) -> str:
    normalized_key = openai_api_key.strip()
    if not settings.llm_mock and not normalized_key:
        raise HTTPException(status_code=400, detail="Informe a chave da OpenAI para continuar.")
    return normalized_key


@router.post("/extract")
async def extract_only(
    edital_file: UploadFile = File(...),
    openai_api_key: str = Form(""),
    settings: Settings = Depends(get_settings),
):
    normalized_key = _normalize_api_key(openai_api_key, settings)
    llm = LLMClient(settings, normalized_key)
    edital_text = await ingest_edital_file(edital_file, settings.max_upload_mb)
    requisitos = extract_requirements(edital_text, llm)
    return {
        "extracted_text_preview": edital_text[:1200],
        "requisitos": requisitos.model_dump(),
    }


@router.post("/run", response_model=PipelineRunResponse)
async def run_pipeline(
    project_input_json: str = Form(...),
    requisitos_json: str = Form(...),
    extracted_text_preview: str = Form(""),
    openai_api_key: str = Form(""),
    settings: Settings = Depends(get_settings),
):
    normalized_key = _normalize_api_key(openai_api_key, settings)
    project_input = UserProjectInput(**json.loads(project_input_json))
    requisitos = ExtractedRequirements(**json.loads(requisitos_json))
    llm = LLMClient(settings, normalized_key)

    rascunho = generate_project_draft(requisitos, project_input, llm)
    checklist = build_compliance_checklist(requisitos, rascunho, llm)

    return PipelineRunResponse(
        extracted_text_preview=extracted_text_preview[:1200],
        requisitos=requisitos,
        rascunho=rascunho,
        checklist=checklist,
    )
