import json

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.config import Settings, get_settings
from app.schemas.pipeline import ExtractedRequirements, PipelineRunResponse, UserProjectInput
from app.services.compliance_checklist import build_compliance_checklist
from app.services.file_ingestion import ingest_edital_file
from app.services.llm_client import LLMClient
from app.services.project_generation import generate_project_draft
from app.services.requirement_extraction import extract_requirements

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


@router.post("/extract")
async def extract_only(
    edital_file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
):
    llm = LLMClient(settings)
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
    settings: Settings = Depends(get_settings),
):
    project_input = UserProjectInput(**json.loads(project_input_json))
    requisitos = ExtractedRequirements(**json.loads(requisitos_json))
    llm = LLMClient(settings)

    rascunho = generate_project_draft(requisitos, project_input, llm)
    checklist = build_compliance_checklist(requisitos, rascunho, llm)

    return PipelineRunResponse(
        extracted_text_preview=extracted_text_preview[:1200],
        requisitos=requisitos,
        rascunho=rascunho,
        checklist=checklist,
    )
