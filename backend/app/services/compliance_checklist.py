from app.schemas.pipeline import ChecklistItem, ComplianceChecklist, ExtractedRequirements, ProjectDraft
from app.services.llm_client import LLMClient


SYSTEM_PROMPT = """
You are a compliance reviewer for public grant proposals.
Return valid JSON only with exactly these fields:
- itens: list of objects with requisito, status, justificativa
- sugestoes_melhoria: list of short actionable strings

Rules:
- status must be one of: atende, parcial, nao_atende
- Use objective, evidence-based justification anchored in the draft text
- Keep all textual output in Brazilian Portuguese (pt-BR)
""".strip()


def _section_text(draft: ProjectDraft) -> str:
    return "\n".join(
        [
            draft.introducao,
            draft.justificativa,
            draft.objetivos,
            draft.metodologia,
            draft.cronograma,
            draft.orcamento,
        ]
    ).lower()


def _evaluate_requirement(requirement: str, full_text: str) -> ChecklistItem:
    req_tokens = [token for token in requirement.lower().split() if len(token) > 4]
    hit_count = sum(1 for token in req_tokens if token in full_text)

    if not req_tokens:
        return ChecklistItem(requisito=requirement, status="parcial", justificativa="Requisito generico, exige revisao humana.")

    ratio = hit_count / len(req_tokens)
    if ratio >= 0.6:
        status = "atende"
        just = "A maior parte dos termos-chave do requisito aparece no rascunho."
    elif ratio >= 0.3:
        status = "parcial"
        just = "O requisito foi abordado parcialmente; faltam detalhes de aderencia."
    else:
        status = "nao_atende"
        just = "Nao ha evidencia suficiente de atendimento no texto gerado."

    return ChecklistItem(requisito=requirement, status=status, justificativa=just)


def _build_score(items: list[ChecklistItem]) -> int:
    points = 0
    for item in items:
        if item.status == "atende":
            points += 2
        elif item.status == "parcial":
            points += 1

    max_points = max(1, len(items) * 2)
    return round((points / max_points) * 100)


def _build_fallback_suggestions(items: list[ChecklistItem], score: int) -> list[str]:
    suggestions: list[str] = []
    if any(item.status == "nao_atende" for item in items):
        suggestions.append("Explicitar como o projeto atende cada criterio do edital, item a item.")
    if any(item.status != "atende" for item in items):
        suggestions.append("Incluir um quadro final de aderencia, mapeando requisito para secao correspondente.")
    if score < 70:
        suggestions.append("Reforcar detalhes de cronograma, entregaveis e justificativa de orcamento.")

    return suggestions


def _build_fallback_checklist(requisitos: ExtractedRequirements, draft: ProjectDraft) -> ComplianceChecklist:
    full_text = _section_text(draft)
    all_requirements = (
        requisitos.criterios
        + requisitos.prazos
        + requisitos.formatacao
        + requisitos.temas_prioritarios
    )

    items = [_evaluate_requirement(req, full_text) for req in all_requirements]
    score = _build_score(items)
    suggestions = _build_fallback_suggestions(items, score)

    return ComplianceChecklist(score=score, itens=items, sugestoes_melhoria=suggestions)


def build_compliance_checklist(requisitos: ExtractedRequirements, draft: ProjectDraft, llm: LLMClient) -> ComplianceChecklist:
    all_requirements = (
        requisitos.criterios
        + requisitos.prazos
        + requisitos.formatacao
        + requisitos.temas_prioritarios
    )

    user_prompt = f"""
Evaluate the draft compliance against the funding call requirements.

REQUIREMENTS (original order):
{all_requirements}

PROJECT DRAFT:
- Introducao: {draft.introducao}
- Justificativa: {draft.justificativa}
- Objetivos: {draft.objetivos}
- Metodologia: {draft.metodologia}
- Cronograma: {draft.cronograma}
- Orcamento: {draft.orcamento}

Return JSON with:
- itens: one checklist item per requirement, preserving the same order.
- sugestoes_melhoria: a list of practical and objective recommendations.
""".strip()

    result = llm.complete_json(SYSTEM_PROMPT, user_prompt, stage="checklist")
    if result:
        raw_items = result.get("itens", [])
        items: list[ChecklistItem] = []
        for index, req in enumerate(all_requirements):
            raw_item = raw_items[index] if index < len(raw_items) and isinstance(raw_items[index], dict) else {}
            raw_status = raw_item.get("status", "parcial")
            status = raw_status if raw_status in {"atende", "parcial", "nao_atende"} else "parcial"
            justificativa = str(raw_item.get("justificativa", "Analise automatica com informacao insuficiente.")).strip()

            items.append(
                ChecklistItem(
                    requisito=req,
                    status=status,
                    justificativa=justificativa or "Analise automatica com informacao insuficiente.",
                )
            )

        score = _build_score(items)
        raw_suggestions = result.get("sugestoes_melhoria", [])
        suggestions = [str(s).strip() for s in raw_suggestions if str(s).strip()] if isinstance(raw_suggestions, list) else []
        if not suggestions:
            suggestions = _build_fallback_suggestions(items, score)

        return ComplianceChecklist(score=score, itens=items, sugestoes_melhoria=suggestions)

    return _build_fallback_checklist(requisitos, draft)
