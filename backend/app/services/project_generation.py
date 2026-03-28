from app.schemas.pipeline import ExtractedRequirements, ProjectDraft, UserProjectInput
from app.services.llm_client import LLMClient


SYSTEM_PROMPT = """
You are a technical writer specialized in grant proposal drafting.
Return valid JSON only with the following fields:
introducao, justificativa, objetivos, metodologia, cronograma, orcamento.
All generated textual content must be in Brazilian Portuguese (pt-BR).
""".strip()


def generate_project_draft(
    requisitos: ExtractedRequirements,
    project_input: UserProjectInput,
    llm: LLMClient,
) -> ProjectDraft:
    user_prompt = f"""
Using the funding call requirements and the user information, generate a structured proposal draft.

REQUIREMENTS:
- Criterios: {requisitos.criterios}
- Prazos: {requisitos.prazos}
- Formatacao: {requisitos.formatacao}
- Temas prioritarios: {requisitos.temas_prioritarios}

PROJECT INPUT:
- Titulo: {project_input.titulo}
- Equipe: {project_input.equipe}
- Objetivos: {project_input.objetivos}
- Metodologia: {project_input.metodologia}
- Orcamento estimado: {project_input.orcamento_estimado}

Important: all JSON string values must be written in Brazilian Portuguese (pt-BR).
""".strip()

    result = llm.complete_json(SYSTEM_PROMPT, user_prompt, stage="generation")
    if result:
        return ProjectDraft(
            introducao=result.get("introducao", ""),
            justificativa=result.get("justificativa", ""),
            objetivos=result.get("objetivos", ""),
            metodologia=result.get("metodologia", ""),
            cronograma=result.get("cronograma", ""),
            orcamento=result.get("orcamento", ""),
        )

    return ProjectDraft(
        introducao=f"O projeto {project_input.titulo} responde a uma demanda alinhada ao edital, com foco em impacto tecnico e social.",
        justificativa="A proposta e relevante por enderecar um problema concreto, com viabilidade de execucao e potencial de disseminacao de resultados.",
        objetivos=project_input.objetivos,
        metodologia=project_input.metodologia,
        cronograma="Meses 1-2: planejamento e ajustes metodologicos. Meses 3-8: execucao tecnica e monitoramento. Meses 9-12: consolidacao, avaliacao e divulgacao.",
        orcamento=f"Orcamento estimado: {project_input.orcamento_estimado}. Distribuir em recursos humanos, insumos, infraestrutura e divulgacao.",
    )
