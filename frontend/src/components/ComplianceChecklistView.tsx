import { PipelineResult } from "../services/api";

type Props = {
  result: PipelineResult;
};

const labels = {
  atende: "Atende",
  parcial: "Parcial",
  nao_atende: "Nao atende",
};

export function ComplianceChecklistView({ result }: Props) {
  return (
    <section className="card">
      <h2>Checklist de conformidade</h2>
      <p className="score">Score: {result.checklist.score}/100</p>
      <div className="checklist-list">
        {result.checklist.itens.map((item, idx) => (
          <div className={`check-item status-${item.status}`} key={`${item.requisito}-${idx}`}>
            <strong>{labels[item.status]}</strong>
            <p>{item.requisito}</p>
            <small>{item.justificativa}</small>
          </div>
        ))}
      </div>

      {result.checklist.sugestoes_melhoria.length > 0 && (
        <>
          <h3>Sugestoes de melhoria</h3>
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
