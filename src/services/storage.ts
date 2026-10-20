import { LearningAsset, ChatMessage } from '../types';
import { DEFAULT_ASSETS } from './defaultData';

const DB_NAME = 'learning_space_db_v2';
const DB_VERSION = 1;
const STORE_NAME = 'workspace_state';

export interface WorkspaceStateSnapshot {
  assets: LearningAsset[];
  chatMessages: ChatMessage[];
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadWorkspaceState(): Promise<WorkspaceStateSnapshot> {
  try {
    const db = await openDatabase();
    return await new Promise<WorkspaceStateSnapshot>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('current_workspace');
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.assets) && req.result.assets.length > 0) {
          resolve(req.result as WorkspaceStateSnapshot);
        } else {
          resolve(getInitialSnapshot());
        }
      };
      req.onerror = () => resolve(getInitialSnapshot());
    });
  } catch {
    return getInitialSnapshot();
  }
}

export async function saveWorkspaceState(snapshot: WorkspaceStateSnapshot): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(snapshot, 'current_workspace');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
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
