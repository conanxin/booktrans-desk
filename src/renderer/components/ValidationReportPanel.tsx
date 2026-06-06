import type { ExternalEpubCheckReport, ValidationReport } from "../../shared/types.js";
import { groupEpubCheckIssues } from "../../shared/epubCheckIssues.js";
import { validationReportToMarkdown } from "../../shared/validationReport.js";
import { formatExternalValidationLabel, formatValidationLabel } from "../uiText.js";

interface ValidationReportPanelProps {
  report: ValidationReport | null;
  externalReport?: ExternalEpubCheckReport;
  title: string;
  onMessage: (message: string) => void;
}

const diagnosticBundleNotice =
  "诊断包会自动脱敏，不包含原始 EPUB、导出的 EPUB、API 密钥、Authorization Header 或完整书籍正文。";

export function ValidationReportPanel({ report, externalReport, title, onMessage }: ValidationReportPanelProps) {
  async function exportDiagnosticBundle() {
    const result = await window.bookTrans.createDiagnosticBundle(report, externalReport);
    onMessage(result.ok ? (result.data ? `已保存诊断包：${result.data}` : "已取消导出诊断包。") : result.error ?? "导出诊断包失败。");
  }

  if (!report) {
    return (
      <section className="panel validation-panel">
        <div className="panel-title-row">
          <h2>EPUB 验证报告</h2>
          <button onClick={exportDiagnosticBundle}>导出诊断包</button>
        </div>
        <DiagnosticBundleSummary />
        <p className="muted">导出 EPUB 后，这里会显示详细验证报告。</p>
      </section>
    );
  }
  const groupedExternal = externalReport?.issues?.length ? groupEpubCheckIssues(externalReport.issues) : null;

  async function copyMarkdown() {
    if (!report) {
      return;
    }
    await navigator.clipboard.writeText(validationReportToMarkdown(report, externalReport, `${title} Validation Report`));
    onMessage("验证报告已复制为 Markdown。");
  }

  async function saveMarkdown() {
    if (!report) {
      return;
    }
    const result = await window.bookTrans.saveValidationMarkdown(report, externalReport, title);
    onMessage(result.ok ? (result.data ? `已保存报告：${result.data}` : "已取消保存报告。") : result.error ?? "保存报告失败。");
  }

  return (
    <section className="panel validation-panel">
      <div className="panel-title-row">
        <h2>EPUB 验证报告</h2>
        <div className="inline-actions">
          <button onClick={copyMarkdown}>复制 Markdown 报告</button>
          <button onClick={saveMarkdown}>保存报告</button>
          <button onClick={exportDiagnosticBundle}>导出诊断包</button>
        </div>
      </div>
      <DiagnosticBundleSummary />
      <div className={`validation-result ${report.status}`}>
        <strong>{formatValidationLabel(report.status)}</strong>
        <span>{report.summary}</span>
      </div>
      <dl className="report-stats">
        <div>
          <dt>OPF 路径</dt>
          <dd>{report.opfPath ?? "未知"}</dd>
        </div>
        <div>
          <dt>Manifest 项</dt>
          <dd>{report.manifestItemCount ?? 0}</dd>
        </div>
        <div>
          <dt>Spine 项</dt>
          <dd>{report.spineItemCount ?? 0}</dd>
        </div>
        <div>
          <dt>XHTML 检查数</dt>
          <dd>{report.xhtmlCheckedCount ?? 0}</dd>
        </div>
      </dl>
      <ReportList title="错误" items={report.errors} tone="error" />
      <ReportList title="警告" items={report.warnings} tone="warning" />
      <ReportList title="已检查文件" items={report.checkedFiles} tone="neutral" />
      {externalReport ? (
        <div className={`external-report ${externalReport.status}`}>
          <h3>外部 EPUBCheck</h3>
          <p>{externalReport.summary}</p>
          <span>状态：{formatExternalValidationLabel(externalReport.status)}</span>
          <span>退出码：{externalReport.exitCode ?? "N/A"}</span>
          <span>
            问题：{countIssues(externalReport, "error")} 个错误，{countIssues(externalReport, "warning")} 个警告，{" "}
            {countIssues(externalReport, "info")} 条信息
          </span>
          {groupedExternal ? (
            <div className="external-grouped">
              <h4>问题分组</h4>
              <p>
                主要代码：{" "}
                {groupedExternal.summary.topCodes.length
                  ? groupedExternal.summary.topCodes.map((item) => `${item.code} (${item.count})`).join(", ")
                  : "无"}
              </p>
              <p>
                受影响文件：{" "}
                {groupedExternal.summary.affectedFiles.length ? groupedExternal.summary.affectedFiles.join(", ") : "无"}
              </p>
              <ul className="external-issues">
                {groupedExternal.groups.map((group) => (
                  <li className={group.severity} key={group.key}>
                    <strong>{group.severity.toUpperCase()}</strong>
                    {group.code ? `(${group.code}) ` : " "}
                    {group.file ? `${group.file}: ` : ""}
                    {group.count}x {group.messages[0]}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {externalReport.issues?.length ? (
            <ul className="external-issues">
              {externalReport.issues.map((issue, index) => (
                <li className={issue.severity} key={`${issue.severity}-${issue.code}-${index}`}>
                  <strong>{issue.severity.toUpperCase()}</strong>
                  {issue.code ? `(${issue.code}) ` : " "}
                  {issue.file ? `${issue.file}${issue.line ? `:${issue.line}:${issue.column ?? 0}` : ""}: ` : ""}
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          {externalReport.rawOutput ? (
            <details>
              <summary>原始输出</summary>
              <pre>{externalReport.rawOutput}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DiagnosticBundleSummary() {
  return (
    <div className="diagnostic-summary">
      <p>{diagnosticBundleNotice}</p>
      <dl>
        <div>
          <dt>包含</dt>
          <dd>验证报告、EPUBCheck 摘要、任务摘要、导出历史摘要、已脱敏应用日志。</dd>
        </div>
        <div>
          <dt>已脱敏</dt>
          <dd>本地路径、provider token、API key 形态、Authorization Header、provider 错误片段。</dd>
        </div>
        <div>
          <dt>不包含</dt>
          <dd>原始 EPUB、导出的 EPUB、API 密钥、Authorization Header、完整书籍正文。</dd>
        </div>
        <div>
          <dt>输出路径</dt>
          <dd>导出诊断包时由用户选择。</dd>
        </div>
      </dl>
    </div>
  );
}

function countIssues(report: ExternalEpubCheckReport, severity: "error" | "warning" | "info"): number {
  return report.issues?.filter((issue) => issue.severity === severity).length ?? 0;
}

function ReportList({ title, items, tone }: { title: string; items: string[]; tone: "error" | "warning" | "neutral" }) {
  return (
    <div className={`report-list ${tone}`}>
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">无</p>
      )}
    </div>
  );
}
