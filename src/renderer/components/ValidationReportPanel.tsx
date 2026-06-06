import type { ExternalEpubCheckReport, ValidationReport } from "../../shared/types.js";
import { validationReportToMarkdown } from "../../shared/validationReport.js";

interface ValidationReportPanelProps {
  report: ValidationReport | null;
  externalReport?: ExternalEpubCheckReport;
  title: string;
  onMessage: (message: string) => void;
}

export function ValidationReportPanel({ report, externalReport, title, onMessage }: ValidationReportPanelProps) {
  if (!report) {
    return (
      <section className="panel validation-panel">
        <h2>Validation Report</h2>
        <p className="muted">Export an EPUB to see the detailed validation report.</p>
      </section>
    );
  }

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
        </div>
      </div>
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
        </div>
      ) : null}
    </section>
  );
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
