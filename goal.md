# Learning Space — Project Goals & Vision (`goal.md`)

> **Target Audience for this Document**: AI Coding Agents, Maintainers, and System Architects developing the **Learning Space** browser application.

---

## 1. Core Mission

**Learning Space** is a clear, simple, and modular browser-first learning environment inspired by Google's **NotebookLM**, designed to help anyone learn complex topics using AI. Unlike closed, read-only summarization tools, Learning Space treats every study material and AI synthesis output as a first-class, interactive **Asset** inside a local workspace, and gives users transparent, approachable control over **Actions** and **Model Configs**.

---

## 2. Core Pillars

### Pillar 1: Multi-Modal Asset Studio (View, Edit & Comment)
The Asset Section holds all learning materials in a single unified notebook workspace.
- **Editable & Interactive Assets**:
  - **Markdown (`.md`)**: First-class support for mathematical equations (inline `$...$` and block `$$...$$` via KaTeX), clean split/live editor, and structured formatting tools.
  - **Slides & Infographics (`.ppx`)**: Based on our format research (Marp / Slidev + declarative infographic blocks), `.ppx` uses a human-readable **Deck-Markdown + Visual Directive DSL** (`---` slide separators, `@layout`, `@stat`, `@step`, `@callout`, `@chart`). It is 100% editable both visually (via the interactive slide/infographic studio) and as plain text.
  - **Jupyter Notebooks (`.ipynb`)**: Interactive multi-cell notebooks combining Markdown/LaTeX explanatory cells with runnable in-browser code cells (JavaScript & Python-lite math/data expressions) with live outputs and plots.
  - **Knowledge Graphs (`.graph`)**: Interactive node-and-edge concept maps where users can inspect, add, edit, and connect concepts, linking nodes directly to source assets.
  - **Pictures (`image`)**: Visual diagrams and illustrations with captioning, study notes, and multimodal AI context integration.
- **Read & Comment Source Assets**:
  - **PDF Documents (`.pdf`)**: Document viewer with extracted text grounding and page-indexed annotations.
  - **Sound (`audio`) & Video (`video`)**: Media players with timeline scrubbing and **timestamped comments** (e.g., `@ 01:42 — Key intuition for wave-particle duality`). Binary audio and video are not destructively edited; instead, learners annotate them with clickable timestamp threads.

### Pillar 2: Grounded Chat & Live Voice Conversation
- **Contextual AI Chat**: Users converse with an AI tutor grounded in the checked/selected workspace assets. The chat can invoke any workspace **Action** or tool directly.
- **Live Voice Mode**: Real-time, low-latency spoken tutoring session powered by Gemini Live (`gemini-3.8-live`) over WebSocket so learners can talk through concepts hands-free.

### Pillar 3: Modular Actions & Pure Model Configs
A strict, clean separation of concerns between **Model Configs** and **Actions**:
1. **`ModelConfig` (Pure Model Invocation Layer)**:
   - A `ModelConfig` only defines **how to call a specific model** (whether Gemini models like `gemini-3.8-flash`, `gemini-4-argon`, `gemini-3.8-flash-tts`, `gemini-3.1-flash-lite-image`, or any external/local model provider such as OpenAI, Anthropic, Ollama, or custom HTTP endpoints).
   - It stores the model identifier, provider, system instruction, temperature, thinking level, or voice settings.
   - It contains **zero** routing or workflow logic.
2. **`Action` (Parameters + Ordered Model List + Assisted Simple Node Code)**:
   - Each Action defines:
     - **Parameters**: Simple user-facing inputs (e.g., Topic Focus, Difficulty Level, Number of Slides).
     - **Ordered `ModelConfig` List**: A prioritized list of Model Configs attached to the Action (`models[0]`, `models[1]`, etc.).
     - **Flow & Model Selection Code**: Simple, readable JavaScript/Node-style async code that selects which model config to run (e.g., primary with fallback, conditional selection based on parameters/assets, or multi-step pipelines), runs the prompt, and invokes workspace tools (`tools.createAsset`, `tools.readAssets`, etc.).
   - **Action Output Rules**: Actions can create new `.md`, `.ppx`, `.ipynb`, `.graph`, and `sound` (`.wav` TTS audio overview) assets, or post structured responses to Chat. Actions **never** generate binary `.pdf` or `.video` files.
   - **Non-Technical Usability**: Because target users may not know programming, the Action editor provides **Assisted Code Tools** — one-click insertable building blocks (If/Else Model Selector, Fallback Loop, Asset Creator, Parameter Chips), a live Plain-English step-by-step explanation view, and a natural-language "AI Flow Writer" that turns plain English instructions into clean Action code.

### Pillar 4: Local-First Browser Execution
- Runs locally in the browser with full state persistence via **IndexedDB** + `localStorage` and single-file workspace export/import (`.lspace.json`), ensuring instant load times and complete data ownership.
