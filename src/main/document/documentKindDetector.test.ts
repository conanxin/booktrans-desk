import { describe, expect, it } from "vitest";
import { detectDocumentKindFromText } from "./documentKindDetector.js";

describe("detectDocumentKindFromText", () => {
  it("detects academic papers", () => {
    const result = detectDocumentKindFromText("Abstract\nThis paper studies retrieval.\nIntroduction\nMethods\nResults\nDiscussion\nReferences\n[1] Example.");
    expect(result.kind).toBe("paper");
    expect(result.signals).toContain("abstract");
  });

  it("detects interviews", () => {
    const result = detectDocumentKindFromText("Interviewer: Welcome.\nQ: What changed?\nA: The market changed.\nQ: Why now?\nA: Because adoption is rising.");
    expect(result.kind).toBe("interview");
  });

  it("detects business reports", () => {
    const result = detectDocumentKindFromText("Annual Report 2025 revenue profit cash flow shareholder governance market share risk management ESG strategy.");
    expect(result.kind).toBe("business-report");
  });

  it("detects fiction", () => {
    const result = detectDocumentKindFromText("Chapter 1\nThe old city slept. \"Come with me,\" she said. The protagonist walked into the storm as the story began.");
    expect(result.kind).toBe("fiction");
  });

  it("detects manuals", () => {
    const result = detectDocumentKindFromText("Setup Guide\nStep 1 install the tool.\nStep 2 configure the API reference.\nTroubleshooting\nWarning: check each parameter.");
    expect(result.kind).toBe("manual");
  });

  it("detects book chapters", () => {
    const result = detectDocumentKindFromText("Chapter 3\nIn this chapter we define core concepts, provide examples, and end with exercises and a chapter summary.");
    expect(result.kind).toBe("book-chapter");
  });

  it("detects articles", () => {
    const result = detectDocumentKindFromText("This article is an opinion essay about local-first software and why desktop tools are becoming useful again.");
    expect(result.kind).toBe("article");
  });

  it("falls back to unknown", () => {
    const result = detectDocumentKindFromText("short note");
    expect(result.kind).toBe("unknown");
  });
});

