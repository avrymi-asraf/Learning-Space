# Learning Space — Agent Todo & Completed Changes (`todo.md`)

- [x] Remove `goal.md`, `architecture.md`, `Design.md`, and `todo.md` from the application UI (kept strictly as root files for the coding agent).
- [x] Remove UI editors for Model Configs and Actions; move them to clean, directly editable code files (`src/config/modelConfigs.ts` and `src/config/actions.ts`).
- [x] Simplify to a single one-page layout:
  - Left side: Assets list (with checkboxes and asset count removed).
  - Center: View/edit active Asset and Chat (with Live Voice option).
  - Right side: Actions as clean buttons.
- [x] Replace custom `.ppx` format with the open-source **`@marp-team/marp-core`** presentation engine supporting Pictures (`![]()` / uploaded images), inline `<svg>` vector diagrams and charts, HTML layouts, and KaTeX math equations.
