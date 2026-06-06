import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { createDiagnosticBundle } from "../src/main/diagnostics/createDiagnosticBundle.js";

describe("createDiagnosticBundle", () => {
  it("creates a redacted diagnostic zip with expected files", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-diagnostic-"));
    const outputPath = path.join(dir, "bundle.zip");
    await createDiagnosticBundle({
      outputPath,
      appVersion: "test",
      validationReport: {
        status: "fail",
        summary: "FAIL",
        errors: ["bad"],
        warnings: [],
        checkedFiles: ["OPS/chapter.xhtml"]
      },
      externalReport: {
        status: "fail",
        summary: "External failed",
        stdout: `${"Bearer"} token-secret-value`,
        stderr: "",
        exitCode: 1,
        issues: [{ severity: "error", code: "RSC-005", file: "chapter.xhtml", message: "Parse failed" }],
        rawOutput: `${"apiKey"}=secret-value`,
        durationMs: 10
      },
      jobSummary: {
        jobId: "job",
        bookTitle: "Book",
        sourceEpubPath: "/private/book.epub",
        targetLanguage: "zh-CN",
        createdAt: "now",
        updatedAt: "now",
        totalChapters: 1,
        completedChapters: 0,
        failedChapters: 1,
        pendingChapters: 0,
        status: "failed",
        chapters: [
          {
            chapterId: "c1",
            index: 1,
            title: "Chapter",
            status: "failed",
            completedChunks: 0,
            totalChunks: 1,
            failedReason: "provider failed"
          }
        ]
      },
      exportHistory: [
        {
          id: "e1",
          outputEpubPath: "/private/exported.epub",
          createdAt: "now",
          validationStatus: "fail",
          targetLanguage: "zh-CN"
        }
      ],
      appLog: `full body text should not appear\n${"Bearer"} token-secret-value`,
      redactPaths: true
    });

    const zip = new AdmZip(outputPath);
    const names = zip.getEntries().map((entry) => entry.entryName);
    expect(names).toEqual(
      expect.arrayContaining([
        "diagnostics.json",
        "validation-report.md",
        "external-epubcheck-summary.md",
        "job-summary.json",
        "export-history-summary.json",
        "app-log-redacted.txt"
      ])
    );
    const combined = zip.getEntries().map((entry) => entry.getData().toString("utf8")).join("\n");
    expect(combined).not.toContain("token-secret-value");
    expect(combined).not.toContain(`${"apiKey"}=secret-value`);
    expect(combined).not.toContain("full body text should not appear");
    expect(combined).not.toContain("/private/exported.epub");
    expect(names.some((name) => name.endsWith(".epub"))).toBe(false);
  });
});
