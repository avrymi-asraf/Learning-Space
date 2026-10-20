# Learning Space — Agent Todo & Completed Changes (`todo.md`)

- [x] Remove `goal.md`, `architecture.md`, `Design.md`, and `todo.md` from the application UI (kept strictly as root files for the coding agent).
- [x] Remove UI editors for Model Configs and Actions; move them to clean, directly editable code files (`src/config/modelConfigs.ts` and `src/config/actions.ts`).
- [x] Simplify to a single one-page layout:
  - Left side: Assets list (with checkboxes and asset count removed).
  - Center: View/edit active Asset and Chat (with Live Voice option).
  - Right side: Actions as clean buttons.
- [x] Replace custom `.ppx` format with the open-source **`@marp-team/marp-core`** presentation engine supporting Pictures (`![]()` / uploaded images), inline `<svg>` vector diagrams and charts, HTML layouts, and KaTeX math equations.
- [x] Replace custom hand-rolled implementations with established open-source libraries where it genuinely simplifies the codebase:
  - **`react-markdown` + `remark-math` + `rehype-katex` + `remark-gfm`** for Markdown + LaTeX equation rendering (`src/utils/mathRenderer.tsx`).
  - **`@xyflow/react` (React Flow)** for interactive concept graph node dragging, edge connections, and zoom/pan controls (`src/components/AssetEditors.tsx`).
  - **`idb-keyval`** for clean IndexedDB local browser persistence (`src/services/storage.ts`).
