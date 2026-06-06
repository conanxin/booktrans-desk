import { useEffect, useState } from "react";
import type { TranslationSettings } from "../../shared/types.js";
import { styleLabels } from "../uiText.js";

interface TranslationSettingsProps {
  settings: TranslationSettings;
  busy: boolean;
  onSave: (settings: TranslationSettings) => void;
  glossaryCount?: number;
  defaultOpen?: boolean;
}

export function TranslationSettingsPanel({ settings, busy, onSave, glossaryCount = 0, defaultOpen = false }: TranslationSettingsProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  function update<K extends keyof TranslationSettings>(key: K, value: TranslationSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <details className="panel settings-panel" open={defaultOpen}>
      <summary>
        <div>
          <p className="section-kicker">第二步</p>
          <h2>翻译设置</h2>
          <p>
            模型：{draft.model || "未设置"} · 风格：{styleLabels[draft.style ?? "faithful"]} · 术语表：{glossaryCount} 条
          </p>
        </div>
      </summary>

      <div className="settings-fields">
        <label>
          <span>API 地址</span>
          <input value={draft.baseUrl} onChange={(event) => update("baseUrl", event.target.value)} disabled={busy} />
        </label>
        <label>
          <span>API 密钥</span>
          <input
            type="password"
            value={draft.apiKey}
            onChange={(event) => update("apiKey", event.target.value)}
            disabled={busy}
            autoComplete="off"
          />
          <small>API 密钥仅保存在本机，不会写入任务缓存或诊断包。</small>
        </label>
        <label>
          <span>模型</span>
          <input value={draft.model} onChange={(event) => update("model", event.target.value)} disabled={busy} />
        </label>
        <label>
          <span>翻译风格</span>
          <select value={draft.style ?? "faithful"} onChange={(event) => update("style", event.target.value as TranslationSettings["style"])} disabled={busy}>
            <option value="faithful">忠实准确</option>
            <option value="fluent">自然流畅</option>
            <option value="academic">学术书面</option>
            <option value="popular">通俗易懂</option>
          </select>
        </label>
        <label>
          <span>术语表</span>
          <textarea
            value={draft.glossary ?? ""}
            onChange={(event) => update("glossary", event.target.value)}
            disabled={busy}
            rows={5}
            placeholder={"world model => 世界模型\nagent => 智能体"}
          />
        </label>
        <label>
          <span>EPUBCheck 命令</span>
          <input
            value={draft.epubCheckCommand ?? ""}
            onChange={(event) => update("epubCheckCommand", event.target.value)}
            disabled={busy}
            placeholder="epubcheck 或 java -jar /path/to/epubcheck.jar"
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={Boolean(draft.useMock)}
            onChange={(event) => update("useMock", event.target.checked)}
            disabled={busy}
          />
          <span>使用模拟翻译器</span>
        </label>
        <button onClick={() => onSave(draft)} disabled={busy}>
          保存设置
        </button>
      </div>
    </details>
  );
}
