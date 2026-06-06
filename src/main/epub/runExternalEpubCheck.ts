import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type { ExternalEpubCheckReport } from "../../shared/types.js";

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
      exitCode: null
    };
  }

  const parsed = parseCommandLine(commandLine);
  if (!parsed) {
    return {
      status: "unavailable",
      summary: "External EPUBCheck command could not be parsed.",
      stdout: "",
      stderr: "",
      exitCode: null
    };
  }

  const timeoutMs = options.timeoutMs ?? 30_000;
  const spawnFn = options.spawnFn ?? spawn;

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
        command: parsed.command
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
        command: parsed.command
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
      resolve({
        status: exitCode === 0 ? "pass" : "fail",
        summary: exitCode === 0 ? "External EPUBCheck passed." : `External EPUBCheck failed with exit code ${exitCode}.`,
        stdout: cleanStdout,
        stderr: cleanStderr,
        exitCode,
        command: parsed.command
      });
    });
  });
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
