import { describe, expect, it } from "vitest";
import { groupEpubCheckIssues } from "../src/main/epub/groupEpubCheckIssues.js";
import type { ExternalEpubCheckIssue } from "../src/shared/types.js";

describe("groupEpubCheckIssues", () => {
  it("groups issues by severity, code, and file", () => {
    const result = groupEpubCheckIssues([
      issue("error", "RSC-005", "a.xhtml", "Parse failed", 10),
      issue("error", "RSC-005", "a.xhtml", "Parse failed again", 20)
    ]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].count).toBe(2);
    expect(result.groups[0].messages).toEqual(["Parse failed", "Parse failed again"]);
  });

  it("does not merge different files", () => {
    const result = groupEpubCheckIssues([issue("error", "RSC-005", "a.xhtml", "Parse failed"), issue("error", "RSC-005", "b.xhtml", "Parse failed")]);
    expect(result.groups).toHaveLength(2);
  });

  it("groups no-code issues by normalized message", () => {
    const result = groupEpubCheckIssues([
      { severity: "warning", file: "a.xhtml", message: "Line 12 is odd" },
      { severity: "warning", file: "a.xhtml", message: "Line 99 is odd" }
    ]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].count).toBe(2);
  });

  it("summarizes top codes and affected files", () => {
    const result = groupEpubCheckIssues([
      issue("error", "A", "b.xhtml", "A"),
      issue("error", "A", "a.xhtml", "A"),
      issue("warning", "B", "a.xhtml", "B")
    ]);
    expect(result.summary.errorCount).toBe(2);
    expect(result.summary.warningCount).toBe(1);
    expect(result.summary.topCodes[0]).toEqual({ code: "A", count: 2 });
    expect(result.summary.affectedFiles).toEqual(["a.xhtml", "b.xhtml"]);
  });
});

function issue(
  severity: ExternalEpubCheckIssue["severity"],
  code: string,
  file: string,
  message: string,
  line?: number
): ExternalEpubCheckIssue {
  return { severity, code, file, message, line };
}
