from app.schemas.pipeline import ExtractedRequirements
from app.services.llm_client import LLMClient


SYSTEM_PROMPT = """
You extract requirements from a funding call notice and must return valid JSON only.
Required fields: criterios, prazos, formatacao, temas_prioritarios.
Each field must be a list of short strings.
All extracted string content must be written in Brazilian Portuguese (pt-BR).
""".strip()


def extract_requirements(edital_text: str, llm: LLMClient) -> ExtractedRequirements:
    user_prompt = f"""
Analyze the funding call text below and extract the requested requirements.

FUNDING CALL TEXT:
{edital_text[:12000]}

Return JSON with the required fields only, and keep all values in Brazilian Portuguese (pt-BR).
""".strip()

    result = llm.complete_json(SYSTEM_PROMPT, user_prompt, stage="extraction")

    if result:
        return ExtractedRequirements(
            criterios=result.get("criterios", []),
            prazos=result.get("prazos", []),
            formatacao=result.get("formatacao", []),
            temas_prioritarios=result.get("temas_prioritarios", []),
        )

    # Fallback heuristico para execucao local sem API key.
    lines = [line.strip() for line in edital_text.splitlines() if line.strip()]
    criterios = [line for line in lines if "criter" in line.lower()][:5]
    prazos = [line for line in lines if "prazo" in line.lower() or "cronograma" in line.lower()][:5]
    formatacao = [line for line in lines if "formata" in line.lower() or "pagina" in line.lower()][:5]
    temas = [line for line in lines if "tema" in line.lower() or "priorit" in line.lower()][:5]

    return ExtractedRequirements(
        criterios=criterios or ["Descrever claramente o problema e impacto esperado."],
        prazos=prazos or ["Informar prazo de submissao e de execucao."],
        formatacao=formatacao or ["Respeitar limite de paginas e estrutura solicitada."],
        temas_prioritarios=temas or ["Alinhar a proposta aos temas prioritarios do edital."],
    )
