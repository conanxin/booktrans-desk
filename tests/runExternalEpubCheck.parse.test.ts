import { describe, expect, it } from "vitest";
import { parseExternalEpubCheckIssues } from "../src/main/epub/runExternalEpubCheck.js";

describe("parseExternalEpubCheckIssues", () => {
  it("parses common EPUBCheck error and warning lines", () => {
    const issues = parseExternalEpubCheckIssues(`ERROR(RSC-005) at book/chapter1.xhtml(12,34): Error while parsing file
WARNING(OPF-003) at content.opf: Item missing
INFO at nav.xhtml(2,1): Informational note`);
    expect(issues).toEqual([
      {
        severity: "error",
        code: "RSC-005",
        file: "book/chapter1.xhtml",
        line: 12,
        column: 34,
        message: "Error while parsing file"
      },
      {
        severity: "warning",
        code: "OPF-003",
        file: "content.opf",
        line: undefined,
        column: undefined,
        message: "Item missing"
      },
      {
        severity: "info",
        code: undefined,
        file: "nav.xhtml",
        line: 2,
        column: 1,
        message: "Informational note"
      }
    ]);
  });

  it("redacts sensitive issue messages", () => {
    const issues = parseExternalEpubCheckIssues("ERROR(SEC-001) at file.xhtml: Bearer secret-token");
    expect(issues[0].message).toBe("Bearer [redacted]");
  });
});
