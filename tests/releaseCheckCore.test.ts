import { describe, expect, it } from "vitest";

const { requiredDocs, runReleaseFileChecks } = await import("../scripts/lib/releaseCheckCore.mjs");

describe("releaseCheckCore", () => {
  it("does not fail on .env.example", () => {
    const result = check([...requiredDocs, ".env.example"], { ".env.example": "OPENAI_API_KEY=\n" });
    expect(result.ok).toBe(true);
  });

  it("fails on tracked .env", () => {
    const result = check([...requiredDocs, ".env"], { ".env": "" });
    expect(result.failures.some((failure: string) => failure.includes("Forbidden tracked path"))).toBe(true);
  });

  it("fails on API key patterns", () => {
    const key = `sk-${"a".repeat(24)}`;
    const result = check([...requiredDocs, "src/example.ts"], { "src/example.ts": `const key = "${key}";` });
    expect(result.failures.some((failure: string) => failure.includes("Potential secret"))).toBe(true);
  });

  it("fails on EPUB files", () => {
    const result = check([...requiredDocs, "tests/fixtures/book.epub"], {});
    expect(result.failures.some((failure: string) => failure.includes("*.epub"))).toBe(true);
  });

  it("fails on diagnostic zip and packed release files", () => {
    expect(check([...requiredDocs, "diagnostics.zip"], {}).failures.some((failure: string) => failure.includes("*.zip"))).toBe(true);
    expect(check([...requiredDocs, "BookTrans.exe"], {}).failures.some((failure: string) => failure.includes("*.exe"))).toBe(true);
    expect(check([...requiredDocs, "debug.log"], {}).failures.some((failure: string) => failure.includes("*.log"))).toBe(true);
  });

  it("fails when required docs are missing", () => {
    const result = check(["README.md"], {});
    expect(result.failures.some((failure: string) => failure.includes("docs/SECURITY.md"))).toBe(true);
  });

  it("fails when issue templates or triage docs are missing", () => {
    const withoutIssueTemplate = requiredDocs.filter((file: string) => file !== ".github/ISSUE_TEMPLATE/bug_report.yml");
    const withoutTriage = requiredDocs.filter((file: string) => file !== "docs/triage/TRIAGE_GUIDE.md");
    expect(check(withoutIssueTemplate, {}).failures.some((failure: string) => failure.includes("bug_report.yml"))).toBe(true);
    expect(check(withoutTriage, {}).failures.some((failure: string) => failure.includes("TRIAGE_GUIDE.md"))).toBe(true);
  });

  it("passes normal repository state", () => {
    const result = check([...requiredDocs, "src/index.ts"], { "src/index.ts": "console.log('ok');" });
    expect(result.ok).toBe(true);
  });
});

function check(files: string[], content: Record<string, string>) {
  return runReleaseFileChecks({
    files,
    readFile: (file: string) => content[file] ?? ""
  });
}
