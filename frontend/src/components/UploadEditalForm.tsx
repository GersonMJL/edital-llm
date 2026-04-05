import { ChangeEvent } from "react";

type Props = {
  onFileSelected: (file: File) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onExtract: () => void;
  isLoading: boolean;
  fileName?: string;
};

export function UploadEditalForm({ onFileSelected, apiKey, onApiKeyChange, onExtract, isLoading, fileName }: Props) {
  return (
    <section className="card">
      <h2>1. Upload do edital</h2>
      <p>Envie PDF ou TXT para extrair critérios, prazos, formatação e temas prioritários.</p>
      <label className="api-key-field">
        Chave da OpenAI
        <input
          type="password"
          value={apiKey}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onApiKeyChange(event.target.value)}
          placeholder="sk-..."
          autoComplete="off"
        />
      </label>
      <input
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      {fileName && <p className="chip">Arquivo: {fileName}</p>}
      <button type="button" onClick={onExtract} disabled={isLoading || !fileName || !apiKey.trim()}>
        {isLoading ? "Extraindo..." : "Extrair requisitos"}
      </button>
    </section>
  );
}
