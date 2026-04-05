from app.schemas.pipeline import ExtractedRequirements, ProjectDraft, UserProjectInput
from app.services.llm_client import LLMClient


SYSTEM_PROMPT = """
You are a technical writer specialized in grant proposal drafting.
Return valid JSON only with the following fields:
introducao, justificativa, objetivos, metodologia, cronograma, orcamento.
All generated textual content must be in Brazilian Portuguese (pt-BR).
Each field value must be formatted as Markdown, using natural prose, bullet lists, or numbered lists when helpful.
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
Important: each JSON string value must be valid Markdown text for its section. Do not use HTML tags.
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
        introducao=(
            f"O projeto **{project_input.titulo}** responde a uma demanda alinhada ao edital, "
            "com foco em impacto tecnico e social."
        ),
        justificativa=(
            "A proposta e relevante por enderecar um problema concreto, com viabilidade "
            "de execucao e potencial de disseminacao de resultados."
        ),
        objetivos=(
            "- Consolidar os objetivos estrategicos do projeto.\n"
            f"- Detalhar metas operacionais com base em: {project_input.objetivos}"
        ),
        metodologia=(
            "A abordagem metodologica contempla etapas de planejamento, execucao e avaliacao.\n\n"
            f"{project_input.metodologia}"
        ),
        cronograma=(
            "1. **Meses 1-2**: planejamento e ajustes metodologicos.\n"
            "2. **Meses 3-8**: execucao tecnica e monitoramento.\n"
            "3. **Meses 9-12**: consolidacao, avaliacao e divulgacao."
        ),
        orcamento=(
            f"Orcamento estimado: **{project_input.orcamento_estimado}**.\n\n"
            "Distribuicao sugerida:\n"
            "- Recursos humanos\n"
            "- Insumos\n"
            "- Infraestrutura\n"
            "- Divulgacao"
        ),
    )
