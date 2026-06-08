# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MVP for supporting grant proposal writing via a 4-stage LLM pipeline:
1. **Ingest** — parse PDF/TXT edital (no LLM)
2. **Extract** — extract requirements via LLM → `POST /api/pipeline/extract`
3. **Collect** — user fills proposal form (no LLM)
4. **Generate** — draft + compliance checklist via LLM → `POST /api/pipeline/run`

Stack: FastAPI backend + React/Vite/TypeScript frontend. LLM provider: OpenAI API (user supplies the key per-request in the UI). Mock mode (`LLM_MOCK=true`) runs without any API key.

## Development commands

### Backend (Python)
```bash
cd backend
source ../.venv/bin/activate   # venv lives at project root
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run tests:
```bash
cd backend
source ../.venv/bin/activate
pytest -q                        # all tests
pytest tests/test_pipeline.py    # single file
```

### Frontend (Node)
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Docker Compose (local dev with hot reload)
```bash
cp .env.example .env
docker compose up --build
```

### Docker Compose (production)
```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
```
Production serves the frontend via nginx with `/api` proxied to the backend. The health check is at `http://<host>/health`.

## Architecture

### Backend (`backend/app/`)
- `config.py` — `Settings` (pydantic-settings, loaded once via `@lru_cache`). All env vars documented in README.
- `api/routes/pipeline.py` — two endpoints: `/extract` and `/run`. Both accept multipart form data including `openai_api_key`.
- `services/llm_client.py` — `LLMClient` wraps OpenAI; model routing logic lives here. Context size (token estimate = `len(text) // 4`) determines which model is used. All LLM calls use `json_object` response format.
- `services/` — one file per pipeline stage: `file_ingestion`, `requirement_extraction`, `project_generation`, `compliance_checklist`.
- `schemas/pipeline.py` — Pydantic models shared between services and API responses.

Model routing rules (`LLMClient._route_model`):
- If total prompt tokens ≥ `LLM_CONTEXT_SWITCH_TOKENS` → use `OPENAI_MODEL` (heavy model).
- Extraction stage → `OPENAI_MODEL_EXTRACTION` (default `gpt-4.1-mini`).
- Generation stage → `OPENAI_MODEL_GENERATION` (default `gpt-4.1`).
- Checklist stage → `OPENAI_MODEL_MINI`.

The compliance checklist **score is always recalculated in the backend** (not trusted from the LLM). If the LLM response is malformed, a heuristic fallback is used.

### Frontend (`frontend/src/`)
- `services/api.ts` — all API calls, shared types (`UserProjectInput`, `ExtractedRequirements`, `PipelineResult`). API base URL via `VITE_API_BASE_URL` (defaults to `http://localhost:5173/api` in prod via nginx, `http://localhost:8000/api` in dev).
- `pages/PipelinePage.tsx` — single-page orchestrator managing the full pipeline state machine.
- `components/` — `UploadEditalForm`, `ProposalForm`, `GeneratedDraftView`, `ComplianceChecklistView`.

The UI enforces step order: extraction must succeed before the proposal form can be submitted.

## Key env vars

| Variable | Default | Purpose |
|---|---|---|
| `LLM_MOCK` | `false` | Skip OpenAI calls; return empty JSON |
| `OPENAI_MODEL` | `gpt-4.1` | Used when context exceeds token threshold |
| `OPENAI_MODEL_EXTRACTION` | `gpt-4.1-mini` | Extraction stage |
| `OPENAI_MODEL_GENERATION` | `gpt-4.1` | Generation stage |
| `LLM_CONTEXT_SWITCH_TOKENS` | `20000` | Token threshold for model promotion |
| `FRONTEND_ORIGIN` | `http://localhost:5173,...` | CORS allowed origins (comma-separated) |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Frontend API base |

## Prompts

See `docs/prompts.md` for the exact system/user prompt strategy per stage. All LLM outputs must be in Brazilian Portuguese (pt-BR); prompts enforce this explicitly.
