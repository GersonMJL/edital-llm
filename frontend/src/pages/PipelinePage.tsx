import { useState } from "react";

import { ComplianceChecklistView } from "../components/ComplianceChecklistView";
import { GeneratedDraftView } from "../components/GeneratedDraftView";
import { ProposalForm } from "../components/ProposalForm";
import { UploadEditalForm } from "../components/UploadEditalForm";
import {
  ExtractedRequirements,
  PipelineResult,
  ProjectDraft,
  extractRequirements,
  runPipelineStream,
  UserProjectInput,
} from "../services/api";

const LEADING_MARKER_RE = /^\s*(?:[-*]+|\d{1,2}[.)]|[a-z][.)])\s+/i;

export function PipelinePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [requirements, setRequirements] = useState<ExtractedRequirements | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [partialDraft, setPartialDraft] = useState<ProjectDraft | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    setRequirements(null);
    setPreviewText("");
    setPartialDraft(null);
    setResult(null);
    setRunMessage(null);
    setError(null);
  }

  async function handleExtract() {
    if (!selectedFile) return;

    setError(null);
    setLoadingExtract(true);
    try {
      const response = await extractRequirements(selectedFile);
      setRequirements(response.requisitos);
      setPreviewText(response.extracted_text_preview);
      setPartialDraft(null);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível extrair requisitos. Verifique o arquivo e tente novamente.");
    } finally {
      setLoadingExtract(false);
    }
  }

  async function handleRun(input: UserProjectInput) {
    if (!requirements) {
      setError("Extraia os requisitos do edital antes de gerar o rascunho.");
      return;
    }

    setError(null);
    setLoadingRun(true);
    setPartialDraft(null);
    setResult(null);
    setRunMessage(null);

    await runPipelineStream(input, requirements, previewText, {
      onProgress: (msg) => setRunMessage(msg),
      onDraftReady: (draft) => {
        setPartialDraft(draft);
        setRunMessage(null);
      },
      onComplete: (fullResult) => {
        setResult(fullResult);
        setPartialDraft(null);
        setLoadingRun(false);
      },
      onError: (detail) => {
        setError(detail);
        setLoadingRun(false);
      },
    });
  }

  const draftForDisplay = result
    ? result
    : partialDraft
    ? ({
        extracted_text_preview: previewText,
        requisitos: requirements!,
        rascunho: partialDraft,
        checklist: { score: 0, itens: [], sugestoes_melhoria: [] },
      } as PipelineResult)
    : null;

  return (
    <main className="layout">
      <header>
        <p className="eyebrow">EDITAL LLM</p>
        <h1>Pipeline para escrita de projetos de edital</h1>
        <p>
          Extraia requisitos do edital, informe os dados da proposta e gere um rascunho com checklist automático
          de conformidade.
        </p>
      </header>

      <UploadEditalForm
        onFileSelected={handleFileSelected}
        onExtract={handleExtract}
        isLoading={loadingExtract}
        fileName={selectedFile?.name}
      />

      {requirements && (
        <section className="card">
          <h2>Requisitos extraídos</h2>
          <div className="requirements-grid">
            <RequirementList title="Critérios" items={requirements.criterios} />
            <RequirementList title="Prazos" items={requirements.prazos} />
            <RequirementList title="Formatação" items={requirements.formatacao} />
            <RequirementList title="Temas prioritários" items={requirements.temas_prioritarios} />
          </div>
          <details>
            <summary>Prévia do texto extraído</summary>
            <pre>{previewText}</pre>
          </details>
        </section>
      )}

      <ProposalForm onSubmit={handleRun} isLoading={loadingRun} canSubmit={Boolean(requirements)} />

      {error && <p className="error">{error}</p>}

      {loadingRun && runMessage && <p className="loading-message">{runMessage}</p>}

      {draftForDisplay && (
        <GeneratedDraftView result={draftForDisplay} />
      )}

      {!loadingRun && result && (
        <ComplianceChecklistView result={result} />
      )}
    </main>
  );
}

function RequirementList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`}>{item.replace(LEADING_MARKER_RE, "").trim()}</li>
        ))}
      </ul>
    </div>
  );
}
