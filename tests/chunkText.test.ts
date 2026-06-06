import { describe, expect, it } from "vitest";
import { chunkText } from "../src/main/translate/chunkText.js";

describe("chunkText", () => {
  it("returns no chunks for empty input", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("preserves paragraph boundaries where possible", () => {
    const chunks = chunkText("One\n\nTwo\n\nThree", 8);
    expect(chunks.map((chunk) => chunk.text)).toEqual(["One\n\nTwo", "Three"]);
  });

  it("splits oversized paragraphs", () => {
    const chunks = chunkText("abcdefghij", 4);
    expect(chunks.map((chunk) => chunk.text)).toEqual(["abcd", "efgh", "ij"]);
  });
});
