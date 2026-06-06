import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type { ExternalEpubCheckIssue, ExternalEpubCheckReport } from "../../shared/types.js";

export interface RunExternalEpubCheckOptions {
  timeoutMs?: number;
  spawnFn?: typeof spawn;
}

export async function runExternalEpubCheck(
  epubPath: string,
  commandLine?: string,
  options: RunExternalEpubCheckOptions = {}
): Promise<ExternalEpubCheckReport> {
  if (!commandLine?.trim()) {
    return {
      status: "unavailable",
      summary: "External EPUBCheck not configured.",
      stdout: "",
      stderr: "",
      exitCode: null,
      issues: [],
      rawOutput: "",
      durationMs: 0
    };
  }

  const parsed = parseCommandLine(commandLine);
  if (!parsed) {
    return {
      status: "unavailable",
      summary: "External EPUBCheck command could not be parsed.",
      stdout: "",
      stderr: "",
      exitCode: null,
      issues: [],
      rawOutput: "",
      durationMs: 0
    };
  }

  const timeoutMs = options.timeoutMs ?? 30_000;
  const spawnFn = options.spawnFn ?? spawn;
  const startedAt = Date.now();
  const commandDisplay = sanitize([parsed.command, ...parsed.args, "<epub>"].join(" "));

  return new Promise((resolve) => {
    const child = spawnFn(parsed.command, [...parsed.args, epubPath], {
      shell: false,
      windowsHide: true
    }) as ChildProcessWithoutNullStreams;
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      child.kill();
      resolve({
        status: "fail",
        summary: `External EPUBCheck timed out after ${timeoutMs} ms.`,
        stdout: sanitize(stdout),
        stderr: sanitize(stderr),
        exitCode: null,
        command: parsed.command,
        commandDisplay,
        issues: parseExternalEpubCheckIssues(`${stdout}\n${stderr}`),
        rawOutput: sanitize(`${stdout}\n${stderr}`.trim()),
        durationMs: Date.now() - startedAt
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      resolve({
        status: "unavailable",
        summary: `External EPUBCheck could not run: ${sanitize(error.message)}`,
        stdout: sanitize(stdout),
        stderr: sanitize(stderr),
        exitCode: null,
        command: parsed.command,
        commandDisplay,
        issues: parseExternalEpubCheckIssues(`${stdout}\n${stderr}`),
        rawOutput: sanitize(`${stdout}\n${stderr}`.trim()),
        durationMs: Date.now() - startedAt
      });
    });
    child.on("close", (exitCode) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      const cleanStdout = sanitize(stdout);
      const cleanStderr = sanitize(stderr);
      const rawOutput = sanitize(`${stdout}\n${stderr}`.trim());
      const issues = parseExternalEpubCheckIssues(rawOutput);
      const hasErrors = issues.some((issue) => issue.severity === "error");
      const hasWarnings = issues.some((issue) => issue.severity === "warning");
      resolve({
        status: exitCode === 0 && hasWarnings ? "warning" : exitCode === 0 && !hasErrors ? "pass" : "fail",
        summary: exitCode === 0 ? "External EPUBCheck passed." : `External EPUBCheck failed with exit code ${exitCode}.`,
        stdout: cleanStdout,
        stderr: cleanStderr,
        exitCode,
        command: parsed.command,
        commandDisplay,
        issues,
        rawOutput,
        durationMs: Date.now() - startedAt
      });
    });
  });
}

export function parseExternalEpubCheckIssues(output: string): ExternalEpubCheckIssue[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIssueLine)
    .filter((issue): issue is ExternalEpubCheckIssue => Boolean(issue));
}

function parseIssueLine(line: string): ExternalEpubCheckIssue | null {
  const match = /^(ERROR|WARNING|INFO)(?:\(([^)]+)\))?\s+at\s+([^:(]+)(?:\((\d+),(\d+)\))?:\s*(.+)$/i.exec(line);
  if (!match) {
    return null;
  }
  return {
    severity: match[1].toLowerCase() as ExternalEpubCheckIssue["severity"],
    code: match[2],
    file: match[3],
    line: match[4] ? Number(match[4]) : undefined,
    column: match[5] ? Number(match[5]) : undefined,
    message: sanitize(match[6])
  };
}

export function parseCommandLine(commandLine: string): { command: string; args: string[] } | null {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (const char of commandLine.trim()) {
    if ((char === '"' || char === "'") && !quote) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = null;
      continue;
    }
    if (/\s/.test(char) && !quote) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (quote) {
    return null;
  }
  if (current) {
    tokens.push(current);
  }
  const [command, ...args] = tokens;
  return command ? { command, args } : null;
}

function sanitize(text: string): string {
  return text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]").replace(/(api[_-]?key=)[^&\s]+/gi, "$1[redacted]");
}
