# Edital LLM - FastAPI + React

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
- Python 3.14+
- Node.js 24+

## Como executar

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
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

## Desenvolvimento local com Docker Compose

Este compose padrao (`docker-compose.yml`) sobe backend + frontend em modo de desenvolvimento:
- backend com `uvicorn --reload`
- frontend com Vite (`npm run dev`)

### 1. Preparar variaveis de ambiente
```bash
cp .env.example .env
```

### 2. Subir ambiente local
```bash
docker compose up --build
```

### 3. Acesso local
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Docs API: `http://localhost:8000/docs`

## Deploy com Docker Compose (VPS)

Esta opcao usa o arquivo `docker-compose.prod.yml` para subir backend + frontend em containers, com o frontend servido por nginx e proxy para a API em `/api`.

### 1. Preparar variaveis de ambiente
```bash
cp .env.example .env
```

Se for usar dominio, ajuste em `.env`:
- `FRONTEND_ORIGIN=https://seu-dominio.com`

### 2. Build e subida dos containers
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Verificar status e logs
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 4. Acesso
- Aplicacao: `http://IP_DA_VPS`
- Healthcheck: `http://IP_DA_VPS/health`

### 5. Atualizar versao no servidor
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Variaveis de ambiente (backend)
- `OPENAI_MODEL`: modelo principal para prompts longos (padrao `gpt-4.1`)
- `OPENAI_MODEL_MINI`: modelo economico para tarefas estruturadas (padrao `gpt-4.1-mini`)
- `OPENAI_MODEL_EXTRACTION`: modelo padrao da etapa de extracao (padrao `gpt-4.1-mini`)
- `OPENAI_MODEL_GENERATION`: modelo padrao da etapa de geracao (padrao `gpt-4.1`)
- `LLM_CONTEXT_SWITCH_TOKENS`: quando o prompt total ultrapassa esse limite, usa `OPENAI_MODEL` (padrao `20000`)
- `LLM_MOCK`: `true` para fallback local sem API
- `MAX_UPLOAD_MB`: limite de upload
- `FRONTEND_ORIGIN`: origem permitida para CORS

### Chave da OpenAI no formulario
- A chave deve ser informada pelo usuario em um campo da interface web.
- O frontend envia `openai_api_key` em cada chamada aos endpoints `POST /api/pipeline/extract` e `POST /api/pipeline/run`.
- Em modo normal, a API retorna erro se a chave nao for enviada.
- Em `LLM_MOCK=true`, o backend usa fallback local e a chave nao e obrigatoria.

## Roteamento de modelos
- Extracao de requisitos usa `OPENAI_MODEL_EXTRACTION` por padrao.
- Geracao de rascunho usa `OPENAI_MODEL_GENERATION` por padrao.
- Se o contexto (system + user prompt) ultrapassar `LLM_CONTEXT_SWITCH_TOKENS`, o backend promove automaticamente para `OPENAI_MODEL`.

## Endpoints principais
- `GET /health`
- `POST /api/pipeline/extract` (multipart com `edital_file` e `openai_api_key`)
- `POST /api/pipeline/run` (multipart com `project_input_json`, `requisitos_json`, `extracted_text_preview` e `openai_api_key`)

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
