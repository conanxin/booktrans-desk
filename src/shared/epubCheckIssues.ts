import type { ExternalEpubCheckIssue } from "./types.js";

export interface EpubCheckIssueGroup {
  key: string;
  severity: "error" | "warning" | "info";
  code?: string;
  file?: string;
  count: number;
  messages: string[];
  firstLine?: number;
  firstColumn?: number;
}

export interface EpubCheckIssueSummary {
  errorCount: number;
  warningCount: number;
  infoCount: number;
  topCodes: Array<{ code: string; count: number }>;
  affectedFiles: string[];
}

export interface GroupedEpubCheckIssues {
  groups: EpubCheckIssueGroup[];
  summary: EpubCheckIssueSummary;
}

export function groupEpubCheckIssues(issues: ExternalEpubCheckIssue[]): GroupedEpubCheckIssues {
  const map = new Map<string, EpubCheckIssueGroup>();
  const codeCounts = new Map<string, number>();
  const affectedFiles = new Set<string>();
  const summary: EpubCheckIssueSummary = { errorCount: 0, warningCount: 0, infoCount: 0, topCodes: [], affectedFiles: [] };

  for (const issue of issues) {
    if (issue.severity === "error") summary.errorCount += 1;
    if (issue.severity === "warning") summary.warningCount += 1;
    if (issue.severity === "info") summary.infoCount += 1;
    if (issue.code) codeCounts.set(issue.code, (codeCounts.get(issue.code) ?? 0) + 1);
    if (issue.file) affectedFiles.add(issue.file);

    const key = issue.code
      ? `${issue.severity}|${issue.code}|${issue.file ?? ""}`
      : `${issue.severity}|${normalizeMessage(issue.message)}|${issue.file ?? ""}`;
    const current =
      map.get(key) ??
      ({
        key,
        severity: issue.severity,
        code: issue.code,
        file: issue.file,
        count: 0,
        messages: [],
        firstLine: issue.line,
        firstColumn: issue.column
      } satisfies EpubCheckIssueGroup);
    current.count += 1;
    if (!current.messages.includes(issue.message) && current.messages.length < 5) {
      current.messages.push(issue.message);
    }
    current.firstLine = minDefined(current.firstLine, issue.line);
    current.firstColumn = current.firstLine === issue.line ? minDefined(current.firstColumn, issue.column) : current.firstColumn;
    map.set(key, current);
  }

  summary.topCodes = [...codeCounts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
    .slice(0, 5);
  summary.affectedFiles = [...affectedFiles].sort();

  return {
    groups: [...map.values()].sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.count - a.count),
    summary
  };
}

function normalizeMessage(message: string): string {
  return message.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
}

function minDefined(current?: number, next?: number): number | undefined {
  if (current === undefined) return next;
  if (next === undefined) return current;
  return Math.min(current, next);
}

function severityRank(severity: "error" | "warning" | "info"): number {
  return severity === "error" ? 0 : severity === "warning" ? 1 : 2;
}
