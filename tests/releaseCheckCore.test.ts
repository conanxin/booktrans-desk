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
    expect(check([...requiredDocs, "tests/fixtures/book.pdf"], {}).failures.some((failure: string) => failure.includes("*.pdf"))).toBe(true);
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

  it("fails when public alpha decision docs are missing", () => {
    const withoutReaderResults = requiredDocs.filter((file: string) => file !== "docs/releases/MANUAL_READER_VALIDATION_RESULTS.md");
    const withoutChecksums = requiredDocs.filter((file: string) => file !== "docs/releases/RELEASE_CHECKSUMS_v0.2.6-public-alpha-prep.md");
    const withoutFinalChecksums = requiredDocs.filter((file: string) => file !== "docs/releases/RELEASE_CHECKSUMS_v0.2.8-public-alpha.md");
    const withoutLaunchResults = requiredDocs.filter((file: string) => file !== "docs/releases/PACKED_APP_MANUAL_LAUNCH_RESULTS.md");
    const withoutPublicationRecord = requiredDocs.filter((file: string) => file !== "docs/releases/PUBLIC_ALPHA_PUBLICATION_RECORD.md");
    const withoutPhaseReport = requiredDocs.filter((file: string) => file !== "docs/PHASE_2_7_PUBLIC_ALPHA_DECISION_REPORT.md");
    const withoutFinalReport = requiredDocs.filter((file: string) => file !== "docs/PHASE_2_8_FINAL_ALPHA_RELEASE_REPORT.md");
    const withoutBurnDownReport = requiredDocs.filter((file: string) => file !== "docs/PHASE_2_9_FINAL_VALIDATION_BURNDOWN_REPORT.md");
    const withoutTroubleshooting = requiredDocs.filter((file: string) => file !== "docs/troubleshooting/WHITE_SCREEN.md");
    const withoutHotfixReport = requiredDocs.filter((file: string) => file !== "docs/PHASE_2_12_WHITE_SCREEN_HOTFIX_REPORT.md");
    const withoutChineseUiReport = requiredDocs.filter((file: string) => file !== "docs/PHASE_2_14_CHINESE_UI_REDESIGN_REPORT.md");
    const withoutPdfPipeline = requiredDocs.filter((file: string) => file !== "docs/PDF_TRANSLATION_PIPELINE.md");
    const withoutPdfLimitations = requiredDocs.filter((file: string) => file !== "docs/PDF_SUPPORT_LIMITATIONS.md");
    const withoutReleasePolicy = requiredDocs.filter((file: string) => file !== "docs/releases/RELEASE_DECISION_POLICY.md");
    const withoutPdfReport = requiredDocs.filter((file: string) => file !== "docs/PHASE_3A_PDF_TRANSLATION_MVP_REPORT.md");
    expect(check(withoutReaderResults, {}).failures.some((failure: string) => failure.includes("MANUAL_READER_VALIDATION_RESULTS.md"))).toBe(true);
    expect(check(withoutChecksums, {}).failures.some((failure: string) => failure.includes("RELEASE_CHECKSUMS_v0.2.6-public-alpha-prep.md"))).toBe(true);
    expect(check(withoutFinalChecksums, {}).failures.some((failure: string) => failure.includes("RELEASE_CHECKSUMS_v0.2.8-public-alpha.md"))).toBe(true);
    expect(check(withoutLaunchResults, {}).failures.some((failure: string) => failure.includes("PACKED_APP_MANUAL_LAUNCH_RESULTS.md"))).toBe(true);
    expect(check(withoutPublicationRecord, {}).failures.some((failure: string) => failure.includes("PUBLIC_ALPHA_PUBLICATION_RECORD.md"))).toBe(true);
    expect(check(withoutPhaseReport, {}).failures.some((failure: string) => failure.includes("PHASE_2_7_PUBLIC_ALPHA_DECISION_REPORT.md"))).toBe(true);
    expect(check(withoutFinalReport, {}).failures.some((failure: string) => failure.includes("PHASE_2_8_FINAL_ALPHA_RELEASE_REPORT.md"))).toBe(true);
    expect(check(withoutBurnDownReport, {}).failures.some((failure: string) => failure.includes("PHASE_2_9_FINAL_VALIDATION_BURNDOWN_REPORT.md"))).toBe(true);
    expect(check(withoutTroubleshooting, {}).failures.some((failure: string) => failure.includes("WHITE_SCREEN.md"))).toBe(true);
    expect(check(withoutHotfixReport, {}).failures.some((failure: string) => failure.includes("PHASE_2_12_WHITE_SCREEN_HOTFIX_REPORT.md"))).toBe(true);
    expect(check(withoutChineseUiReport, {}).failures.some((failure: string) => failure.includes("PHASE_2_14_CHINESE_UI_REDESIGN_REPORT.md"))).toBe(true);
    expect(check(withoutPdfPipeline, {}).failures.some((failure: string) => failure.includes("PDF_TRANSLATION_PIPELINE.md"))).toBe(true);
    expect(check(withoutPdfLimitations, {}).failures.some((failure: string) => failure.includes("PDF_SUPPORT_LIMITATIONS.md"))).toBe(true);
    expect(check(withoutReleasePolicy, {}).failures.some((failure: string) => failure.includes("RELEASE_DECISION_POLICY.md"))).toBe(true);
    expect(check(withoutPdfReport, {}).failures.some((failure: string) => failure.includes("PHASE_3A_PDF_TRANSLATION_MVP_REPORT.md"))).toBe(true);
  });


  it("fails when package version is not current", () => {
    const result = check([...requiredDocs], { "package.json": JSON.stringify({ version: "0.0.0" }) });
    expect(result.failures.some((failure: string) => failure.includes("package.json version must be"))).toBe(true);
  });

  it("fails when changelog, readme, or release notes omit current release", () => {
    expect(check([...requiredDocs], { "CHANGELOG.md": "# Changelog\n" }).failures.some((failure: string) => failure.includes("CHANGELOG.md"))).toBe(true);
    expect(check([...requiredDocs], { "README.md": "# Readme\n" }).failures.some((failure: string) => failure.includes("Alpha warning"))).toBe(true);
    expect(
      check([...requiredDocs], { "README.md": "# Readme\n\nAlpha warning\n\nv0.2.8-public-alpha\n" }).failures.some((failure: string) =>
        failure.includes("unsigned warning")
      )
    ).toBe(true);
  });

  it("fails when label JSON is invalid", () => {
    const result = check([...requiredDocs], { "scripts/github-labels.json": "[{\"name\":\"type: bug\",\"color\":\"red\"}]" });
    expect(result.failures.some((failure: string) => failure.includes("scripts/github-labels.json"))).toBe(true);
  });

  it("fails when compatibility matrix omits targeted fixtures", () => {
    const result = check([...requiredDocs], { "docs/EPUB_COMPATIBILITY_MATRIX.md": "minimal-epub3" });
    expect(result.failures.some((failure: string) => failure.includes("nested-sections"))).toBe(true);
    expect(result.failures.some((failure: string) => failure.includes("large-chapter-chunking"))).toBe(true);
  });

  it("fails when release draft omits public alpha safety sections", () => {
    const result = check([...requiredDocs], { "docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md": "# Draft\n" });
    expect(result.failures.some((failure: string) => failure.includes("privacy model"))).toBe(true);
    expect(result.failures.some((failure: string) => failure.includes("checksum placeholder"))).toBe(true);
    expect(result.failures.some((failure: string) => failure.includes("copyrighted EPUBs or API keys"))).toBe(true);
  });

  it("passes normal repository state", () => {
    const result = check([...requiredDocs, "src/index.ts"], { "src/index.ts": "console.log('ok');" });
    expect(result.ok).toBe(true);
  });
});

function check(files: string[], content: Record<string, string>) {
  return runReleaseFileChecks({
    files,
    readFile: (file: string) => content[file] ?? defaultContent(file)
  });
}

function defaultContent(file: string): string {
  if (file === "package.json") {
    return JSON.stringify({ version: "0.3.0-alpha.0" });
  }
  if (file === "package-lock.json") {
    return JSON.stringify({ version: "0.3.0-alpha.0", packages: { "": { version: "0.3.0-alpha.0" } } });
  }
  if (file === "README.md") {
    return "# Readme\n\nAlpha warning\n\nWindows unsigned warning\n\nv0.3.0-pdf-translation-mvp\n";
  }
  if (file === "CHANGELOG.md") {
    return "# v0.3.0-pdf-translation-mvp\n";
  }
  if (file === "docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md") {
    return "# v0.2.8-public-alpha\n\n## Final Decision\n\n## Windows Unsigned Warning\n\n## Privacy Model\n\nPrivacy warning\n\n## Checksums\nSHA256_PLACEHOLDER\n\nDo not upload copyrighted EPUBs or API keys.\n";
  }
  if (file === "docs/releases/RC_BURNDOWN.md") {
    return "# RC Burn-down\n\nFINAL_DECISION: CONDITIONAL_GO\n";
  }
  if (file === "docs/releases/PACKED_APP_MANUAL_LAUNCH_RESULTS.md") {
    return "MANUAL_LAUNCH_RESULT: BLOCKED_BY_ENVIRONMENT\n";
  }
  if (file === "docs/releases/MANUAL_READER_VALIDATION_RESULTS.md") {
    return "MANUAL_READER_VALIDATION_RESULT: PARTIAL\n";
  }
  if (file === "docs/releases/PUBLIC_ALPHA_PUBLICATION_RECORD.md") {
    return "Release decision: CONDITIONAL_GO\n\nPrerelease status: Must be marked prerelease\n";
  }
  if (file === "docs/EPUB_COMPATIBILITY_MATRIX.md") {
    return "nested-sections split-text-inline entities-special-chars nav-landmarks duplicate-hrefs large-chapter-chunking Text PDF scanned PDF";
  }
  if (file === "docs/releases/RELEASE_DECISION_POLICY.md") {
    return "packaged UI visible PASS\nPDF import minimal-text PASS\nPDF export PASS\nno P0/P1 blockers\n";
  }
  if (file === "scripts/github-labels.json") {
    return JSON.stringify([
      { name: "type: bug", color: "d73a4a", description: "Bug" },
      { name: "type: feature", color: "a2eeef", description: "Feature" },
      { name: "area: validation", color: "c5def5", description: "Validation" },
      { name: "priority: p0", color: "b60205", description: "Priority" },
      { name: "status: needs-repro", color: "fef2c0", description: "Needs reproduction" }
    ]);
  }
  return "";
}
