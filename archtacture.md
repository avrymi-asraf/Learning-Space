# Learning Space — System Architecture (`archtacture.md`)

> Note: This file mirrors `/architecture.md` for agents and developers. Never rendered in the UI.

- **Single-Page 3-Column Layout**: Left (`Assets`, no checkboxes/counts) · Center (`Asset & Chat`) · Right (`Actions` as buttons).
- **Code-Defined Model Configs & Actions**: Edited directly in `src/config/modelConfigs.ts` and `src/config/actions.ts`.
- **Standard Open-Source Libraries**:
  - `react-markdown` + `remark-math` + `rehype-katex` + `remark-gfm` for Markdown and LaTeX math rendering.
  - `@marp-team/marp-core` for `.ppx` slide decks with pictures, `<svg>` diagrams, HTML layouts, and KaTeX math.
  - `@xyflow/react` for interactive concept graph dragging, panning, zooming, and connecting.
  - `idb-keyval` for 2-line IndexedDB browser persistence.
