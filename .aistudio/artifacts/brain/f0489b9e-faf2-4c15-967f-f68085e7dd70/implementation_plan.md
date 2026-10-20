# Learning Space — Modular AI Learning Studio

Learning Space is a local-first, browser-based AI learning environment inspired by NotebookLM that unifies multi-modal study materials, interactive editors, grounded AI chat with real-time voice conversation, and a visual node-based workflow builder for customizing AI actions and model routing without requiring technical expertise.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed architectural and product choices below before we proceed to implementation. Click **Proceed** to build both the four developer/agent specification documents (`goal.md`, `architecture.md`, `Design.md`, `todo.md`) and the complete interactive **Learning Space** web application.

- **Confirmed Decision 1 — Agent Specification Documents vs. Application**: The four requested markdown documents (`goal.md`, `architecture.md`, `Design.md`, and `todo.md`) will be generated as dedicated engineering and agent reference blueprints in the project workspace to guide development and maintainability, while the application itself will launch with rich sample learning workspaces (e.g., *Quantum Mechanics & Wavefunctions* and *Cellular Respiration & Bioenergetics*) demonstrating every asset format.
- **Confirmed Decision 2 — Interactive Slide (`ppx`) & Notebook (`ipynb`) Editors**: Slide/Infographic (`ppx`) assets will feature an interactive visual slide deck and infographic canvas editor with layout templates, visual callout blocks, data charts, and speaker notes. Jupyter Notebook (`ipynb`) assets will support interactive Markdown/LaTeX cells alongside runnable in-browser JavaScript and Python-lite scientific calculation cells with live output and plotting.
- **Confirmed Decision 3 — Node-Based Visual Flow Builder for Actions & Model Configs**: Non-technical users will configure Actions and ordered Model Config chains through an intuitive visual node canvas. Users can drag, connect, and reorder plain-language nodes (*Input Parameters* → *Smart Routing Condition* → *Primary Model Config* → *Fallback Model Config* → *Generated Asset Output*) to control how prompts execute and which models are used.
- **Default Choice — Local Browser Persistence via IndexedDB**: To ensure the entire studio runs locally in the browser while supporting large media files (PDFs, audio overviews, video lectures, and high-resolution images), workspace state and binary blobs will be persisted in browser IndexedDB with instant workspace export/import bundles.

---

## 1. Overview & Core Concept

- **What It Does**: Learning Space organizes any learning topic into a self-contained **Notebook Workspace** composed of three synchronized areas:
  1. **Asset Studio (Sources & Interactive Editors)**: Stores, displays, and edits all study materials — PDFs, Markdown notes with live LaTeX math equations, images, interactive `.ppx` slide decks and infographics, runnable `.ipynb` notebooks, interactive concept graphs, and audio/video media with timestamped commentary threads.
  2. **Grounded Chat & Live Voice Tutor**: An AI study partner grounded in the user's selected assets that can answer questions with inline citations, invoke any workspace Action, and switch into **Live Voice Mode** (`gemini-3.8-live`) for real-time spoken tutoring.
  3. **Action & Model Config Flow Studio**: A modular system where one-click **Actions** execute structured prompts and tools to synthesize new learning assets (`md`, `ppx`, `ipynb`, `graph`, and `sound` audio overviews — while keeping `pdf` and `video` as read/comment source formats). Each Action is powered by an ordered list of **Model Configs** edited visually via a friendly node-based flow builder.
- **Target Audience / Persona**: Self-directed learners, students, educators, and researchers who want the source-grounded synthesis power of NotebookLM combined with direct, editable control over their notes, slides, code notebooks, concept maps, and AI workflows.
- **Key Value**: Transforms passive reading into active creation by letting users view, edit, comment on, and generate multi-modal study artifacts in a single local-first browser workspace with transparent, human-friendly control over AI behavior.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Workspace & Source Exploration**:
   - The user opens a Learning Space notebook and sees their curated list of sources and generated assets on the left, the active **Asset Canvas / Editor** in the center stage, and the **Chat & Action Dock** on the right.
   - Selecting any asset checkboxes includes or excludes those specific materials from the AI's active grounding context.
2. **Multi-Modal Asset Viewing, Editing & Commenting**:
   - **Markdown (`md`)**: Users write and edit study notes in a clean split or live preview editor with full LaTeX equation rendering (`$E = mc^2$`, block matrices, integrals) and instant citation insertion.
   - **Slides & Infographics (`ppx`)**: Users browse slide thumbnails, edit slide headlines, bullet points, visual infographic cards, and diagram blocks, or present the deck full-screen.
   - **Jupyter Notebooks (`ipynb`)**: Users add, reorder, and edit Markdown/math cells and runnable code cells, executing calculations or generating inline charts right in the browser.
   - **Knowledge Graph (`graph`)**: Users explore an interactive force-directed concept map, drag nodes, add new concepts or relationships, and click nodes to jump to linked assets.
   - **Audio (`sound`) & Video (`video`)**: Users play audio podcasts or video lectures with an interactive timeline bar and attach **timestamped comments** (e.g., `@ 02:14 — Key derivation of the Schrödinger equation`) that jump to that exact moment when clicked.
   - **PDF & Pictures**: Users inspect documents and diagrams with zoom, page navigation, and visual study notes.
3. **One-Click Actions & Asset Synthesis**:
   - From the Chat panel or Action launcher, the user triggers an Action such as *Create Visual Slide Deck (`ppx`)*, *Generate Interactive Lab (`ipynb`)*, *Synthesize Concept Map (`graph`)*, *Draft Equation Cheat-Sheet (`md`)*, or *Produce Two-Host Audio Overview (`sound`)*.
   - A parameter drawer lets the user pick simple inputs (e.g., *Target Depth: Beginner / Advanced*, *Focus Topic*, *Slide Count*), executes the Action's ordered Model Config pipeline, and opens the newly created asset directly in the Asset Studio.
4. **Visual Node Builder for Actions & Model Configs**:
   - Clicking **Configure Actions & Models** switches the center stage to the **Visual Flow Builder**.
   - Users see their Action represented as connected cards on an interactive canvas:
     - **Parameter Node**: Defines friendly user inputs (topic focus, tone, output format).
     - **Prompt & Tool Node**: Shows the prompt template with clickable `@parameter` and `@selected_assets` tokens plus enabled tools (Asset Creator, Equation Formatter, Web Grounding).
     - **Model Config Chain Nodes (Ordered 1 → 2 → 3)**: Displays the ordered priority chain of Model Configs. Each Model Config card translates complex model settings into clear sliders and toggles (*Thinking Effort: Fast / Balanced / Deep Reasoning*, *Creativity Temperature*, *Model Tier: Fast Flash vs. Deep Reasoning Argon vs. Multi-Speaker Audio TTS*, and *Auto-Fallback / Routing Rule* such as *"Use Deep Reasoning if asset includes Math/Code, otherwise Fast Flash"*).

### Visual Identity & Theme

- **Aesthetic Direction**: Refined Editorial Knowledge Studio — inspired by NotebookLM, Linear, and ObservableHQ. Calm, high-craft academic clarity that prioritizes reading comfort, mathematical legibility, and distraction-free spatial organization.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas (`--background`)**: Warm alabaster paper (`#F8FAFC`) in Light Mode / Deep obsidian slate (`#0B0F19`) in Dark Mode for long-session reading comfort.
  - **30% Structural Surfaces (`--surface` & `--border`)**: Crisp elevated workspace panels (`#FFFFFF` / `#111827`) separated by 1px hairline borders (`#E2E8F0` / `#1E293B`) with single-elevation depth (never nesting bordered cards inside cards).
  - **10% Semantic Focal Accents (`--primary` & `--accent`)**:
    - Primary Brand & Active Selection: Deep Indigo-Cobalt (`#2563EB`) paired with explicit state labels.
    - Live Voice & Audio Synthesis: Emerald Pulse (`#059669`) with clear `● LIVE VOICE` / `● PLAYING` text indicators.
    - Node Flow Routing & Action Triggers: Warm Amber (`#D97706`) for condition/routing connectors.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display & Workspace Headers**: `Plus Jakarta Sans` (SemiBold 600, tight tracking, `text-wrap: balance`) for notebook titles, slide headings, and section architecture.
  - **Body Prose & Study Notes**: `DM Sans` (Regular 400 / Medium 500, 15px–16px, 1.65 line-height, 68ch measure) for comfortable long-form reading and chat dialogue.
  - **Math, Code & Tabular Metrics**: `JetBrains Mono` (`tabular-nums`) for Jupyter code cells, media timestamps (`02:14`), and model parameter metrics, paired with KaTeX math serif rendering for inline and block equations.
- **Component Styling & Layout**:
  - **Top Bar Contract**: Single-row header with 3 distinct zones separated by `gap-8`:
    1. *Left*: Brand wordmark (`Learning Space`) + active notebook selector.
    2. *Center*: 4 concise single-line workspace view links (`Studio`, `Visual Actions`, `Model Configs`, `Knowledge Graph`).
    3. *Right*: 1 primary action button (`+ Add Asset`).
  - **Zero-Pill Metadata Discipline**: Asset types, page counts, timestamps, and model names are rendered as clean, unboxed inline text separated by middots (`Markdown · 14 Equations · Updated 2m ago`), reserving button backgrounds strictly for interactive filter tabs and action triggers.
- **Interactive Feedback & Motion**:
  - Micro-interactions settle within `150ms` using `cubic-bezier(0.16, 1, 0.3, 1)` on `transform` and `opacity` only.
  - Step-by-step visual progress indicator during Action execution showing which Model Config node in the priority chain is currently active.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Custom Structured `.ppx` Format for Slides & Infographics**
  - *Chosen Approach*: Represent `.ppx` assets as a clean, human-readable JSON schema containing slides, layout modes (`title-hero`, `split-comparison`, `infographic-stat-grid`, `process-flow`, `equation-spotlight`), visual callouts, and speaker notes, rendered by an interactive visual slide editor and full-screen presenter.
  - *Why*: Binary PowerPoint files cannot be natively edited or cleanly generated by LLMs in the browser without heavy lossy conversion. A structured `.ppx` JSON schema lets AI Actions generate rich infographics and slide decks deterministically while giving users a fast, zero-dependency visual editor.
  - *Alternatives Considered*: Static image slides (impossible to edit text/equations) or raw HTML slides (hard for non-technical users to edit safely).

- **Decision 2: Ordered Model Config Chain with Visual Node Routing**
  - *Chosen Approach*: Decouple **Actions** (what to accomplish, what parameters to ask for, and which asset type to output) from **Model Configs** (which Gemini model, thinking level, temperature, voice config, and routing condition to apply). Each Action holds an ordered list of Model Config nodes that evaluate in sequence (with automatic fallback if a condition isn't met or if a model errors).
  - *Why*: Non-technical users can pick friendly presets (*"Fast Study Helper"*, *"Deep Math & Code Reasoner"*, *"Dual-Host Podcast Studio"*) and visually rearrange the chain on a node canvas without ever touching raw JSON or code.
  - *Alternatives Considered*: Hardcoding one model per action (inflexible) or exposing raw API parameter forms (intimidating for non-technical learners).

- **Decision 3: Safe In-Browser Notebook Execution & Media Timestamp Commenting**
  - *Chosen Approach*: Provide an in-browser sandboxed evaluator for `.ipynb` code cells supporting JavaScript and Python-lite mathematical/array expressions with interactive chart outputs, while treating `.pdf`, `sound`, and `video` as immutable source/media streams enriched by an interactive **Timestamp & Page Annotation Layer**.
  - *Why*: Matches the exact specification that PDFs, videos, and sounds are not directly mutated as raw binaries, while empowering learners to attach structured, clickable study comments to any second of audio/video or page of a PDF.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                         LEARNING SPACE — BROWSER APPLICATION                         │
├───────────────────────┬──────────────────────────────────────┬───────────────────────┤
│   SOURCES & ASSETS    │       CENTER INTERACTIVE STAGE       │  GROUNDED AI & LIVE   │
│      LEFT PANEL       │       (VIEW & EDIT BY FORMAT)        │     RIGHT DOCK        │
├───────────────────────┼──────────────────────────────────────┼───────────────────────┤
│ • Asset Filter Bar    │ ┌──────────────────────────────────┐ │ • Grounded Chat View  │
│ • Context Checkboxes  │ │ Markdown + KaTeX Equation Editor │ │   with Asset Citations│
│ • Upload / Create     │ ├──────────────────────────────────┤ │ • Live Voice Session  │
│   Asset Modal         │ │ PPX Slide & Infographic Studio   │ │   (WebSocket Audio)   │
│ • Asset List:         │ ├──────────────────────────────────┤ │ • Quick Action Bar    │
│   - Markdown (.md)    │ │ Jupyter Notebook (.ipynb) Runner │ │   - Create MD Note    │
│   - Slides (.ppx)     │ ├──────────────────────────────────┤ │   - Create PPX Deck   │
│   - Notebook (.ipynb) │ │ Interactive Concept Graph Canvas │ │   - Create Notebook   │
│   - Graph (.graph)    │ ├──────────────────────────────────┤ │   - Create Graph      │
│   - PDF Document      │ │ PDF Reader & Image Annotator     │ │   - Create Audio TTS  │
│   - Picture (.png)    │ ├──────────────────────────────────┤ │ • Parameter Drawer &  │
│   - Audio (.wav)      │ │ Audio & Video Player +           │ │   Execution Progress  │
│   - Video (.mp4)      │ │ Timestamped Comment Thread       │ │                       │
│                       │ ├──────────────────────────────────┤ │                       │
│                       │ │ Visual Node Flow Builder         │ │                       │
│                       │ │ (Actions & Model Config Chains)  │ │                       │
│                       │ └──────────────────────────────────┘ │                       │
└───────────┬───────────┴──────────────────┬───────────────────┴───────────┬───────────┘
            │                              │                               │
            ▼                              ▼                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                 LOCAL WORKSPACE ENGINE (IndexedDB + State Store)                     │
│  • Asset Registry & Binary Blob Store      • Action Runner & Tool Dispatcher         │
│  • Ordered Model Config Selector Logic     • Workspace Export / Import Manager       │
└──────────────────────────────────────────┬───────────────────────────────────────────┘
                                           │ HTTP / SSE / WebSocket (/api/* & /live)
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER & @google/genai GATEWAY                             │
│  • POST /api/ai/run-action   → Executes ordered Model Config chain + Structured JSON │
│  • POST /api/ai/chat         → Grounded multi-asset chat + Tool calls (createAsset)  │
│  • POST /api/ai/tts          → Generates WAV study podcasts (gemini-3.8-flash-tts)   │
│  • POST /api/ai/image        → Generates infographic visuals (gemini-3.1-flash-lite) │
│  • WS   /live                → Real-time voice tutoring bridge (gemini-3.8-live)     │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

1. **`Asset` Entity**:
   - `id`, `title`, `type` (`'md' | 'ppx' | 'ipynb' | 'graph' | 'pdf' | 'image' | 'sound' | 'video'`), `selectedForContext` (boolean), `createdAt`, `updatedAt`.
   - `content`: Format-specific payload (Markdown string with LaTeX, `.ppx` slide deck JSON, `.ipynb` cells array, `.graph` nodes/edges JSON, or binary Blob URL / base64 in IndexedDB).
   - `comments`: Array of `AssetComment` (`id`, `author`, `text`, `timestampSeconds?` for audio/video, `pageNumber?` for PDF, `createdAt`).
2. **`ModelConfig` Entity**:
   - `id`, `name`, `description` (plain-language summary for non-technical users), `modelId` (`'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite' | 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts' | 'gemini-3.1-flash-lite-image'`).
   - `settings`: `temperature`, `thinkingLevel` (`'LOW' | 'MEDIUM' | 'HIGH'`), `systemInstruction`, `voiceName`, `multiSpeaker` config.
   - `selectionRule`: Conditional routing rule (`'always' | 'when_math_or_code' | 'when_large_context' | 'when_creative_visual' | 'fallback_on_error'`).
3. **`Action` Entity**:
   - `id`, `name`, `description`, `icon`, `outputAssetType` (`'md' | 'ppx' | 'ipynb' | 'graph' | 'sound' | 'chat_response'`).
   - `parameters`: Array of user-configurable inputs (`name`, `label`, `type`: `'text' | 'select' | 'number'`, `defaultValue`, `options`).
   - `promptTemplate`: Prompt with `{{parameter}}` placeholders and automatic grounding injection.
   - `enabledTools`: Array of tools (`'create_asset'`, `'update_asset'`, `'google_search'`, `'equation_verifier'`).
   - `modelConfigChain`: Ordered array of `ModelConfig` IDs plus visual node coordinates `(x, y)` for the Node Flow Builder.

### Interactive Component & State Mapping

- **Asset Studio Switcher**: Selecting an asset in the left sidebar updates `activeAssetId` and mounts the specialized editor (`MarkdownEquationEditor`, `PpxSlideEditor`, `JupyterNotebookEditor`, `ConceptGraphEditor`, `PdfViewerWithNotes`, `ImageAnnotator`, or `MediaTimelineCommentPlayer`). All edits auto-save to IndexedDB within 300ms.
- **Timestamped Media Commenting**: In `MediaTimelineCommentPlayer`, clicking **+ Add Comment at Current Time** captures `audioOrVideoRef.current.currentTime`, formats it as `MM:SS`, and appends a clickable comment card that seeks the media player when clicked.
- **Visual Node Flow Canvas (`ActionModelFlowBuilder`)**: Users can select any Action or create a new one, add parameter nodes, edit the prompt template with one-click variable chips, drag Model Config nodes onto the ordered chain, toggle routing conditions (e.g., *"Use Deep Math Model if equations detected, else Fast Model"*), and test-run the flow live.
- **Action Execution Engine**: Clicking **Run Action** opens the parameter prompt (if parameters exist), evaluates the Action's `modelConfigChain` in order against the active context and routing rules, invokes the server `/api/ai/run-action` endpoint (with automatic fallback to the next `ModelConfig` node in the chain if a model fails), parses the structured output, creates the new `.md`, `.ppx`, `.ipynb`, `.graph`, or `.wav` sound asset, and selects it in the studio.
- **Agent Specification Files**: In parallel with the application code, we will create the four comprehensive specification documents at the root of the workspace (`goal.md`, `architecture.md`, `Design.md`, and `todo.md`) so any future developer or AI agent has complete visibility into the system's vision, modular architecture, design tokens, and roadmap.
