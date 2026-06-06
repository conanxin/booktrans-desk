import { useEffect, useState } from "react";
import type { TranslationSettings } from "../../shared/types.js";

interface TranslationSettingsProps {
  settings: TranslationSettings;
  busy: boolean;
  onSave: (settings: TranslationSettings) => void;
}

export function TranslationSettingsPanel({ settings, busy, onSave }: TranslationSettingsProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  function update<K extends keyof TranslationSettings>(key: K, value: TranslationSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="panel settings-panel">
      <h2>AI Settings</h2>
      <label>
        <span>Base URL</span>
        <input value={draft.baseUrl} onChange={(event) => update("baseUrl", event.target.value)} disabled={busy} />
      </label>
      <label>
        <span>API Key</span>
        <input
          type="password"
          value={draft.apiKey}
          onChange={(event) => update("apiKey", event.target.value)}
          disabled={busy}
          autoComplete="off"
        />
      </label>
      <label>
        <span>Model</span>
        <input value={draft.model} onChange={(event) => update("model", event.target.value)} disabled={busy} />
      </label>
      <label>
        <span>Style</span>
        <select value={draft.style ?? "faithful"} onChange={(event) => update("style", event.target.value as TranslationSettings["style"])} disabled={busy}>
          <option value="faithful">faithful - accurate</option>
          <option value="fluent">fluent - natural</option>
          <option value="academic">academic - formal</option>
          <option value="popular">popular - accessible</option>
        </select>
      </label>
      <label>
        <span>Glossary</span>
        <textarea
          value={draft.glossary ?? ""}
          onChange={(event) => update("glossary", event.target.value)}
          disabled={busy}
          rows={5}
          placeholder={"world model => 世界模型\nagent => 智能体"}
        />
      </label>
      <label>
        <span>EPUBCheck command path</span>
        <input
          value={draft.epubCheckCommand ?? ""}
          onChange={(event) => update("epubCheckCommand", event.target.value)}
          disabled={busy}
          placeholder="epubcheck or java -jar /path/to/epubcheck.jar"
        />
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={Boolean(draft.useMock)}
          onChange={(event) => update("useMock", event.target.checked)}
          disabled={busy}
        />
        <span>Use mock translator</span>
      </label>
      <button onClick={() => onSave(draft)} disabled={busy}>
        Save Settings
      </button>
    </section>
  );
}
