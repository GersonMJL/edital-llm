from app.schemas.pipeline import ChecklistItem, ComplianceChecklist, ExtractedRequirements, ProjectDraft


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


def build_compliance_checklist(requisitos: ExtractedRequirements, draft: ProjectDraft) -> ComplianceChecklist:
    full_text = _section_text(draft)
    all_requirements = (
        requisitos.criterios
        + requisitos.prazos
        + requisitos.formatacao
        + requisitos.temas_prioritarios
    )

    items = [_evaluate_requirement(req, full_text) for req in all_requirements]

    points = 0
    for item in items:
        if item.status == "atende":
            points += 2
        elif item.status == "parcial":
            points += 1

    max_points = max(1, len(items) * 2)
    score = round((points / max_points) * 100)

    suggestions: list[str] = []
    if any(item.status == "nao_atende" for item in items):
        suggestions.append("Explicitar como o projeto atende cada criterio do edital, item a item.")
    if any(item.status != "atende" for item in items):
        suggestions.append("Incluir um quadro final de aderencia, mapeando requisito para secao correspondente.")
    if score < 70:
        suggestions.append("Reforcar detalhes de cronograma, entregaveis e justificativa de orcamento.")

    return ComplianceChecklist(score=score, itens=items, sugestoes_melhoria=suggestions)
