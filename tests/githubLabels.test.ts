import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface GitHubLabel {
  name: string;
  color: string;
  description: string;
}

const labelsPath = path.resolve("scripts/github-labels.json");
const requiredLabels = [
  "type: bug",
  "type: feature",
  "area: epub-import",
  "area: translation",
  "area: export",
  "area: validation",
  "area: job-manager",
  "area: packaging",
  "area: privacy",
  "compat: epub2",
  "compat: epub3",
  "priority: p0",
  "priority: p1",
  "status: needs-repro",
  "status: confirmed",
  "good first issue"
];

describe("github-labels", () => {
  it("contains valid unique label definitions", () => {
    const labels = JSON.parse(fs.readFileSync(labelsPath, "utf8")) as GitHubLabel[];
    const names = labels.map((label) => label.name);

    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);

    for (const label of labels) {
      expect(label.name.trim()).toBe(label.name);
      expect(label.name.length).toBeGreaterThan(0);
      expect(label.color).toMatch(/^[0-9a-fA-F]{6}$/);
      expect(label.description.length).toBeGreaterThan(0);
    }

    for (const required of requiredLabels) {
      expect(names).toContain(required);
    }
  });
});
