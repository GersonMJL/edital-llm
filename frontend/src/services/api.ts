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

const API_BASE = "http://localhost:8000";

export async function extractRequirements(file: File): Promise<{ extracted_text_preview: string; requisitos: ExtractedRequirements }> {
  const form = new FormData();
  form.append("edital_file", file);

  const response = await fetch(`${API_BASE}/api/pipeline/extract`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error("Falha ao extrair requisitos do edital.");
  }

  return response.json();
}

export async function runPipeline(file: File, input: UserProjectInput): Promise<PipelineResult> {
  const form = new FormData();
  form.append("edital_file", file);
  form.append("project_input_json", JSON.stringify(input));

  const response = await fetch(`${API_BASE}/api/pipeline/run`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error("Falha ao gerar rascunho e checklist.");
  }

  return response.json();
}
