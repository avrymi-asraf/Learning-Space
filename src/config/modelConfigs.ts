import { ModelConfig } from '../types';

/**
 * ============================================================================
 * MODEL CONFIGS — DIRECT CODE CONFIGURATION (`src/config/modelConfigs.ts`)
 * ============================================================================
 * Edit this file directly to add or modify AI Model Configurations.
 *
 * Architectural Rule:
 * - A `ModelConfig` is ONLY for calling a model (Gemini or any external/local model).
 * - Model selection and workflow logic belong in `src/config/actions.ts`.
 */

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  /**
   * 1. Fast Gemini Text & Presentation Model
   */
  fastTutor: {
    id: 'fastTutor',
    name: 'Gemini 3.8 Flash (Fast)',
    description: 'Fast, low-latency model for summaries, Marp slides, and concept graphs.',
    provider: 'gemini',
    modelId: 'gemini-3.8-flash',
    modality: 'text',
    settings: {
      temperature: 0.5,
      thinkingLevel: 'LOW',
      systemInstruction:
        'You are a clear, visual academic educator. Use clean Markdown, inline SVGs where helpful, and LaTeX math ($...$ and $$...$$).',
    },
  },

  /**
   * 2. Deep Reasoning Model for Math, Physics & Code
   */
  deepReasoner: {
    id: 'deepReasoner',
    name: 'Gemini 3.8 Flash (High Reasoning)',
    description: 'High thinking-depth configuration for mathematical derivations and runnable Jupyter code.',
    provider: 'gemini',
    modelId: 'gemini-3.8-flash',
    modality: 'text',
    settings: {
      temperature: 0.3,
      thinkingLevel: 'HIGH',
      systemInstruction:
        'You are a rigorous STEM professor. Verify all equations, derivations, and simulation code step by step.',
    },
  },

  /**
   * 3. Lightweight Fallback Model
   */
  flashLite: {
    id: 'flashLite',
    name: 'Gemini 3.1 Flash Lite',
    description: 'Ultra-fast backup model for fallback chains.',
    provider: 'gemini',
    modelId: 'gemini-3.1-flash-lite',
    modality: 'text',
    settings: {
      temperature: 0.5,
      thinkingLevel: 'MINIMAL',
      systemInstruction: 'Provide concise, accurate educational explanations.',
    },
  },

  /**
   * 4. Dual-Host Podcast Audio TTS Model (.wav output)
   */
  podcastVoice: {
    id: 'podcastVoice',
    name: 'Gemini 3.8 Dual-Host TTS',
    description: 'Synthesizes two-speaker educational audio discussions (.wav) with Alex & Sam.',
    provider: 'gemini',
    modelId: 'gemini-3.8-flash-tts',
    modality: 'audio-tts',
    settings: {
      temperature: 0.7,
      voiceName: 'Kore',
      secondVoiceName: 'Puck',
      multiSpeaker: true,
    },
  },

  /**
   * 5. Example External / Local Model Config (e.g. Ollama / OpenAI-compatible)
   * To use a local or external model, set `provider` and `settings.endpointUrl`.
   */
  localOllama: {
    id: 'localOllama',
    name: 'Local Ollama (Llama 3.2)',
    description: 'Calls a local or custom OpenAI-compatible HTTP endpoint.',
    provider: 'ollama-local',
    modelId: 'llama3.2:latest',
    modality: 'text',
    settings: {
      temperature: 0.6,
      endpointUrl: '', // e.g. 'http://localhost:11434/v1/chat/completions'
      systemInstruction: 'You are a helpful local study assistant.',
    },
  },
};

export const MODEL_CONFIG_LIST: ModelConfig[] = Object.values(MODEL_CONFIGS);
