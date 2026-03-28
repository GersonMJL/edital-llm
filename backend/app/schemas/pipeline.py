from typing import Literal

from pydantic import BaseModel, Field


class UserProjectInput(BaseModel):
    titulo: str = Field(min_length=3)
    equipe: str = Field(min_length=3)
    objetivos: str = Field(min_length=10)
    metodologia: str = Field(min_length=10)
    orcamento_estimado: str = Field(min_length=3)


class ExtractedRequirements(BaseModel):
    criterios: list[str]
    prazos: list[str]
    formatacao: list[str]
    temas_prioritarios: list[str]


class ProjectDraft(BaseModel):
    introducao: str
    justificativa: str
    objetivos: str
    metodologia: str
    cronograma: str
    orcamento: str


class ChecklistItem(BaseModel):
    requisito: str
    status: Literal["atende", "parcial", "nao_atende"]
    justificativa: str


class ComplianceChecklist(BaseModel):
    score: int = Field(ge=0, le=100)
    itens: list[ChecklistItem]
    sugestoes_melhoria: list[str]


class PipelineRunResponse(BaseModel):
    extracted_text_preview: str
    requisitos: ExtractedRequirements
    rascunho: ProjectDraft
    checklist: ComplianceChecklist
