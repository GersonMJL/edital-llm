import { useMemo, useState } from "react";

import { PipelineResult } from "../services/api";

type Props = {
  result: PipelineResult;
};

const labels = {
  atende: "Atende",
  parcial: "Parcial",
  nao_atende: "Não atende",
};

type ChecklistStatus = keyof typeof labels;
type FilterStatus = "todos" | ChecklistStatus;

export function ComplianceChecklistView({ result }: Props) {
  const [filter, setFilter] = useState<FilterStatus>("todos");

  const counts = useMemo(() => {
    const summary: Record<ChecklistStatus, number> = {
      atende: 0,
      parcial: 0,
      nao_atende: 0,
    };

    for (const item of result.checklist.itens) {
      summary[item.status] += 1;
    }

    return summary;
  }, [result.checklist.itens]);

  const filteredItems = useMemo(() => {
    if (filter === "todos") {
      return result.checklist.itens;
    }

    return result.checklist.itens.filter((item) => item.status === filter);
  }, [filter, result.checklist.itens]);

  return (
    <section className="card">
      <h2>Checklist de conformidade</h2>
      <p className="score">Score: {result.checklist.score}/100</p>

      <div className="checklist-summary">
        <p className="summary-pill">Total: {result.checklist.itens.length}</p>
        <p className="summary-pill summary-pill-ok">Atende: {counts.atende}</p>
        <p className="summary-pill summary-pill-warn">Parcial: {counts.parcial}</p>
        <p className="summary-pill summary-pill-bad">Não atende: {counts.nao_atende}</p>
      </div>

      <div className="checklist-filters" role="group" aria-label="Filtro de checklist">
        <button
          type="button"
          onClick={() => setFilter("todos")}
          className={`filter-button ${filter === "todos" ? "is-active" : ""}`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => setFilter("atende")}
          className={`filter-button ${filter === "atende" ? "is-active" : ""}`}
        >
          Atende
        </button>
        <button
          type="button"
          onClick={() => setFilter("parcial")}
          className={`filter-button ${filter === "parcial" ? "is-active" : ""}`}
        >
          Parcial
        </button>
        <button
          type="button"
          onClick={() => setFilter("nao_atende")}
          className={`filter-button ${filter === "nao_atende" ? "is-active" : ""}`}
        >
          Não atende
        </button>
      </div>

      <p className="checklist-count">
        Mostrando {filteredItems.length} de {result.checklist.itens.length} item(ns).
      </p>

      <div className="checklist-list checklist-scroll">
        {filteredItems.map((item, idx) => (
          <div className={`check-item status-${item.status}`} key={`${item.requisito}-${idx}`}>
            <strong>{labels[item.status]}</strong>
            <p>{item.requisito}</p>
            <small>{item.justificativa}</small>
          </div>
        ))}

        {filteredItems.length === 0 && <p className="checklist-empty">Nenhum item encontrado para o filtro selecionado.</p>}
      </div>

      {result.checklist.sugestoes_melhoria.length > 0 && (
        <>
          <h3>Sugestões de melhoria</h3>
          <ul>
            {result.checklist.sugestoes_melhoria.map((s, idx) => (
              <li key={`${s}-${idx}`}>{s}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
