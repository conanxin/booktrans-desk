import type { ExternalEpubCheckReport, ValidationReport } from "../../shared/types.js";
import { groupEpubCheckIssues } from "../../shared/epubCheckIssues.js";
import { validationReportToMarkdown } from "../../shared/validationReport.js";

interface ValidationReportPanelProps {
  report: ValidationReport | null;
  externalReport?: ExternalEpubCheckReport;
  title: string;
  onMessage: (message: string) => void;
}

const diagnosticBundleNotice =
  "Diagnostic bundles are redacted and do not include original EPUB files, exported EPUB files, API keys, Authorization headers, or full book text.";

export function ValidationReportPanel({ report, externalReport, title, onMessage }: ValidationReportPanelProps) {
  async function exportDiagnosticBundle() {
    const result = await window.bookTrans.createDiagnosticBundle(report, externalReport);
    onMessage(result.ok ? (result.data ? `Saved diagnostic bundle: ${result.data}` : "Diagnostic export cancelled.") : result.error ?? "Diagnostic export failed.");
  }

  if (!report) {
    return (
      <section className="panel validation-panel">
        <div className="panel-title-row">
          <h2>Validation Report</h2>
          <button onClick={exportDiagnosticBundle}>Export Diagnostic Bundle</button>
        </div>
        <DiagnosticBundleSummary />
        <p className="muted">Export an EPUB to see the detailed validation report.</p>
      </section>
    );
  }
  const groupedExternal = externalReport?.issues?.length ? groupEpubCheckIssues(externalReport.issues) : null;

  async function copyMarkdown() {
    if (!report) {
      return;
    }
    await navigator.clipboard.writeText(validationReportToMarkdown(report, externalReport, `${title} Validation Report`));
    onMessage("Validation report copied as Markdown.");
  }

  async function saveMarkdown() {
    if (!report) {
      return;
    }
    const result = await window.bookTrans.saveValidationMarkdown(report, externalReport, title);
    onMessage(result.ok ? (result.data ? `Saved report: ${result.data}` : "Save report cancelled.") : result.error ?? "Save report failed.");
  }

  return (
    <section className="panel validation-panel">
      <div className="panel-title-row">
        <h2>Validation Report</h2>
        <div className="inline-actions">
          <button onClick={copyMarkdown}>Copy Markdown</button>
          <button onClick={saveMarkdown}>Save .md</button>
          <button onClick={exportDiagnosticBundle}>Export Diagnostic Bundle</button>
        </div>
      </div>
      <DiagnosticBundleSummary />
      <div className={`validation-result ${report.status}`}>
        <strong>{report.status.toUpperCase()}</strong>
        <span>{report.summary}</span>
      </div>
      <dl className="report-stats">
        <div>
          <dt>OPF path</dt>
          <dd>{report.opfPath ?? "Unknown"}</dd>
        </div>
        <div>
          <dt>Manifest items</dt>
          <dd>{report.manifestItemCount ?? 0}</dd>
        </div>
        <div>
          <dt>Spine items</dt>
          <dd>{report.spineItemCount ?? 0}</dd>
        </div>
        <div>
          <dt>XHTML checked</dt>
          <dd>{report.xhtmlCheckedCount ?? 0}</dd>
        </div>
      </dl>
      <ReportList title="Errors" items={report.errors} tone="error" />
      <ReportList title="Warnings" items={report.warnings} tone="warning" />
      <ReportList title="Checked Files" items={report.checkedFiles} tone="neutral" />
      {externalReport ? (
        <div className={`external-report ${externalReport.status}`}>
          <h3>External EPUBCheck</h3>
          <p>{externalReport.summary}</p>
          <span>Exit code: {externalReport.exitCode ?? "N/A"}</span>
          <span>
            Issues: {countIssues(externalReport, "error")} errors, {countIssues(externalReport, "warning")} warnings,{" "}
            {countIssues(externalReport, "info")} info
          </span>
          {groupedExternal ? (
            <div className="external-grouped">
              <h4>Grouped issues</h4>
              <p>
                Top codes:{" "}
                {groupedExternal.summary.topCodes.length
                  ? groupedExternal.summary.topCodes.map((item) => `${item.code} (${item.count})`).join(", ")
                  : "None"}
              </p>
              <p>
                Affected files:{" "}
                {groupedExternal.summary.affectedFiles.length ? groupedExternal.summary.affectedFiles.join(", ") : "None"}
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
              <summary>Raw output</summary>
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
          <dt>Included</dt>
          <dd>Validation report, EPUBCheck summary, job summary, export history summary, redacted app log.</dd>
        </div>
        <div>
          <dt>Redacted</dt>
          <dd>Paths, provider tokens, API key patterns, Authorization headers, provider error snippets.</dd>
        </div>
        <div>
          <dt>Excluded</dt>
          <dd>Original EPUB files, exported EPUB files, API keys, Authorization headers, full book text.</dd>
        </div>
        <div>
          <dt>Output path</dt>
          <dd>Selected when the diagnostic bundle is exported.</dd>
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
        <p className="muted">None</p>
      )}
    </div>
  );
}
