import fs from "node:fs";
import path from "node:path";

export const requiredDocs = [
  "package.json",
  "package-lock.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "docs/SECURITY.md",
  "docs/ROADMAP.md",
  "docs/EPUB_COMPATIBILITY_MATRIX.md",
  "docs/PDF_TRANSLATION_PIPELINE.md",
  "docs/PDF_SUPPORT_LIMITATIONS.md",
  "docs/READER_COMPATIBILITY_NOTES.md",
  "docs/troubleshooting/WHITE_SCREEN.md",
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
  "docs/triage/ALPHA_FEEDBACK_WORKFLOW.md",
  "docs/releases/ALPHA_RELEASE_CHECKLIST.md",
  "docs/releases/RELEASE_DECISION_POLICY.md",
  "docs/releases/v0.2.5-alpha-rc.md",
  "docs/releases/MANUAL_READER_VALIDATION_CHECKLIST.md",
  "docs/releases/MANUAL_READER_VALIDATION_RESULTS.md",
  "docs/releases/RC_BURNDOWN.md",
  "docs/releases/GITHUB_RELEASE_DRAFT_v0.2.6-public-alpha-prep.md",
  "docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md",
  "docs/releases/INSTALLER_CHECKSUMS.md",
  "docs/releases/RELEASE_CHECKSUMS_v0.2.6-public-alpha-prep.md",
  "docs/releases/RELEASE_CHECKSUMS_v0.2.8-public-alpha.md",
  "docs/releases/PACKED_APP_MANUAL_LAUNCH_RESULTS.md",
  "docs/releases/PUBLIC_ALPHA_PUBLICATION_RECORD.md",
  "docs/releases/WINDOWS_UNSIGNED_WARNING.md",
  "docs/PHASE_2_7_PUBLIC_ALPHA_DECISION_REPORT.md",
  "docs/PHASE_2_8_FINAL_ALPHA_RELEASE_REPORT.md",
  "docs/PHASE_2_9_FINAL_VALIDATION_BURNDOWN_REPORT.md",
  "docs/PHASE_2_12_WHITE_SCREEN_HOTFIX_REPORT.md",
  "docs/PHASE_2_14_CHINESE_UI_REDESIGN_REPORT.md",
  "docs/PHASE_3A_PDF_TRANSLATION_MVP_REPORT.md",
  "docs/PHASE_3A_MANUAL_PDF_VALIDATION_REPORT.md",
  "docs/PHASE_3B_TRANSLATION_OUTPUT_QUALITY_FIX_REPORT.md",
  "docs/PHASE_3C_PDF_TRANSLATION_FAILURE_DIAGNOSTICS_REPORT.md",
  "scripts/github-labels.json"
];

export const currentPackageVersion = "0.3.2-alpha.0";
export const currentReleaseVersion = "v0.3.2-pdf-diagnostics-fix";

const requiredCompatibilityFixtures = [
  "nested-sections",
  "split-text-inline",
  "entities-special-chars",
  "nav-landmarks",
  "duplicate-hrefs",
  "large-chapter-chunking"
];

const forbiddenPathRules = [
  { label: ".env", test: (file) => file === ".env" || (/^\.env\./.test(file) && file !== ".env.example") },
  { label: "*.epub", test: (file) => file.toLowerCase().endsWith(".epub") },
  { label: "*.pdf", test: (file) => file.toLowerCase().endsWith(".pdf") },
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

  runVersionAndReleaseChecks({ fileSet, readFile, failures });

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
    const content = safeRead(readFile, file);
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

function runVersionAndReleaseChecks({ fileSet, readFile, failures }) {
  if (fileSet.has("package.json")) {
    const packageJson = parseJson(safeRead(readFile, "package.json"), "package.json", failures);
    if (!packageJson?.version) {
      failures.push("package.json is missing version");
    } else if (packageJson.version !== currentPackageVersion) {
      failures.push(`package.json version must be ${currentPackageVersion}, found ${packageJson.version}`);
    }
  }

  if (fileSet.has("package-lock.json")) {
    const lockJson = parseJson(safeRead(readFile, "package-lock.json"), "package-lock.json", failures);
    const lockVersion = lockJson?.packages?.[""]?.version ?? lockJson?.version;
    if (lockVersion && lockVersion !== currentPackageVersion) {
      failures.push(`package-lock.json root version must be ${currentPackageVersion}, found ${lockVersion}`);
    }
  }

  if (fileSet.has("CHANGELOG.md") && !safeRead(readFile, "CHANGELOG.md").includes(currentReleaseVersion)) {
    failures.push(`CHANGELOG.md must mention ${currentReleaseVersion}`);
  }

  if (fileSet.has("README.md")) {
    const readme = safeRead(readFile, "README.md");
    if (!readme.includes("Alpha warning")) {
      failures.push("README.md must contain Alpha warning");
    }
    if (!/unsigned warning/i.test(readme)) {
      failures.push("README.md must contain unsigned warning");
    }
    if (!readme.includes(currentReleaseVersion)) {
      failures.push(`README.md must mention ${currentReleaseVersion}`);
    }
  }

  const releaseNotesPath = `docs/releases/${currentReleaseVersion}.md`;
  if (fileSet.has(releaseNotesPath) && !safeRead(readFile, releaseNotesPath).includes(currentReleaseVersion)) {
    failures.push(`${releaseNotesPath} must mention ${currentReleaseVersion}`);
  }

  if (fileSet.has("scripts/github-labels.json")) {
    validateLabelsJson(safeRead(readFile, "scripts/github-labels.json"), failures);
  }

  if (fileSet.has("docs/EPUB_COMPATIBILITY_MATRIX.md")) {
    const matrix = safeRead(readFile, "docs/EPUB_COMPATIBILITY_MATRIX.md");
    for (const fixture of requiredCompatibilityFixtures) {
      if (!matrix.includes(fixture)) {
        failures.push(`docs/EPUB_COMPATIBILITY_MATRIX.md must mention ${fixture}`);
      }
    }
    if (!matrix.includes("Text PDF") || !matrix.includes("scanned PDF")) {
      failures.push("docs/EPUB_COMPATIBILITY_MATRIX.md must mention PDF support scope");
    }
  }

  if (fileSet.has("docs/releases/RELEASE_DECISION_POLICY.md")) {
    const policy = safeRead(readFile, "docs/releases/RELEASE_DECISION_POLICY.md");
    for (const required of ["packaged UI visible PASS", "PDF import minimal-text PASS", "PDF export PASS", "no P0/P1 blockers"]) {
      if (!policy.includes(required)) {
        failures.push(`RELEASE_DECISION_POLICY.md must mention ${required}`);
      }
    }
  }

  const releaseDraftPath = "docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md";
  if (fileSet.has(releaseDraftPath)) {
    validateReleaseDraft(safeRead(readFile, releaseDraftPath), failures);
  }

  if (fileSet.has("docs/releases/RC_BURNDOWN.md")) {
    const burnDown = safeRead(readFile, "docs/releases/RC_BURNDOWN.md");
    if (!burnDown.includes("FINAL_DECISION")) {
      failures.push("RC_BURNDOWN.md must contain FINAL_DECISION");
    }
  }

  const launchResultsPath = "docs/releases/PACKED_APP_MANUAL_LAUNCH_RESULTS.md";
  if (fileSet.has(launchResultsPath) && !safeRead(readFile, launchResultsPath).includes("MANUAL_LAUNCH_RESULT")) {
    failures.push(`${launchResultsPath} must contain MANUAL_LAUNCH_RESULT`);
  }

  const readerResultsPath = "docs/releases/MANUAL_READER_VALIDATION_RESULTS.md";
  if (fileSet.has(readerResultsPath) && !safeRead(readFile, readerResultsPath).includes("MANUAL_READER_VALIDATION_RESULT")) {
    failures.push(`${readerResultsPath} must contain MANUAL_READER_VALIDATION_RESULT`);
  }

  const publicationRecordPath = "docs/releases/PUBLIC_ALPHA_PUBLICATION_RECORD.md";
  if (fileSet.has(publicationRecordPath)) {
    validatePublicationRecord(safeRead(readFile, publicationRecordPath), failures);
  }
}

function validatePublicationRecord(content, failures) {
  if (!content.includes("CONDITIONAL_GO")) {
    failures.push("PUBLIC_ALPHA_PUBLICATION_RECORD.md must contain CONDITIONAL_GO");
  }
  if (!/prerelease/i.test(content)) {
    failures.push("PUBLIC_ALPHA_PUBLICATION_RECORD.md must contain prerelease status");
  }
}

function validateReleaseDraft(content, failures) {
  const lower = content.toLowerCase();
  if (!lower.includes("privacy model")) {
    failures.push("GitHub release draft must contain privacy model");
  }
  if (!lower.includes("privacy warning")) {
    failures.push("GitHub release draft must contain privacy warning");
  }
  if (!lower.includes("final decision")) {
    failures.push("GitHub release draft must contain final decision");
  }
  if (!lower.includes("windows unsigned warning")) {
    failures.push("GitHub release draft must contain Windows unsigned warning");
  }
  if (!lower.includes("sha256_placeholder") && !lower.includes("checksum")) {
    failures.push("GitHub release draft must contain checksum placeholder");
  }
  if (!/do not upload.*copyrighted epub.*api keys/s.test(lower)) {
    failures.push("GitHub release draft must warn not to upload copyrighted EPUBs or API keys");
  }
}

function validateLabelsJson(content, failures) {
  const labels = parseJson(content, "scripts/github-labels.json", failures);
  if (!Array.isArray(labels)) {
    failures.push("scripts/github-labels.json must contain an array");
    return;
  }
  const names = new Set();
  const requiredLabels = ["type: bug", "type: feature", "area: validation", "priority: p0", "status: needs-repro"];
  labels.forEach((label, index) => {
    if (!label?.name || !label?.color || !label?.description) {
      failures.push(`scripts/github-labels.json label ${index + 1} must include name, color, and description`);
      return;
    }
    if (names.has(label.name)) {
      failures.push(`Duplicate GitHub label: ${label.name}`);
    }
    names.add(label.name);
    if (!/^[0-9a-fA-F]{6}$/.test(label.color)) {
      failures.push(`GitHub label ${label.name} color must be 6 hex characters`);
    }
  });
  for (const label of requiredLabels) {
    if (!names.has(label)) {
      failures.push(`Missing required GitHub label: ${label}`);
    }
  }
}

function parseJson(content, file, failures) {
  try {
    return JSON.parse(content);
  } catch (error) {
    failures.push(`Invalid JSON in ${file}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function safeRead(readFile, file) {
  try {
    return readFile(file) ?? "";
  } catch {
    return "";
  }
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
