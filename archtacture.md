# Learning Space — System Architecture (`archtacture.md`)

See `/architecture.md` for the full architectural blueprint:
- **Single-Page Layout**: Left = Assets (no checkboxes or counts), Center = Edit/View Asset & Chat/Live Voice, Right = Action buttons.
- **Direct Code Configuration**:
  - `src/config/modelConfigs.ts`: Pure model callers (Gemini + external/local models).
  - `src/config/actions.ts`: Actions with parameters, ordered `models` list, and async `run` code.
- **Open-Source `.ppx` Presentation Engine**: Powered by `@marp-team/marp-core`, supporting Markdown, Pictures (`![]()`), Inline `<svg>` vector diagrams, HTML layouts, and KaTeX equations.
