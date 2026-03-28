import { PipelineResult } from "../services/api";

type Props = {
  result: PipelineResult;
};

export function GeneratedDraftView({ result }: Props) {
  const draft = result.rascunho;

  return (
    <section className="card">
      <h2>3. Rascunho gerado</h2>
      <article className="draft">
        <h3>Introducao</h3>
        <p>{draft.introducao}</p>

        <h3>Justificativa</h3>
        <p>{draft.justificativa}</p>

        <h3>Objetivos</h3>
        <p>{draft.objetivos}</p>

        <h3>Metodologia</h3>
        <p>{draft.metodologia}</p>

        <h3>Cronograma</h3>
        <p>{draft.cronograma}</p>

        <h3>Orcamento</h3>
        <p>{draft.orcamento}</p>
      </article>
    </section>
  );
}
