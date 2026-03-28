import { ChangeEvent } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  onExtract: () => void;
  isLoading: boolean;
  fileName?: string;
};

export function UploadEditalForm({ onFileSelected, onExtract, isLoading, fileName }: Props) {
  return (
    <section className="card">
      <h2>1. Upload do edital</h2>
      <p>Envie PDF ou TXT para extrair criterios, prazos, formatacao e temas prioritarios.</p>
      <input
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      {fileName && <p className="chip">Arquivo: {fileName}</p>}
      <button type="button" onClick={onExtract} disabled={isLoading || !fileName}>
        {isLoading ? "Extraindo..." : "Extrair requisitos"}
      </button>
    </section>
  );
}
