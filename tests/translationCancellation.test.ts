import { describe, expect, it } from "vitest";
import { TranslationCancellationManager } from "../src/main/translate/cancellation.js";
import { createTranslationError, normalizeTranslationError } from "../src/main/translate/translationErrors.js";

describe("translation cancellation", () => {
  it("creates a fresh signal for a new task after a cancelled task is cleared", () => {
    const manager = new TranslationCancellationManager();
    const first = manager.start("job-1");
    manager.cancel("job-1");
    expect(first.abortController.signal.aborted).toBe(true);
    manager.clear("job-1");

    const second = manager.start("job-2");
    expect(second.abortController.signal.aborted).toBe(false);
    expect(second.jobId).toBe("job-2");
  });

  it("maps user cancellation to USER_CANCELLED", () => {
    expect(normalizeTranslationError(createTranslationError("USER_CANCELLED")).code).toBe("USER_CANCELLED");
  });
});
