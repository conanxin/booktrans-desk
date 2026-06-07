import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(file: string): string {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

describe("Chinese UI copy", () => {
  it("contains DocuMuse Studio workspace shell labels", () => {
    const app = read("src/renderer/App.tsx");
    expect(app).toContain("DocuMuse Studio");
    expect(app).toContain("本地 AI 文档阅读、分析、翻译与知识导出工作台");
    expect(app).toContain("文档库");
    expect(app).toContain("文档助手");
    expect(app).toContain("生成材料");
    expect(app).toContain("文档详情");
  });

  it("keeps translation as a contextual task with PDF HOLD copy", () => {
    const app = read("src/renderer/App.tsx");
    expect(app).toContain("翻译任务");
    expect(app).toContain("EPUB 全书翻译");
    expect(app).toContain("实验性翻译当前页");
    expect(app).toContain("PDF translation: Experimental / HOLD");
    expect(app).toContain("PDF 翻译不是 public release 能力");
  });

  it("contains Chinese translation style labels", () => {
    const settings = read("src/renderer/components/TranslationSettings.tsx");
    expect(settings).toContain("忠实准确");
    expect(settings).toContain("自然流畅");
    expect(settings).toContain("学术书面");
    expect(settings).toContain("通俗易懂");
  });

  it("contains primary empty states for the new document workbench", () => {
    const app = read("src/renderer/App.tsx");
    expect(app).toContain("导入 EPUB 或 PDF 开始");
    expect(app).toContain("尚未分析");
    expect(app).toContain("还没有问答");
    expect(app).toContain("暂无译文版本");
  });
});
