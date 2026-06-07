import { useEffect, useState } from "react";
import type { TranslationSettings } from "../../shared/types.js";
import { styleLabels } from "../uiText.js";

interface TranslationSettingsProps {
  settings: TranslationSettings;
  busy: boolean;
  onSave: (settings: TranslationSettings) => void;
  onTestConnection?: (settings: TranslationSettings) => void;
  glossaryCount?: number;
  defaultOpen?: boolean;
}

export function TranslationSettingsPanel({ settings, busy, onSave, onTestConnection, glossaryCount = 0, defaultOpen = false }: TranslationSettingsProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  function update<K extends keyof TranslationSettings>(key: K, value: TranslationSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyMinimaxDefaults() {
    setDraft((current) => ({
      ...current,
      providerPreset: "minimax",
      baseUrl: "https://api.minimaxi.com/v1",
      model: "MiniMax-M3"
    }));
  }

  return (
    <details className="panel settings-panel" open={defaultOpen}>
      <summary>
        <div>
          <p className="section-kicker">模型设置</p>
          <h2>翻译 / AI Provider</h2>
          <p>
            模型：{draft.model || "未设置"} · 风格：{styleLabels[draft.style ?? "faithful"]} · 术语表：{glossaryCount} 条
          </p>
        </div>
      </summary>

      <div className="settings-fields">
        <label>
          <span>服务商预设</span>
          <select value={draft.providerPreset ?? "openai-compatible"} onChange={(event) => update("providerPreset", event.target.value as TranslationSettings["providerPreset"])} disabled={busy}>
            <option value="openai-compatible">OpenAI-compatible</option>
            <option value="minimax">MiniMax Token Plan</option>
          </select>
        </label>

        {draft.providerPreset === "minimax" ? (
          <div className="settings-hint">
            <strong>MiniMax Token Plan 推荐配置</strong>
            <span>API 地址：https://api.minimaxi.com/v1</span>
            <span>模型：MiniMax-M3</span>
            <span>已在后端关闭 thinking 输出，避免思考过程进入译文。</span>
            <button type="button" onClick={applyMinimaxDefaults} disabled={busy}>
              应用 MiniMax 默认配置
            </button>
          </div>
        ) : null}

        <label>
          <span>API 地址</span>
          <input value={draft.baseUrl} onChange={(event) => update("baseUrl", event.target.value)} disabled={busy} />
        </label>
        <label>
          <span>API 密钥</span>
          <input type="password" value={draft.apiKey} onChange={(event) => update("apiKey", event.target.value)} disabled={busy} autoComplete="off" />
          <small>API 密钥只保存在本机设置中，不写入文档快照、任务缓存或导出历史。</small>
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
          <input value={draft.epubCheckCommand ?? ""} onChange={(event) => update("epubCheckCommand", event.target.value)} disabled={busy} placeholder="epubcheck 或 java -jar /path/to/epubcheck.jar" />
        </label>
        <label className="check-row">
          <input type="checkbox" checked={Boolean(draft.useMock)} onChange={(event) => update("useMock", event.target.checked)} disabled={busy} />
          <span>使用模拟翻译器</span>
        </label>
        <button onClick={() => onSave(draft)} disabled={busy}>
          保存设置
        </button>
        {onTestConnection ? (
          <button type="button" onClick={() => onTestConnection(draft)} disabled={busy}>
            测试模型连接
          </button>
        ) : null}
      </div>
    </details>
  );
}
