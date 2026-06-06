import { describe, expect, it } from "vitest";
import { validationReportToMarkdown } from "../src/shared/validationReport.js";
import type { ValidationReport } from "../src/shared/types.js";

describe("validationReportToMarkdown", () => {
  it("renders status, errors, warnings, and checked file counts", () => {
    const report: ValidationReport = {
      status: "warning",
      summary: "WARNING: 3 files checked, 1 errors, 1 warnings.",
      errors: ["Missing item"],
      warnings: ["Optional nav missing"],
      checkedFiles: ["mimetype", "META-INF/container.xml", "OPS/content.opf"],
      opfPath: "OPS/content.opf",
      manifestItemCount: 2,
      spineItemCount: 1,
      xhtmlCheckedCount: 1
    };
    const markdown = validationReportToMarkdown(report);
    expect(markdown).toContain("- Status: WARNING");
    expect(markdown).toContain("- Missing item");
    expect(markdown).toContain("- Optional nav missing");
    expect(markdown).toContain("- OPS/content.opf");
    expect(markdown).toContain("- Manifest items: 2");
    expect(markdown).toContain("- XHTML checked: 1");
  });
});
