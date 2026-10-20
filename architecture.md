# Learning Space — System Architecture (`architecture.md`)

> **Target Audience for this Document**: AI Coding Agents and Software Engineers maintaining or extending **Learning Space**. (Never rendered in the user-facing UI.)

---

## 1. Core Architectural Principles

1. **Single-Page 3-Zone Layout**:
   - **Left Column (`Assets`)**: Clean list of all workspace assets (`.md`, `.ppx`, `.ipynb`, `.graph`, `.pdf`, `image`, `sound`, `video`) with no checkboxes and no item count badges.
   - **Center Stage (`Asset & Chat`)**: Displays and edits the active asset alongside the grounded AI Chat and Live Voice Tutor (with a simple toggle between `Asset & Chat`, `Asset View`, and `Chat View`).
   - **Right Column (`Actions`)**: Clean column of Action buttons. Clicking an Action button prompts for parameters (if any) and runs the Action.
2. **Code-Only Configuration for `ModelConfig` and `Action`**:
   - `ModelConfig`s and `Action`s are **never** edited through the UI; they are configured directly in clean, modular source code files:
     - **`src/config/modelConfigs.ts`**: Pure model invocation configs (`provider`, `modelId`, `modality`, `settings`) for Gemini models or external/local providers (OpenAI, Anthropic, Ollama, Custom HTTP).
     - **`src/config/actions.ts`**: Parameterized Actions containing an ordered `models: ModelConfig[]` array and an async `run({ params, models, assets, tools })` function written directly in code.
3. **Open-Source `@marp-team/marp-core` Engine for `.ppx` Presentations**:
   - `.ppx` presentations use **Marp (`@marp-team/marp-core`)** with `html: true` and `math: 'katex'`.
   - Compiles Markdown (`---` slide separators), **Pictures** (`![w:420](...)`, `![bg right:40%](...)`), **Inline `<svg>` diagrams & charts**, **HTML/CSS grids**, and **LaTeX equations** (`$...$` and `$$...$$`) into scalable 16:9 SVG slides.
