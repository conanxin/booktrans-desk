import type { ExternalEpubCheckReport, ValidationReport } from "./types.js";

export function validationReportToMarkdown(
  report: ValidationReport,
  external?: ExternalEpubCheckReport,
  title = "EPUB Validation Report"
): string {
  const lines = [
    `# ${title}`,
    "",
    `- Status: ${report.status.toUpperCase()}`,
    `- Summary: ${report.summary}`,
    `- OPF path: ${report.opfPath ?? "Unknown"}`,
    `- Manifest items: ${report.manifestItemCount ?? 0}`,
    `- Spine items: ${report.spineItemCount ?? 0}`,
    `- XHTML checked: ${report.xhtmlCheckedCount ?? 0}`,
    "",
    "## Errors",
    ...listOrNone(report.errors),
    "",
    "## Warnings",
    ...listOrNone(report.warnings),
    "",
    "## Checked Files",
    ...listOrNone(report.checkedFiles),
    ""
  ];

  if (external) {
    lines.push(
      "## External EPUBCheck",
      "",
      `- Status: ${external.status.toUpperCase()}`,
      `- Summary: ${external.summary}`,
      `- Exit code: ${external.exitCode ?? "N/A"}`,
      ""
    );
    if (external.stdout.trim()) {
      lines.push("### stdout", "", "```text", external.stdout.trim(), "```", "");
    }
    if (external.stderr.trim()) {
      lines.push("### stderr", "", "```text", external.stderr.trim(), "```", "");
    }
  }

  return `${lines.join("\n").trim()}\n`;
}

function listOrNone(items: string[]): string[] {
  return items.length ? items.map((item) => `- ${item}`) : ["- None"];
}
