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

export type PipelineResult = {
  extracted_text_preview: string;
  requisitos: ExtractedRequirements;
  rascunho: {
    introducao: string;
    justificativa: string;
    objetivos: string;
    metodologia: string;
    cronograma: string;
    orcamento: string;
  };
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

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

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
  openaiApiKey: string,
): Promise<{ extracted_text_preview: string; requisitos: ExtractedRequirements }> {
  const form = new FormData();
  form.append("edital_file", file);
  form.append("openai_api_key", openaiApiKey);

  const response = await fetch(`${API_BASE}/api/pipeline/extract`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw await buildApiError(response, "Falha ao extrair requisitos do edital.");
  }

  return response.json();
}

export async function runPipeline(
  input: UserProjectInput,
  requisitos: ExtractedRequirements,
  extractedTextPreview: string,
  openaiApiKey: string,
): Promise<PipelineResult> {
  const form = new FormData();
  form.append("project_input_json", JSON.stringify(input));
  form.append("requisitos_json", JSON.stringify(requisitos));
  form.append("extracted_text_preview", extractedTextPreview);
  form.append("openai_api_key", openaiApiKey);

  const response = await fetch(`${API_BASE}/api/pipeline/run`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw await buildApiError(response, "Falha ao gerar rascunho e checklist.");
  }

  return response.json();
}
