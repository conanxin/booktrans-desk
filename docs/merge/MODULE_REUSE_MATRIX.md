# Module Reuse Matrix

## Migration Principle

Reuse behavior through small shared services and adapters. Do not copy the entire DocuMuse Next.js application into the Electron application.

## Migrate From DocuMuse

| DocuMuse module | Destination | Reuse approach |
| --- | --- | --- |
| `src/lib/documentTypes.ts` | `src/shared/documentModel.ts` | Port model ideas into Electron-safe shared types. |
| `src/lib/documentStructure.ts` | `src/main/document/*` | Reuse structure extraction ideas for chapters, sections, and unit grouping. |
| `src/lib/documentKindDetector.ts` | `src/main/document/documentKindDetector.ts` | Start with a lightweight detector, keep room for full migration. |
| `src/lib/outlineExtractor.ts` | `src/main/document/outlineExtractor.ts` | Port EPUB/PDF outline heuristics in a unified extractor. |
| `src/lib/outlineUtils.ts` | `src/main/document/outlineExtractor.ts` | Reuse flattening and tree-building ideas where needed. |
| `src/lib/textChunker.ts` | `src/main/analysis/*` | Use for future full chunked analysis. |
| `src/lib/analysisPrompts.ts` | `src/main/analysis/analysisPrompts.ts` | Port prompt structure without Next.js dependencies. |
| `src/lib/analysisResult.ts` | `src/main/analysis/*` and shared types later | Preserve result shape ideas for summaries, insights, and sources. |
| `src/lib/llmClient.ts` JSON/analysis capabilities | `src/main/analysis/*` | Add an analysis completion client separate from the translation engine. |
| `src/lib/exporters/*` | `src/main/export/*` | Start with Markdown/JSON; evaluate PPTX before dependency changes. |
| `DocumentWorkspace` UI idea | `src/renderer/App.tsx` and components | Incrementally reshape the desktop UI into a workspace shell. |
| `WorkspaceSidebar` / `OriginalTextPanel` / `ChatPanel` | `src/renderer/components/*` | Reuse information architecture and interaction ideas, not Next.js components verbatim. |

## Preserve From BookTrans Desk

| BookTrans Desk module | Policy |
| --- | --- |
| `src/main/index.ts` | Keep Electron app bootstrap. |
| `src/main/ipc.ts` | Preserve IPC architecture; add non-breaking handlers. |
| `src/main/epub/readEpub.ts` | Keep EPUB import. |
| `src/main/epub/writeTranslatedEpub.ts` | Keep translated EPUB export. |
| `src/main/epub/validateEpub.ts` | Keep validation. |
| `src/main/translationJob.ts` | Keep translation job flow. |
| `src/main/translate/*` | Keep providers, quality gates, retry, resume, cancellation, and prompt building. |
| `src/main/pdf/*` | Keep the layout-aware pipeline and converge it into unified document adapters. |
| `src/main/export/exportHistoryStore.ts` | Keep export history and extend with unified export records later. |
| `src/main/profile/translationProfileStore.ts` | Keep profile store; never persist API keys in document snapshots. |
| `electron-builder` config | Keep packaging baseline. |
| `scripts/release-check.mjs` | Keep release gate; PDF release remains HOLD. |

## PDF Pipeline Direction

BookTrans Desk's PDF layout-aware extraction remains the single active PDF parser in the merged Electron app. DocuMuse PDF reading concepts should attach to its output through `UnifiedDocument` adapters rather than keeping a second isolated PDF pipeline.

