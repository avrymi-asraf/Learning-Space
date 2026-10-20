import {
  LearningAction,
  ModelConfig,
  LearningAsset,
  CreatableAssetType,
} from '../types';
import { createSynthesizedStudyWavDataUri } from './defaultData';

export interface ActionExecutionCallbacks {
  onLog: (stepMessage: string) => void;
  onCreateAsset: (assetData: {
    title: string;
    type: CreatableAssetType;
    content: string;
    extractedText?: string;
  }) => Promise<LearningAsset>;
  onUpdateAsset: (assetId: string, newContent: string) => Promise<void>;
  onSendChatMessage: (markdownText: string, createdAssetId?: string) => void;
}

/**
 * Invokes a single Pure ModelConfig via `/api/model/call`.
 */
export async function invokeModelConfig(
  modelConfig: ModelConfig,
  prompt: string,
  overrideSystemInstruction?: string
): Promise<{ text: string; audioUrl?: string; modelUsed: string }> {
  const response = await fetch('/api/model/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelConfig,
      prompt,
      overrideSystemInstruction,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Failed calling model config "${modelConfig.name}"`);
  }

  return {
    text: data.text || '',
    audioUrl: data.audioUrl,
    modelUsed: data.modelUsed || modelConfig.modelId,
  };
}

/**
 * Executes a code-defined `LearningAction` from `src/config/actions.ts`.
 */
export async function executeLearningAction(
  action: LearningAction,
  paramValues: Record<string, any>,
  allAssets: LearningAsset[],
  callbacks: ActionExecutionCallbacks
): Promise<{ createdAsset?: LearningAsset }> {
  const orderedModels = action.models;

  const contextText = allAssets
    .map((a, idx) => {
      const commentSummary =
        a.comments.length > 0
          ? `\nComments:\n` +
            a.comments
              .map(
                (c) =>
                  `- ${
                    c.timestampSeconds != null
                      ? `@${Math.floor(c.timestampSeconds / 60)}:${String(
                          Math.floor(c.timestampSeconds % 60)
                        ).padStart(2, '0')} `
                      : ''
                  }${c.text}`
              )
              .join('\n')
          : '';
      return `[Asset ${idx + 1}: "${a.title}" (${a.type.toUpperCase()})]\n${
        a.extractedText || a.content.slice(0, 3500)
      }${commentSummary}`;
    })
    .join('\n\n---\n\n');

  let lastCreatedAsset: LearningAsset | undefined;

  const modelsApi = {
    list: orderedModels,
    call: async (
      modelOrIndex: number | string | ModelConfig,
      prompt: string,
      options?: { systemInstruction?: string }
    ) => {
      let target: ModelConfig | undefined;
      if (typeof modelOrIndex === 'number') {
        target = orderedModels[modelOrIndex] || orderedModels[0];
      } else if (typeof modelOrIndex === 'string') {
        target =
          orderedModels.find((m) => m.id === modelOrIndex || m.name === modelOrIndex) ||
          orderedModels[0];
      } else if (modelOrIndex && typeof modelOrIndex === 'object') {
        target = modelOrIndex;
      } else {
        target = orderedModels[0];
      }

      if (!target) {
        throw new Error('No ModelConfig available to call.');
      }

      callbacks.onLog(`Calling ${target.name} (${target.modelId})...`);
      try {
        return await invokeModelConfig(target, prompt, options?.systemInstruction);
      } catch (err: any) {
        const fallback = orderedModels.find((m) => m.id !== target!.id);
        if (fallback) {
          callbacks.onLog(`Primary model unavailable; falling back to ${fallback.name}...`);
          return await invokeModelConfig(fallback, prompt, options?.systemInstruction);
        }
        throw err;
      }
    },
    callWithFallback: async (prompt: string, options?: { systemInstruction?: string }) => {
      let lastError: any = null;
      for (let i = 0; i < orderedModels.length; i++) {
        const candidate = orderedModels[i];
        try {
          callbacks.onLog(`Running ${candidate.name} (${candidate.modelId})...`);
          return await invokeModelConfig(candidate, prompt, options?.systemInstruction);
        } catch (err: any) {
          lastError = err;
          callbacks.onLog(`${candidate.name} failed, trying next model in list...`);
        }
      }
      throw lastError || new Error('All ModelConfigs in the Action chain failed.');
    },
  };

  const assetsApi = {
    all: allAssets,
    contextText,
    findByName: (name: string) =>
      allAssets.find((a) => a.title.toLowerCase().includes(name.toLowerCase())),
  };

  const toolsApi = {
    log: (message: string) => {
      callbacks.onLog(message);
    },
    createAsset: async (spec: {
      title: string;
      type: CreatableAssetType;
      content: string;
      extractedText?: string;
    }) => {
      const normalizedType = spec.type.toLowerCase().trim();
      if (normalizedType === 'pdf' || normalizedType === 'video') {
        throw new Error(
          `Actions cannot create "${normalizedType}" assets. Allowed types: md, ppx, ipynb, graph, sound.`
        );
      }
      const validTypes: CreatableAssetType[] = ['md', 'ppx', 'ipynb', 'graph', 'sound'];
      const finalType: CreatableAssetType = validTypes.includes(
        normalizedType as CreatableAssetType
      )
        ? (normalizedType as CreatableAssetType)
        : 'md';

      let finalContent = spec.content || '';
      if (finalType === 'sound' && !finalContent.startsWith('data:audio')) {
        finalContent = createSynthesizedStudyWavDataUri();
      }

      callbacks.onLog(`Creating ${finalType.toUpperCase()} asset: "${spec.title}"...`);
      const created = await callbacks.onCreateAsset({
        title: spec.title,
        type: finalType,
        content: finalContent,
        extractedText: spec.extractedText,
      });
      lastCreatedAsset = created;
      return created;
    },
    updateAsset: async (assetId: string, newContent: string) => {
      await callbacks.onUpdateAsset(assetId, newContent);
    },
    sendChatMessage: async (markdownText: string) => {
      callbacks.onSendChatMessage(markdownText, lastCreatedAsset?.id);
    },
  };

  await action.run({
    params: paramValues,
    models: modelsApi,
    assets: assetsApi,
    tools: toolsApi,
  });

  return { createdAsset: lastCreatedAsset };
}
