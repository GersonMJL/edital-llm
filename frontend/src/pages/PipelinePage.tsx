import { useState } from "react";

import { ComplianceChecklistView } from "../components/ComplianceChecklistView";
import { GeneratedDraftView } from "../components/GeneratedDraftView";
import { ProposalForm } from "../components/ProposalForm";
import { UploadEditalForm } from "../components/UploadEditalForm";
import { ExtractedRequirements, PipelineResult, extractRequirements, runPipeline, UserProjectInput } from "../services/api";

export function PipelinePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [requirements, setRequirements] = useState<ExtractedRequirements | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExtract() {
    if (!selectedFile) return;
    setError(null);
    setLoadingExtract(true);
    try {
      const response = await extractRequirements(selectedFile);
      setRequirements(response.requisitos);
      setPreviewText(response.extracted_text_preview);
      setResult(null);
    } catch {
      setError("Nao foi possivel extrair requisitos. Verifique o arquivo e tente novamente.");
    } finally {
      setLoadingExtract(false);
    }
  }

  async function handleRun(input: UserProjectInput) {
    if (!selectedFile) {
      setError("Selecione um edital antes de gerar o rascunho.");
      return;
    }

    setError(null);
    setLoadingRun(true);
    try {
      const data = await runPipeline(selectedFile, input);
      setResult(data);
    } catch {
      setError("Nao foi possivel gerar o rascunho. Confira os campos e tente de novo.");
    } finally {
      setLoadingRun(false);
    }
  }

  return (
    <main className="layout">
      <header>
        <p className="eyebrow">Grant LLM</p>
        <h1>Pipeline para escrita de projetos de edital</h1>
        <p>
          Extraia requisitos do edital, informe os dados da proposta e gere um rascunho com checklist automatico
          de conformidade.
        </p>
      </header>

      <UploadEditalForm
        onFileSelected={setSelectedFile}
        onExtract={handleExtract}
        isLoading={loadingExtract}
        fileName={selectedFile?.name}
      />

      {requirements && (
        <section className="card">
          <h2>Requisitos extraidos</h2>
          <div className="requirements-grid">
            <RequirementList title="Criterios" items={requirements.criterios} />
            <RequirementList title="Prazos" items={requirements.prazos} />
            <RequirementList title="Formatacao" items={requirements.formatacao} />
            <RequirementList title="Temas prioritarios" items={requirements.temas_prioritarios} />
          </div>
          <details>
            <summary>Preview do texto extraido</summary>
            <pre>{previewText}</pre>
          </details>
        </section>
      )}

      <ProposalForm onSubmit={handleRun} isLoading={loadingRun} />

      {error && <p className="error">{error}</p>}
      {result && (
        <>
          <GeneratedDraftView result={result} />
          <ComplianceChecklistView result={result} />
        </>
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
          <li key={`${title}-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
