import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(file: string): string {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

describe("Chinese UI copy", () => {
  it("contains Chinese tab labels", () => {
    const app = read("src/renderer/App.tsx");
    expect(app).toContain("翻译工作台");
    expect(app).toContain("任务");
    expect(app).toContain("导出记录");
    expect(app).toContain("设置");
  });

  it("contains Chinese translation style labels", () => {
    const settings = read("src/renderer/components/TranslationSettings.tsx");
    expect(settings).toContain("忠实准确");
    expect(settings).toContain("自然流畅");
    expect(settings).toContain("学术书面");
    expect(settings).toContain("通俗易懂");
  });

  it("contains Chinese diagnostic safety notice", () => {
    const validation = read("src/renderer/components/ValidationReportPanel.tsx");
    expect(validation).toContain("诊断包会自动脱敏");
    expect(validation).toContain("不包含原始 EPUB");
    expect(validation).toContain("API 密钥");
  });

  it("contains primary Chinese empty states", () => {
    expect(read("src/renderer/components/ImportPanel.tsx")).toContain("还没有导入文件");
    expect(read("src/renderer/components/BookInfoCard.tsx")).toContain("导入 EPUB 后");
    expect(read("src/renderer/components/ChapterList.tsx")).toContain("导入文件后");
    expect(read("src/renderer/components/JobManagerPanel.tsx")).toContain("暂无翻译任务");
    expect(read("src/renderer/components/ExportHistoryPanel.tsx")).toContain("暂无导出记录");
  });
});
