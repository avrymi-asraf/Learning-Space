export type AssetType =
  | 'md'
  | 'ppx'
  | 'ipynb'
  | 'graph'
  | 'pdf'
  | 'image'
  | 'sound'
  | 'video';

export type CreatableAssetType = 'md' | 'ppx' | 'ipynb' | 'graph' | 'sound';

export interface AssetComment {
  id: string;
  author: string;
  text: string;
  timestampSeconds?: number; // For sound and video assets
  pageNumber?: number;       // For PDF assets
  createdAt: string;
}

export interface LearningAsset {
  id: string;
  title: string;
  type: AssetType;
  content: string;
  extractedText?: string;
  comments: AssetComment[];
  createdAt: string;
  updatedAt: string;
}

// --- Jupyter Notebook (.ipynb) Types ---
export interface NotebookCell {
  id: string;
  type: 'markdown' | 'code';
  language?: 'python' | 'javascript';
  content: string;
  output?: string;
  plotData?: { label: string; x: number; y: number }[];
  plotTitle?: string;
  lastRunAt?: string;
}

export interface NotebookDocument {
  cells: NotebookCell[];
}

// --- Concept Graph (.graph) Types ---
export interface GraphNode {
  id: string;
  label: string;
  category: 'core' | 'equation' | 'experiment' | 'application';
  summary: string;
  linkedAssetId?: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface ConceptGraphDocument {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// --- ModelConfig (Pure Model Invocation Layer — Configured in src/config/modelConfigs.ts) ---
export type ModelProvider =
  | 'gemini'
  | 'openai-compatible'
  | 'anthropic'
  | 'ollama-local'
  | 'custom-http';

export type ModelModality = 'text' | 'audio-tts' | 'image';

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: ModelProvider;
  modelId: string;
  modality: ModelModality;
  settings: {
    temperature: number;
    thinkingLevel?: 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH';
    systemInstruction?: string;
    voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
    secondVoiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
    multiSpeaker?: boolean;
    endpointUrl?: string;
  };
}

// --- Action (Configured directly in code in src/config/actions.ts) ---
export interface ActionParameter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'number';
  defaultValue: string | number;
  options?: string[];
}

export interface ActionRuntimeContext {
  params: Record<string, any>;
  models: {
    list: ModelConfig[];
    call: (
      modelOrIndex: number | string | ModelConfig,
      prompt: string,
      options?: { systemInstruction?: string }
    ) => Promise<{ text: string; audioUrl?: string; modelUsed: string }>;
    callWithFallback: (
      prompt: string,
      options?: { systemInstruction?: string }
    ) => Promise<{ text: string; audioUrl?: string; modelUsed: string }>;
  };
  assets: {
    all: LearningAsset[];
    contextText: string;
    findByName: (name: string) => LearningAsset | undefined;
  };
  tools: {
    log: (message: string) => void;
    createAsset: (spec: {
      title: string;
      type: CreatableAssetType;
      content: string;
      extractedText?: string;
    }) => Promise<LearningAsset>;
    updateAsset: (assetId: string, newContent: string) => Promise<void>;
    sendChatMessage: (markdownText: string) => Promise<void>;
  };
}

export interface LearningAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  outputType: CreatableAssetType | 'chat';
  parameters: ActionParameter[];
  models: ModelConfig[]; // Ordered list of ModelConfigs
  run: (ctx: ActionRuntimeContext) => Promise<void>;
}

// --- Chat & Execution Logs ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'action-log';
  content: string;
  createdAt: string;
  createdAssetId?: string;
  actionName?: string;
}
