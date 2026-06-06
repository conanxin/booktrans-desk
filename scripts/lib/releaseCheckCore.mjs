import fs from "node:fs";
import path from "node:path";

export const requiredDocs = [
  "README.md",
  "LICENSE",
  "docs/SECURITY.md",
  "docs/ROADMAP.md",
  "docs/EPUB_COMPATIBILITY_MATRIX.md",
  "docs/TEST_FIXTURES.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/epub_compatibility.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  "docs/alpha/ALPHA_TESTER_GUIDE.md",
  "docs/alpha/TEST_PLAN.md",
  "docs/alpha/BUG_REPORT_TEMPLATE.md",
  "docs/alpha/PRIVACY_NOTICE.md",
  "docs/triage/LABELS.md",
  "docs/triage/TRIAGE_GUIDE.md",
  "docs/triage/ALPHA_FEEDBACK_WORKFLOW.md"
];

const forbiddenPathRules = [
  { label: ".env", test: (file) => file === ".env" || (/^\.env\./.test(file) && file !== ".env.example") },
  { label: "*.epub", test: (file) => file.toLowerCase().endsWith(".epub") },
  { label: "*.zip", test: (file) => file.toLowerCase().endsWith(".zip") },
  { label: "*.exe", test: (file) => file.toLowerCase().endsWith(".exe") },
  { label: "*.dmg", test: (file) => file.toLowerCase().endsWith(".dmg") },
  { label: "*.AppImage", test: (file) => file.endsWith(".AppImage") },
  { label: "*.log", test: (file) => file.toLowerCase().endsWith(".log") },
  { label: "release/", test: (file) => file === "release" || file.startsWith("release/") },
  { label: "dist/", test: (file) => file === "dist" || file.startsWith("dist/") },
  { label: "node_modules/", test: (file) => file === "node_modules" || file.startsWith("node_modules/") }
];

const secretRules = [
  { label: "Bearer token", pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{12,}/ },
  { label: "OpenAI API key", pattern: /sk-[A-Za-z0-9_-]{20,}/ },
  { label: "generic api key assignment", pattern: /\b(api[_-]?key|OPENAI_API_KEY)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{16,}/i }
];

export function runReleaseFileChecks({ files, readFile, required = requiredDocs }) {
  const failures = [];
  const normalized = files.map(normalizePath);
  const fileSet = new Set(normalized);

  for (const doc of required) {
    if (!fileSet.has(doc)) {
      failures.push(`Missing required document: ${doc}`);
    }
  }

  for (const file of normalized) {
    for (const rule of forbiddenPathRules) {
      if (rule.test(file)) {
        failures.push(`Forbidden tracked path (${rule.label}): ${file}`);
      }
    }
  }

  for (const file of normalized) {
    if (shouldSkipContentScan(file)) {
      continue;
    }
    const content = readFile(file);
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const cleanLine = stripAllowedExamples(line);
      for (const rule of secretRules) {
        if (rule.pattern.test(cleanLine)) {
          failures.push(`Potential secret (${rule.label}) in ${file}:${index + 1}`);
        }
      }
    });
  }

  return {
    ok: failures.length === 0,
    failures
  };
}

export function getTrackedFiles(repoRoot, execFileSync) {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: repoRoot, encoding: "utf8" })
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

export function readTrackedFile(repoRoot, file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

function normalizePath(file) {
  return file.replace(/\\/g, "/").replace(/^\.\//, "");
}

function shouldSkipContentScan(file) {
  return file === ".env.example" || file.startsWith(".git/") || file.startsWith("node_modules/");
}

function stripAllowedExamples(line) {
  return line.replace(/Bearer\s+\[redacted]/gi, "Bearer [redacted]").replace(/apiKey\s*[:=]\s*["']?\[redacted]/gi, "apiKey=[redacted]");
}
