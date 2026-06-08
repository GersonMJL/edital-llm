export type UserProjectInput = {
  titulo: string;
  equipe: string;
  objetivos: string;
  metodologia: string;
  orcamento_estimado: string;
};

export type ExtractedRequirements = {
  criterios: string[];
  prazos: string[];
  formatacao: string[];
  temas_prioritarios: string[];
};

export type ProjectDraft = {
  introducao: string;
  justificativa: string;
  objetivos: string;
  metodologia: string;
  cronograma: string;
  orcamento: string;
};

export type PipelineResult = {
  extracted_text_preview: string;
  requisitos: ExtractedRequirements;
  rascunho: ProjectDraft;
  checklist: {
    score: number;
    itens: Array<{
      requisito: string;
      status: "atende" | "parcial" | "nao_atende";
      justificativa: string;
    }>;
    sugestoes_melhoria: string[];
  };
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

async function buildApiError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const data = (await response.json()) as { detail?: string };
    if (data?.detail) {
      return new Error(data.detail);
    }
  } catch {
    // Ignora erro de parse e usa mensagem padrao.
  }

  return new Error(fallbackMessage);
}

export async function extractRequirements(
  file: File,
): Promise<{ extracted_text_preview: string; requisitos: ExtractedRequirements }> {
  const form = new FormData();
  form.append("edital_file", file);

  const response = await fetch(`${API_BASE}/api/pipeline/extract`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw await buildApiError(response, "Falha ao extrair requisitos do edital.");
  }

  return response.json();
}

export type RunPipelineCallbacks = {
  onProgress: (message: string) => void;
  onDraftReady: (draft: ProjectDraft) => void;
  onComplete: (result: PipelineResult) => void;
  onError: (detail: string) => void;
};

export async function runPipelineStream(
  input: UserProjectInput,
  requisitos: ExtractedRequirements,
  extractedTextPreview: string,
  callbacks: RunPipelineCallbacks,
): Promise<void> {
  const form = new FormData();
  form.append("project_input_json", JSON.stringify(input));
  form.append("requisitos_json", JSON.stringify(requisitos));
  form.append("extracted_text_preview", extractedTextPreview);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/pipeline/run`, {
      method: "POST",
      body: form,
    });
  } catch {
    callbacks.onError("Não foi possível conectar ao servidor.");
    return;
  }

  if (!response.ok) {
    const err = await buildApiError(response, "Falha ao gerar rascunho e checklist.");
    callbacks.onError(err.message);
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const lines = part.trim().split("\n");
      let eventName = "";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLine = line.slice(5).trim();
      }
      if (!eventName || !dataLine) continue;

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(dataLine) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (eventName === "progress") callbacks.onProgress(payload.message as string);
      else if (eventName === "draft_ready") callbacks.onDraftReady(payload.rascunho as ProjectDraft);
      else if (eventName === "complete") callbacks.onComplete(payload as PipelineResult);
      else if (eventName === "error") callbacks.onError(payload.detail as string);
    }
  }
}
