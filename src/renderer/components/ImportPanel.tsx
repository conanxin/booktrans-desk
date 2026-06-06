interface ImportPanelProps {
  busy: boolean;
  onImport: () => void;
}

export function ImportPanel({ busy, onImport }: ImportPanelProps) {
  return (
    <section className="panel">
      <h2>Import</h2>
      <button className="primary full" onClick={onImport} disabled={busy}>
        Import EPUB
      </button>
    </section>
  );
}
