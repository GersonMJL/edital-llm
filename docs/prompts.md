# Prompts do Pipeline

## Etapa 1 - Ingestao do edital
Nao usa LLM. Faz parse de PDF/TXT e entrega texto bruto para as proximas etapas.

## Etapa 2 - Extracao de requisitos
### System prompt
You extract requirements from a funding call notice and must return valid JSON only. Required fields: criterios, prazos, formatacao, temas_prioritarios. Each field must be a list of short strings. All extracted content must be in Brazilian Portuguese (pt-BR).

### User prompt
Contains the funding call text (truncated for cost control) and asks for structured extraction. It also enforces pt-BR in all output values.

## Etapa 3 - Coleta de dados do usuario
Nao usa LLM. Coleta no frontend e valida no backend via schema:
- titulo
- equipe
- objetivos
- metodologia
- orcamento_estimado

## Etapa 4 - Geracao do rascunho
### System prompt
You are a technical writer specialized in grant proposal drafting. Return valid JSON only with: introducao, justificativa, objetivos, metodologia, cronograma, orcamento. All generated text must be in Brazilian Portuguese (pt-BR). Each field value must be formatted as Markdown, preserving a readable section structure.

### User prompt
Provides extracted requirements and project inputs to generate the full draft, explicitly requiring pt-BR output and Markdown in every textual field.

## Checklist de conformidade
### System prompt
You are a compliance reviewer for public grant proposals. Return valid JSON only with:
- itens: list of objects with requisito, status, justificativa
- sugestoes_melhoria: list of short actionable strings

Status permitido por item:
- atende
- parcial
- nao_atende

### User prompt
Prompt em ingles, enviando requisitos extraidos e rascunho completo do projeto, exigindo:
- um item por requisito, na mesma ordem da lista original
- justificativas objetivas por item
- sugestoes de melhoria praticas
- todo o conteudo textual em pt-BR

### Pos-processamento no backend
O backend recalcula o score (0 a 100) com base nos status retornados.
Se o LLM falhar, usa fallback heuristico para itens e sugestoes.
