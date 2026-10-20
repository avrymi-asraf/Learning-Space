import { LearningAction } from '../types';
import { MODEL_CONFIGS } from './modelConfigs';

/**
 * ============================================================================
 * WORKSPACE ACTIONS — DIRECT CODE CONFIGURATION (`src/config/actions.ts`)
 * ============================================================================
 * Edit this file directly in code to add, customize, or reorder Actions.
 *
 * Every Action has:
 * 1. `parameters`: Simple inputs shown when clicking the Action button.
 * 2. `models`: Ordered list of `ModelConfig` objects (`models[0]`, `models[1]`, ...).
 * 3. `run`: Simple async function that chooses which model to call, runs prompts,
 *    and uses `tools.createAsset(...)` to create `.md`, `.ppx`, `.ipynb`, `.graph`, or `sound` assets.
 *    (Actions never create `.pdf` or `.video` assets.)
 */

export const WORKSPACE_ACTIONS: LearningAction[] = [
  {
    id: 'create-study-guide',
    name: 'Create Study Guide (.md)',
    description: 'Synthesizes study materials into a Markdown guide with LaTeX equations.',
    icon: 'FileText',
    outputType: 'md',
    parameters: [
      {
        name: 'topic',
        label: 'Focus Topic',
        type: 'text',
        defaultValue: 'Core Equations & Physical Intuition',
      },
      {
        name: 'depth',
        label: 'Depth',
        type: 'select',
        defaultValue: 'Deep Derivation',
        options: ['Quick Overview', 'Balanced Guide', 'Deep Derivation'],
      },
    ],
    // Ordered list of ModelConfigs for this action
    models: [MODEL_CONFIGS.deepReasoner, MODEL_CONFIGS.fastTutor, MODEL_CONFIGS.flashLite],
    run: async ({ params, models, assets, tools }) => {
      // Choose model from our ordered list based on the user's parameter
      const selectedModel =
        params.depth === 'Deep Derivation' ? models.list[0] : models.list[1];

      tools.log(`Using ${selectedModel.name} to write study guide...`);

      const prompt = `Create a clear, well-structured Markdown study guide on "${params.topic}" (Depth: ${params.depth}).
Include step-by-step explanations and LaTeX equations ($...$ inline and $$...$$ block).

Workspace Assets Context:
${assets.contextText}`;

      const response = await models.call(selectedModel, prompt);

      await tools.createAsset({
        title: `Study Guide — ${params.topic}.md`,
        type: 'md',
        content: response.text,
      });
    },
  },

  {
    id: 'create-ppx-presentation',
    name: 'Create Presentation & Infographic (.ppx)',
    description: 'Generates an open-source Marp (.ppx) slide deck with inline SVGs, diagrams, images, and math.',
    icon: 'Presentation',
    outputType: 'ppx',
    parameters: [
      {
        name: 'title',
        label: 'Presentation Topic',
        type: 'text',
        defaultValue: 'Quantum Tunneling Visual Breakdown',
      },
      {
        name: 'slides',
        label: 'Slide Count',
        type: 'number',
        defaultValue: 4,
      },
    ],
    models: [MODEL_CONFIGS.fastTutor, MODEL_CONFIGS.deepReasoner],
    run: async ({ params, models, assets, tools }) => {
      tools.log(`Designing ${params.slides}-slide Marp (.ppx) deck with inline SVG graphics...`);

      const prompt = `Create a ${params.slides}-slide presentation about "${params.title}" using standard Marp Markdown + HTML + inline <svg> diagrams.
Start with Marp frontmatter:
---
marp: true
theme: default
paginate: true
---
Separate each slide with \`---\`.
On at least two slides, embed a clean, self-contained inline \`<svg viewBox="0 0 600 180" width="100%" height="160">...</svg>\` infographic or diagram (with labeled boxes, arrows, or wave curves) AND include LaTeX equations ($...$ or $$...$$).

Workspace Assets Context:
${assets.contextText}`;

      // Runs through models.list in order (models.list[0] -> models.list[1])
      const response = await models.callWithFallback(prompt);
      const cleaned = response.text
        .replace(/^```(?:markdown|md|yaml)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      await tools.createAsset({
        title: `Slides — ${params.title}.ppx`,
        type: 'ppx',
        content: cleaned,
      });
    },
  },

  {
    id: 'create-jupyter-notebook',
    name: 'Create Jupyter Notebook (.ipynb)',
    description: 'Builds an interactive notebook with LaTeX explanations and runnable code cells with plots.',
    icon: 'Terminal',
    outputType: 'ipynb',
    parameters: [
      {
        name: 'experiment',
        label: 'Simulation Topic',
        type: 'text',
        defaultValue: 'Barrier Transmission vs Particle Energy',
      },
    ],
    models: [MODEL_CONFIGS.deepReasoner, MODEL_CONFIGS.fastTutor],
    run: async ({ params, models, assets, tools }) => {
      tools.log(`Building runnable Jupyter Notebook for "${params.experiment}"...`);

      const prompt = `Create an interactive Jupyter Notebook (.ipynb JSON format) for "${params.experiment}".
Return ONLY valid JSON matching:
{
  "cells": [
    { "id": "c1", "type": "markdown", "content": "### Title & LaTeX Equations ($...$)" },
    { "id": "c2", "type": "code", "language": "javascript", "content": "// Runnable JS calculation using console.log(...) and plot(xs, ys, 'Plot Title')" }
  ]
}
Ensure code cells use standard JavaScript math and call plot(xs, ys, title) to render an inline chart.

Workspace Assets Context:
${assets.contextText}`;

      const response = await models.callWithFallback(prompt);
      const cleanJson = response.text
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      await tools.createAsset({
        title: `Notebook — ${params.experiment}.ipynb`,
        type: 'ipynb',
        content: cleanJson,
      });
    },
  },

  {
    id: 'create-concept-graph',
    name: 'Create Concept Graph (.graph)',
    description: 'Maps key concepts, formulas, and experiments into an interactive node graph.',
    icon: 'Network',
    outputType: 'graph',
    parameters: [
      {
        name: 'focus',
        label: 'Graph Theme',
        type: 'text',
        defaultValue: 'Quantum Mechanics Concept Map',
      },
    ],
    models: [MODEL_CONFIGS.fastTutor, MODEL_CONFIGS.flashLite],
    run: async ({ params, models, assets, tools }) => {
      tools.log(`Extracting concept graph for "${params.focus}"...`);

      const prompt = `Create a concept graph for "${params.focus}" based on the workspace assets.
Return ONLY valid JSON matching:
{
  "nodes": [
    { "id": "n1", "label": "Concept", "category": "core", "summary": "Short explanation", "x": 320, "y": 180 }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2", "label": "connects to" }
  ]
}
Categories: "core", "equation", "experiment", "application". Space x in [120..580] and y in [80..360].

Workspace Assets Context:
${assets.contextText}`;

      const response = await models.callWithFallback(prompt);
      const cleanJson = response.text
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      await tools.createAsset({
        title: `Graph — ${params.focus}.graph`,
        type: 'graph',
        content: cleanJson,
      });
    },
  },

  {
    id: 'create-audio-overview',
    name: 'Create Audio Overview (.wav)',
    description: 'Synthesizes a 2-host spoken podcast episode from your study materials.',
    icon: 'Headphones',
    outputType: 'sound',
    parameters: [
      {
        name: 'focus',
        label: 'Episode Focus',
        type: 'text',
        defaultValue: 'Intuition Behind Wavefunctions & Tunneling',
      },
    ],
    models: [MODEL_CONFIGS.podcastVoice, MODEL_CONFIGS.fastTutor],
    run: async ({ params, models, assets, tools }) => {
      tools.log(`Synthesizing spoken audio overview with ${models.list[0].name}...`);

      const prompt = `Episode Focus: ${params.focus}\n\nKey Study Material:\n${assets.contextText.slice(
        0,
        1500
      )}`;
      const response = await models.call(0, prompt);

      await tools.createAsset({
        title: `Audio — ${params.focus}.wav`,
        type: 'sound',
        content: response.audioUrl || '',
        extractedText: response.text,
      });
    },
  },
];
