import { ChangeEvent, useState } from "react";

import { UserProjectInput } from "../services/api";

type Props = {
  onSubmit: (input: UserProjectInput) => void;
  isLoading: boolean;
};

const initialState: UserProjectInput = {
  titulo: "",
  equipe: "",
  objetivos: "",
  metodologia: "",
  orcamento_estimado: "",
};

export function ProposalForm({ onSubmit, isLoading }: Props) {
  const [form, setForm] = useState<UserProjectInput>(initialState);

  function update<K extends keyof UserProjectInput>(key: K, value: UserProjectInput[K]) {
    setForm((prev: UserProjectInput) => ({ ...prev, [key]: value }));
  }

  return (
    <section className="card">
      <h2>2. Dados do projeto</h2>
      <p>Preencha as informacoes-chave para gerar o rascunho alinhado ao edital.</p>

      <div className="grid">
        <label>
          Titulo
          <input value={form.titulo} onChange={(e: ChangeEvent<HTMLInputElement>) => update("titulo", e.target.value)} />
        </label>
        <label>
          Equipe
          <input value={form.equipe} onChange={(e: ChangeEvent<HTMLInputElement>) => update("equipe", e.target.value)} />
        </label>
        <label>
          Objetivos
          <textarea value={form.objetivos} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("objetivos", e.target.value)} rows={3} />
        </label>
        <label>
          Metodologia
          <textarea value={form.metodologia} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => update("metodologia", e.target.value)} rows={3} />
        </label>
        <label>
          Orcamento estimado
          <input
            value={form.orcamento_estimado}
            onChange={(e: ChangeEvent<HTMLInputElement>) => update("orcamento_estimado", e.target.value)}
            placeholder="Ex: R$ 250.000"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => onSubmit(form)}
        disabled={
          isLoading ||
          !form.titulo ||
          !form.equipe ||
          !form.objetivos ||
          !form.metodologia ||
          !form.orcamento_estimado
        }
      >
        {isLoading ? "Gerando..." : "Gerar rascunho"}
      </button>
    </section>
  );
}
