import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getTrackedFiles, readTrackedFile, runReleaseFileChecks } from "./lib/releaseCheckCore.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipCommands = process.argv.includes("--skip-commands");
const failures = [];

function runStep(label, command) {
  try {
    console.log(`RUN ${label}`);
    execSync(command, { cwd: repoRoot, stdio: "inherit" });
    console.log(`PASS ${label}`);
  } catch {
    failures.push(`${label} failed.`);
    console.error(`FAIL ${label}`);
  }
}

if (!skipCommands) {
  runStep("build", "npm run build");
  runStep("test", "npm test");
  runStep("audit", "npm audit --audit-level=moderate");
}

try {
  const files = getTrackedFiles(repoRoot, execFileSync);
  const result = runReleaseFileChecks({
    files,
    readFile: (file) => readTrackedFile(repoRoot, file)
  });
  if (result.ok) {
    console.log("PASS repository safety scan");
  } else {
    failures.push(...result.failures);
    console.error("FAIL repository safety scan");
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

if (failures.length) {
  console.error("\nRelease check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\nRelease check PASS");
