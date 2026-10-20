# Learning Space — Visual & Interaction Design (`Design.md`)

> **Target Audience for this Document**: AI Coding Agents and UI Engineers. (Never rendered in the user-facing UI.)

---

## 1. Single-Page Layout Structure

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Learning Space                     [Asset & Chat | Asset View | Chat View] + Add │
├──────────────────┬────────────────────────────────────────────┬──────────────────┤
│      ASSETS      │         CENTER: EDIT ASSET & CHAT          │     ACTIONS      │
│   (Left Side)    │                                            │   (Right Side)   │
│                  │  ┌──────────────────┬───────────────────┐  │                  │
│ • Markdown (.md) │  │ Active Asset     │ Chat & Live Voice │  │ [Create Study    │
│ • Slides (.ppx)  │  │ Viewer / Editor  │ Tutor             │  │  Guide (.md)]    │
│ • Notebook       │  │ (.md, .ppx Marp  │                   │  │                  │
│ • Graph          │  │  + SVG + Images, │                   │  │ [Create Slides   │
│ • PDF            │  │  .ipynb, .graph, │                   │  │  (.ppx)]         │
│ • Picture        │  │  .pdf, picture,  │                   │  │                  │
│ • Sound          │  │  sound/video w/  │                   │  │ [Create Notebook │
│ • Video          │  │  @MM:SS notes)   │                   │  │  (.ipynb)]       │
│                  │  └──────────────────┴───────────────────┘  │                  │
└──────────────────┴────────────────────────────────────────────┴──────────────────┘
```

- **No Asset Checkboxes or Counts**: The Assets list is clean and minimal — clicking an item opens it in the center editor.
- **Code-Driven Actions & Model Configs**: Actions are triggered via buttons on the right and edited directly in `src/config/actions.ts` and `src/config/modelConfigs.ts`.
