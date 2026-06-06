import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";
import { runExternalEpubCheck } from "../src/main/epub/runExternalEpubCheck.js";

describe("runExternalEpubCheck", () => {
  it("returns unavailable when not configured", async () => {
    const report = await runExternalEpubCheck("book.epub", "");
    expect(report.status).toBe("unavailable");
  });

  it("returns pass for exit code 0", async () => {
    const report = await runExternalEpubCheck("book.epub", "epubcheck", { spawnFn: spawnMock({ exitCode: 0, stdout: "ok" }) });
    expect(report.status).toBe("pass");
    expect(report.stdout).toBe("ok");
  });

  it("returns fail for non-zero exit code", async () => {
    const report = await runExternalEpubCheck("book.epub", "epubcheck", { spawnFn: spawnMock({ exitCode: 1, stderr: "bad" }) });
    expect(report.status).toBe("fail");
    expect(report.stderr).toBe("bad");
  });

  it("returns fail on timeout", async () => {
    const report = await runExternalEpubCheck("book.epub", "epubcheck", {
      timeoutMs: 5,
      spawnFn: spawnMock({ neverClose: true })
    });
    expect(report.status).toBe("fail");
    expect(report.summary).toContain("timed out");
  });

  it("redacts sensitive stdout and stderr", async () => {
    const report = await runExternalEpubCheck("book.epub", "epubcheck", {
      spawnFn: spawnMock({ exitCode: 1, stdout: "Bearer secret-token", stderr: "apiKey=secret" })
    });
    expect(report.stdout).toContain("Bearer [redacted]");
    expect(report.stderr).toContain("apiKey=[redacted]");
  });
});

function spawnMock(options: { exitCode?: number; stdout?: string; stderr?: string; neverClose?: boolean }) {
  return (() => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: () => void;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => undefined;
    setTimeout(() => {
      if (options.stdout) {
        child.stdout.emit("data", Buffer.from(options.stdout));
      }
      if (options.stderr) {
        child.stderr.emit("data", Buffer.from(options.stderr));
      }
      if (!options.neverClose) {
        child.emit("close", options.exitCode ?? 0);
      }
    }, 0);
    return child;
  }) as never;
}
