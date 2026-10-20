import React, { useState, useEffect } from 'react';
import {
  LearningAsset,
  AssetType,
  CreatableAssetType,
  LearningAction,
  ChatMessage,
} from './types';
import {
  loadWorkspaceState,
  saveWorkspaceState,
} from './services/storage';
import { executeLearningAction } from './services/actionRunner';
import {
  createSynthesizedStudyWavDataUri,
  createQuantumDiagramSvgDataUri,
} from './services/defaultData';
import { WORKSPACE_ACTIONS } from './config/actions';
import { AssetStage } from './components/AssetEditors';
import { ChatAndLivePanel } from './components/ChatAndLivePanel';
import {
  Plus,
  Trash2,
  Upload,
  X,
  Play,
  FileText,
  Presentation,
  Terminal,
  Network,
  Image as ImageIcon,
  Headphones,
  Video,
  FileSpreadsheet,
  Columns,
  MessageSquare,
  Edit3,
} from 'lucide-react';

type CenterViewMode = 'split' | 'asset' | 'chat';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  md: 'Markdown',
  ppx: 'Presentation (.ppx)',
  ipynb: 'Notebook',
  graph: 'Graph',
  pdf: 'PDF',
  image: 'Picture',
  sound: 'Sound',
  video: 'Video',
};

export default function App() {
  const [assets, setAssets] = useState<LearningAsset[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string>('');
  const [centerMode, setCenterMode] = useState<CenterViewMode>('split');
  const [isLoaded, setIsLoaded] = useState(false);

  // Add Asset Modal State
  const [showNewAssetModal, setShowNewAssetModal] = useState(false);
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetType, setNewAssetType] = useState<AssetType>('md');

  // Run Action Modal State
  const [pendingAction, setPendingAction] = useState<LearningAction | null>(null);
  const [actionParamValues, setActionParamValues] = useState<Record<string, any>>({});
  const [runningActionStatus, setRunningActionStatus] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceState().then((snap) => {
      setAssets(snap.assets);
      setChatMessages(snap.chatMessages);
      setActiveAssetId(snap.assets[0]?.id || '');
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspaceState({
      assets,
      chatMessages,
    });
  }, [assets, chatMessages, isLoaded]);

  const activeAsset =
    assets.find((a) => a.id === activeAssetId) || assets[0] || null;

  const handleUpdateAssetContent = (assetId: string, newContent: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, content: newContent, updatedAt: new Date().toISOString() }
          : a
      )
    );
  };

  const handleAddComment = (
    assetId: string,
    text: string,
    extra?: { timestampSeconds?: number; pageNumber?: number }
  ) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              comments: [
                ...a.comments,
                {
                  id: `c-${Date.now()}`,
                  author: 'Learner',
                  text,
                  timestampSeconds: extra?.timestampSeconds,
                  pageNumber: extra?.pageNumber,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : a
      )
    );
  };

  const handleDeleteComment = (assetId: string, commentId: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, comments: a.comments.filter((c) => c.id !== commentId) }
          : a
      )
    );
  };

  const handleCreateManualAsset = () => {
    const title =
      newAssetTitle.trim() || `Untitled ${ASSET_TYPE_LABELS[newAssetType]}`;
    const defaultContents: Record<AssetType, string> = {
      md: `# ${title}\n\nWrite study notes with Markdown and LaTeX equations:\n\n$$E = \\hbar \\omega$$\n\n- Key point 1\n- Key point 2`,
      ppx: `---\nmarp: true\ntheme: default\npaginate: true\n---\n\n# ${title}\n\n$$\\hat{H}\\Psi = E\\Psi$$\n\n- Add pictures, inline \`<svg>\` diagrams, and equations.`,
      ipynb: JSON.stringify(
        {
          cells: [
            {
              id: `c-${Date.now()}-1`,
              type: 'markdown',
              content: `### ${title}\nInteractive calculation cell:`,
            },
            {
              id: `c-${Date.now()}-2`,
              type: 'code',
              language: 'javascript',
              content: `const xs = [1, 2, 3, 4, 5];\nconst ys = xs.map(x => x * 2.5);\nconsole.log("Values:", ys);\nplot(xs, ys, "${title}");`,
            },
          ],
        },
        null,
        2
      ),
      graph: JSON.stringify(
        {
          nodes: [
            {
              id: 'n1',
              label: title,
              category: 'core',
              summary: 'Central concept node.',
              x: 300,
              y: 180,
            },
          ],
          edges: [],
        },
        null,
        2
      ),
      pdf: JSON.stringify([
        {
          page: 1,
          heading: `${title} — Page 1`,
          body: 'Source PDF document page content.',
        },
      ]),
      image: createQuantumDiagramSvgDataUri(),
      sound: createSynthesizedStudyWavDataUri(),
      video: 'interactive-wavepacket-simulation',
    };

    const created: LearningAsset = {
      id: `asset-${Date.now()}`,
      title,
      type: newAssetType,
      content: defaultContents[newAssetType],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAssets((prev) => [created, ...prev]);
    setActiveAssetId(created.id);
    setShowNewAssetModal(false);
    setNewAssetTitle('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const reader = new FileReader();
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'svg' || ext === 'webp') {
      reader.onload = () => {
        const created: LearningAsset = {
          id: `asset-${Date.now()}`,
          title: file.name,
          type: 'image',
          content: String(reader.result || ''),
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAssets((prev) => [created, ...prev]);
        setActiveAssetId(created.id);
        setShowNewAssetModal(false);
      };
      reader.readAsDataURL(file);
    } else if (ext === 'wav' || ext === 'mp3' || ext === 'ogg') {
      reader.onload = () => {
        const created: LearningAsset = {
          id: `asset-${Date.now()}`,
          title: file.name,
          type: 'sound',
          content: String(reader.result || ''),
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAssets((prev) => [created, ...prev]);
        setActiveAssetId(created.id);
        setShowNewAssetModal(false);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = String(reader.result || '');
        const typeMap: Record<string, AssetType> = {
          md: 'md',
          ppx: 'ppx',
          ipynb: 'ipynb',
          graph: 'graph',
          pdf: 'pdf',
        };
        const chosenType = typeMap[ext] || 'md';
        const created: LearningAsset = {
          id: `asset-${Date.now()}`,
          title: file.name,
          type: chosenType,
          content:
            chosenType === 'pdf'
              ? JSON.stringify([{ page: 1, heading: file.name, body: text.slice(0, 4000) }])
              : text,
          extractedText: text.slice(0, 4000),
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAssets((prev) => [created, ...prev]);
        setActiveAssetId(created.id);
        setShowNewAssetModal(false);
      };
      reader.readAsText(file);
    }
  };

  const openActionLauncher = (action: LearningAction) => {
    const defaults: Record<string, any> = {};
    for (const p of action.parameters) {
      defaults[p.name] = p.defaultValue;
    }
    setActionParamValues(defaults);
    setPendingAction(action);
  };

  const confirmAndRunAction = async () => {
    if (!pendingAction) return;
    const actionToRun = pendingAction;
    const paramsToUse = { ...actionParamValues };
    setPendingAction(null);
    setRunningActionStatus(`Running "${actionToRun.name}"...`);

    try {
      const result = await executeLearningAction(
        actionToRun,
        paramsToUse,
        assets,
        {
          onLog: (msg) => setRunningActionStatus(msg),
          onCreateAsset: async (spec) => {
            const newAsset: LearningAsset = {
              id: `asset-${Date.now()}`,
              title: spec.title,
              type: spec.type as CreatableAssetType,
              content: spec.content,
              extractedText: spec.extractedText,
              comments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setAssets((prev) => [newAsset, ...prev]);
            setActiveAssetId(newAsset.id);
            return newAsset;
          },
          onUpdateAsset: async (assetId, newContent) => {
            handleUpdateAssetContent(assetId, newContent);
          },
          onSendChatMessage: (markdownText, createdAssetId) => {
            setChatMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: markdownText,
                createdAssetId,
                createdAt: new Date().toISOString(),
              },
            ]);
          },
        }
      );

      if (result.createdAsset) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg-act-${Date.now()}`,
            role: 'action-log',
            content: `Created **${result.createdAsset!.title}** via **${actionToRun.name}**.`,
            createdAssetId: result.createdAsset!.id,
            actionName: actionToRun.name,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `Action error: \`${err.message}\``,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setRunningActionStatus(null);
    }
  };

  const handleSendChatMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [...chatMessages, userMsg];
    setChatMessages(nextHistory);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory,
          contextAssets: assets,
          availableActions: WORKSPACE_ACTIONS.map((a) => ({
            id: a.id,
            name: a.name,
            outputType: a.outputType,
            description: a.description,
          })),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-a-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'No response received.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-e-${Date.now()}`,
          role: 'assistant',
          content: `Connection error: ${err.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'md':
        return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'ppx':
        return <Presentation className="w-4 h-4 text-indigo-600 shrink-0" />;
      case 'ipynb':
        return <Terminal className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'graph':
        return <Network className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'pdf':
        return <FileSpreadsheet className="w-4 h-4 text-red-600 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />;
      case 'sound':
        return <Headphones className="w-4 h-4 text-teal-600 shrink-0" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-600 shrink-0" />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] overflow-hidden">
      {/* =====================================================================
          SINGLE-PAGE HEADER
         ===================================================================== */}
      <header className="flex items-center justify-between gap-8 px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Learning Space
        </span>

        {/* Center view switcher: Asset Editor + Chat Split / Asset Only / Chat Only */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setCenterMode('split')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              centerMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Asset & Chat
          </button>
          <button
            onClick={() => setCenterMode('asset')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              centerMode === 'asset'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Asset View
          </button>
          <button
            onClick={() => setCenterMode('chat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              centerMode === 'chat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat View
          </button>
        </div>

        <button
          onClick={() => setShowNewAssetModal(true)}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
        >
          + Add Asset
        </button>
      </header>

      {/* =====================================================================
          ONE-PAGE 3-COLUMN LAYOUT:
          1. Left: Assets
          2. Center: Edit/View Asset & Chat
          3. Right: Actions as Buttons
         ===================================================================== */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* 1. LEFT SIDEBAR: ASSETS (No checkboxes, no asset count) */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900">Assets</h2>
            <button
              onClick={() => setShowNewAssetModal(true)}
              className="p-1 text-slate-500 hover:text-blue-600 rounded"
              title="Add Asset"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {assets.map((item) => {
              const isSelected = activeAsset?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveAssetId(item.id);
                    if (centerMode === 'chat') setCenterMode('split');
                  }}
                  className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getAssetIcon(item.type)}
                    <div className="min-w-0">
                      <div className="font-display text-xs font-semibold text-slate-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ASSET_TYPE_LABELS[item.type]}
                      </div>
                    </div>
                  </div>

                  {assets.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = assets.filter((a) => a.id !== item.id);
                        setAssets(next);
                        if (activeAssetId === item.id) {
                          setActiveAssetId(next[0]?.id || '');
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 shrink-0"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* 2. CENTER: EDIT/VIEW ASSETS & CHAT */}
        <main className="flex-1 min-w-0 h-full overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {(centerMode === 'split' || centerMode === 'asset') && activeAsset && (
            <div
              className={`${
                centerMode === 'split'
                  ? 'lg:col-span-7 border-r border-slate-200'
                  : 'lg:col-span-12'
              } h-full min-h-0 overflow-hidden flex flex-col`}
            >
              <AssetStage
                asset={activeAsset}
                allAssets={assets}
                onUpdateAssetContent={handleUpdateAssetContent}
                onAddComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
                onSelectAsset={(id) => setActiveAssetId(id)}
              />
            </div>
          )}

          {(centerMode === 'split' || centerMode === 'chat') && (
            <div
              className={`${
                centerMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
              } h-full min-h-0 overflow-hidden flex flex-col`}
            >
              <ChatAndLivePanel
                messages={chatMessages}
                assets={assets}
                runningActionStatus={runningActionStatus}
                onSendMessage={handleSendChatMessage}
                onOpenAsset={(id) => {
                  setActiveAssetId(id);
                  if (centerMode === 'chat') setCenterMode('split');
                }}
              />
            </div>
          )}
        </main>

        {/* 3. RIGHT SIDEBAR: ACTIONS AS BUTTONS */}
        <aside className="w-64 border-l border-slate-200 bg-white flex flex-col h-full shrink-0">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="font-display text-sm font-bold text-slate-900">Actions</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {WORKSPACE_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => openActionLauncher(action)}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-400 transition-all group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                    {action.name}
                  </span>
                  <Play className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* =====================================================================
          MODAL 1: ADD ASSET
         ===================================================================== */}
      {showNewAssetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">
                Add Asset
              </h3>
              <button
                onClick={() => setShowNewAssetModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newAssetTitle}
                  onChange={(e) => setNewAssetTitle(e.target.value)}
                  placeholder="Asset title..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  value={newAssetType}
                  onChange={(e) => setNewAssetType(e.target.value as AssetType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="md">Markdown (.md)</option>
                  <option value="ppx">Presentation (.ppx — Marp + SVG + Pictures)</option>
                  <option value="ipynb">Jupyter Notebook (.ipynb)</option>
                  <option value="graph">Graph (.graph)</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="image">Picture (.png)</option>
                  <option value="sound">Sound (.wav)</option>
                  <option value="video">Video (.mp4)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-500 hover:text-blue-600 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewAssetModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualAsset}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: RUN ACTION PARAMETERS
         ===================================================================== */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900">
                {pendingAction.name}
              </h3>
              <button
                onClick={() => setPendingAction(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">{pendingAction.description}</p>

            {pendingAction.parameters.length > 0 && (
              <div className="space-y-3">
                {pendingAction.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {param.label}
                    </label>
                    {param.type === 'select' && param.options ? (
                      <select
                        value={String(actionParamValues[param.name] ?? param.defaultValue)}
                        onChange={(e) =>
                          setActionParamValues((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      >
                        {param.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        value={String(actionParamValues[param.name] ?? param.defaultValue)}
                        onChange={(e) =>
                          setActionParamValues((prev) => ({
                            ...prev,
                            [param.name]:
                              param.type === 'number'
                                ? Number(e.target.value)
                                : e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndRunAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Play className="w-3.5 h-3.5" />
                Run Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
