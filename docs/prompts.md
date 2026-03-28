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
You are a technical writer specialized in grant proposal drafting. Return valid JSON only with: introducao, justificativa, objetivos, metodologia, cronograma, orcamento. All generated text must be in Brazilian Portuguese (pt-BR).

### User prompt
Provides extracted requirements and project inputs to generate the full draft, explicitly requiring pt-BR output.

## Checklist de conformidade
Comparacao automatica entre termos-chave de requisitos e conteudo do rascunho, com status por item:
- atende
- parcial
- nao_atende

Saida inclui score de 0 a 100 e sugestoes de melhoria.
