# Grant LLM - FastAPI + React

MVP para apoiar escrita de projetos em editais de fomento com pipeline de 4 etapas:
1. ingestao do edital (PDF/TXT)
2. extracao de requisitos
3. coleta de dados da proposta
4. geracao de rascunho + checklist de conformidade

## Stack
- Backend: FastAPI
- Frontend: React + Vite + TypeScript
- LLM: OpenAI API (com modo mock opcional para desenvolvimento)

## Estrutura
- `backend/`: API e pipeline
- `frontend/`: interface web
- `docs/prompts.md`: prompts e estrategia por etapa

## Requisitos
- Python 3.11+
- Node.js 20+

## Como executar

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:8000
Docs API: http://localhost:8000/docs

## Variaveis de ambiente (backend)
- `OPENAI_API_KEY`: chave da OpenAI
- `OPENAI_MODEL`: modelo principal para prompts longos (padrao `gpt-4.1`)
- `OPENAI_MODEL_MINI`: modelo economico para tarefas estruturadas (padrao `gpt-4.1-mini`)
- `OPENAI_MODEL_EXTRACTION`: modelo padrao da etapa de extracao (padrao `gpt-4.1-mini`)
- `OPENAI_MODEL_GENERATION`: modelo padrao da etapa de geracao (padrao `gpt-4.1`)
- `LLM_CONTEXT_SWITCH_TOKENS`: quando o prompt total ultrapassa esse limite, usa `OPENAI_MODEL` (padrao `20000`)
- `LLM_MOCK`: `true` para fallback local sem API
- `MAX_UPLOAD_MB`: limite de upload
- `FRONTEND_ORIGIN`: origem permitida para CORS

## Roteamento de modelos
- Extracao de requisitos usa `OPENAI_MODEL_EXTRACTION` por padrao.
- Geracao de rascunho usa `OPENAI_MODEL_GENERATION` por padrao.
- Se o contexto (system + user prompt) ultrapassar `LLM_CONTEXT_SWITCH_TOKENS`, o backend promove automaticamente para `OPENAI_MODEL`.

## Endpoints principais
- `GET /health`
- `POST /api/pipeline/extract` (multipart com `edital_file`)
- `POST /api/pipeline/run` (multipart com `edital_file` e `project_input_json`)

## Testes
```bash
cd backend
source .venv/bin/activate
pytest -q
```

## Observacoes
- Este MVP nao inclui autenticacao nem persistencia em banco.
- O processamento e sincronico para simplificar o fluxo inicial.
- Evolucoes naturais: fila assincrona, historico de projetos e ingestao por URL.
