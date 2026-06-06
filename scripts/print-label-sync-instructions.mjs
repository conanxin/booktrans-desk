import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const labelsPath = path.join(repoRoot, "scripts", "github-labels.json");
const labels = JSON.parse(fs.readFileSync(labelsPath, "utf8"));

console.log("BookTrans Desk GitHub label sync instructions");
console.log("");
console.log("This script is print-only. It does not call the GitHub API and does not read tokens.");
console.log("");
console.log("Manual UI path:");
console.log("1. Open the GitHub repository Settings.");
console.log("2. Open Labels.");
console.log("3. Create or update the labels below.");
console.log("");
console.log("Optional gh CLI commands for a maintainer-owned shell:");
console.log("");

for (const label of labels) {
  const name = shellQuote(label.name);
  const color = shellQuote(label.color);
  const description = shellQuote(label.description);
  console.log(`gh label create ${name} --color ${color} --description ${description} --force`);
}

function shellQuote(value) {
  return JSON.stringify(String(value));
}
