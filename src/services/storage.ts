import { get, set } from 'idb-keyval';
import { LearningAsset, ChatMessage } from '../types';
import { DEFAULT_ASSETS } from './defaultData';

const STORAGE_KEY = 'learning_space_workspace_v3';

export interface WorkspaceStateSnapshot {
  assets: LearningAsset[];
  chatMessages: ChatMessage[];
}

export async function loadWorkspaceState(): Promise<WorkspaceStateSnapshot> {
  try {
    const saved = await get<WorkspaceStateSnapshot>(STORAGE_KEY);
    if (saved && Array.isArray(saved.assets) && saved.assets.length > 0) {
      return saved;
    }
  } catch (err) {
    console.warn('IndexedDB read fallback:', err);
  }
  return getInitialSnapshot();
}

export async function saveWorkspaceState(snapshot: WorkspaceStateSnapshot): Promise<void> {
  try {
    await set(STORAGE_KEY, snapshot);
  } catch (err) {
    console.warn('IndexedDB save fallback:', err);
  }
}

export function getInitialSnapshot(): WorkspaceStateSnapshot {
  return {
    assets: DEFAULT_ASSETS,
    chatMessages: [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Welcome to **Learning Space**. Select any asset on the left to view, edit, or comment on it in the center, chat or start a **Live Voice** session right here, or trigger any **Action** button on the right.`,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
