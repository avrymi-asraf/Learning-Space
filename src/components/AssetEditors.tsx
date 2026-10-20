import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  LearningAsset,
  NotebookDocument,
  NotebookCell,
  ConceptGraphDocument,
  GraphNode,
} from '../types';
import { MarkdownView } from '../utils/mathRenderer';
import {
  renderMarpDeck,
  joinMarpSlides,
  MARP_INSERT_TEMPLATES,
} from '../utils/ppxFormat';
import {
  Columns,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Play,
  Pause,
  MessageSquarePlus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Code2,
  Link2,
  FileText,
  Sigma,
  Image as ImageIcon,
  Shapes,
} from 'lucide-react';

interface AssetStageProps {
  asset: LearningAsset;
  allAssets: LearningAsset[];
  onUpdateAssetContent: (assetId: string, newContent: string) => void;
  onAddComment: (
    assetId: string,
    text: string,
    extra?: { timestampSeconds?: number; pageNumber?: number }
  ) => void;
  onDeleteComment: (assetId: string, commentId: string) => void;
  onSelectAsset: (assetId: string) => void;
}

export const AssetStage: React.FC<AssetStageProps> = ({
  asset,
  allAssets,
  onUpdateAssetContent,
  onAddComment,
  onDeleteComment,
  onSelectAsset,
}) => {
  switch (asset.type) {
    case 'md':
      return (
        <MarkdownEquationStudio
          asset={asset}
          onUpdate={(c) => onUpdateAssetContent(asset.id, c)}
          onAddComment={(txt) => onAddComment(asset.id, txt)}
          onDeleteComment={(cid) => onDeleteComment(asset.id, cid)}
        />
      );
    case 'ppx':
      return (
        <MarpPresentationStudio
          asset={asset}
          allAssets={allAssets}
          onUpdate={(c) => onUpdateAssetContent(asset.id, c)}
        />
      );
    case 'ipynb':
      return (
        <JupyterNotebookStudio
          asset={asset}
          onUpdate={(c) => onUpdateAssetContent(asset.id, c)}
        />
      );
    case 'graph':
      return (
        <ConceptGraphStudio
          asset={asset}
          allAssets={allAssets}
          onUpdate={(c) => onUpdateAssetContent(asset.id, c)}
          onSelectAsset={onSelectAsset}
        />
      );
    case 'pdf':
      return (
        <PdfDocumentViewer
          asset={asset}
          onAddComment={(txt, page) => onAddComment(asset.id, txt, { pageNumber: page })}
          onDeleteComment={(cid) => onDeleteComment(asset.id, cid)}
        />
      );
    case 'image':
      return (
        <ImageAssetViewer
          asset={asset}
          onAddComment={(txt) => onAddComment(asset.id, txt)}
          onDeleteComment={(cid) => onDeleteComment(asset.id, cid)}
        />
      );
    case 'sound':
    case 'video':
      return (
        <MediaTimelineCommentStudio
          asset={asset}
          onAddTimestampComment={(txt, sec) =>
            onAddComment(asset.id, txt, { timestampSeconds: sec })
          }
          onDeleteComment={(cid) => onDeleteComment(asset.id, cid)}
        />
      );
    default:
      return null;
  }
};

// ============================================================================
// 1. MARKDOWN + LATEX EQUATION STUDIO (.md) — Powered by react-markdown + KaTeX
// ============================================================================
const EQUATION_SNIPPETS = [
  { label: 'Inline $...$', snippet: '$E = \\hbar \\omega$' },
  { label: 'Block $$...$$', snippet: '\n$$\\int_{-\\infty}^{\\infty} |\\Psi(x,t)|^2 \\, dx = 1$$\n' },
  { label: 'Fraction', snippet: '\\frac{\\partial \\Psi}{\\partial t}' },
  { label: 'Integral', snippet: '\\int_{a}^{b} f(x) \\, dx' },
  { label: 'Summation', snippet: '\\sum_{n=1}^{\\infty} c_n \\psi_n(x)' },
  { label: 'Matrix', snippet: '\\begin{pmatrix} \\alpha & \\beta \\\\ \\gamma & \\delta \\end{pmatrix}' },
];

const MarkdownEquationStudio: React.FC<{
  asset: LearningAsset;
  onUpdate: (content: string) => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
}> = ({ asset, onUpdate, onAddComment, onDeleteComment }) => {
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onUpdate(asset.content + ' ' + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = asset.content.slice(0, start) + snippet + asset.content.slice(end);
    onUpdate(next);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    }, 20);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 mr-1 whitespace-nowrap shrink-0">
            <Sigma className="w-3.5 h-3.5 text-blue-600" />
            Math:
          </span>
          {EQUATION_SNIPPETS.map((item) => (
            <button
              key={item.label}
              onClick={() => insertSnippet(item.snippet)}
              className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:border-blue-400 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg shrink-0">
          <button
            onClick={() => setViewMode('edit')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'edit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'split'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3 h-3" />
            Split
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'lg:col-span-6 border-r border-slate-200' : 'lg:col-span-12'
            } flex flex-col h-full min-h-0`}
          >
            <textarea
              ref={textareaRef}
              value={asset.content}
              onChange={(e) => onUpdate(e.target.value)}
              placeholder="Write study notes with Markdown and LaTeX equations ($E = mc^2$)..."
              className="flex-1 w-full p-5 font-mono text-sm text-slate-800 leading-relaxed resize-none focus:outline-none bg-slate-50/30"
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'
            } flex flex-col h-full min-h-0 overflow-y-auto px-6 py-5`}
          >
            <div className="max-w-[68ch] mx-auto w-full">
              <MarkdownView content={asset.content} />
            </div>

            <div className="max-w-[68ch] mx-auto w-full mt-8 pt-5 border-t border-slate-200">
              <h4 className="font-display text-xs font-semibold text-slate-500 mb-2.5">
                Notes
              </h4>
              <div className="space-y-2 mb-3">
                {asset.comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <span>{c.text}</span>
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      className="text-slate-400 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      onAddComment(commentText.trim());
                      setCommentText('');
                    }
                  }}
                  placeholder="Add a note..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    if (commentText.trim()) {
                      onAddComment(commentText.trim());
                      setCommentText('');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap shrink-0"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 2. OPEN-SOURCE MARP (.PPX) PRESENTATION STUDIO — Powered by @marp-team/marp-core
// ============================================================================
const MarpPresentationStudio: React.FC<{
  asset: LearningAsset;
  allAssets: LearningAsset[];
  onUpdate: (content: string) => void;
}> = ({ asset, allAssets, onUpdate }) => {
  const deck = renderMarpDeck(asset.content);
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'split' | 'present'>('split');

  const safeIdx = Math.min(activeIdx, Math.max(0, deck.rawSlides.length - 1));
  const currentSlideMarkdown = deck.rawSlides[safeIdx] || '';
  const currentSlideRenderedSvg = deck.slidesHtml[safeIdx] || '';

  const pictureAssets = allAssets.filter((a) => a.type === 'image');

  const updateCurrentSlideMarkdown = (newSlideMd: string) => {
    const nextSlides = deck.rawSlides.map((s, idx) =>
      idx === safeIdx ? newSlideMd : s
    );
    onUpdate(joinMarpSlides(deck.frontmatter, nextSlides));
  };

  const appendToCurrentSlide = (snippet: string) => {
    updateCurrentSlideMarkdown(`${currentSlideMarkdown.trim()}\n\n${snippet}`);
  };

  const addNewSlide = () => {
    const nextSlides = [
      ...deck.rawSlides,
      `# New Slide ${deck.rawSlides.length + 1}\n\n- Add text, pictures, inline \`<svg>\` diagrams, or equations ($E = mc^2$).`,
    ];
    onUpdate(joinMarpSlides(deck.frontmatter, nextSlides));
    setActiveIdx(nextSlides.length - 1);
  };

  const deleteCurrentSlide = () => {
    if (deck.rawSlides.length <= 1) return;
    const nextSlides = deck.rawSlides.filter((_, idx) => idx !== safeIdx);
    onUpdate(joinMarpSlides(deck.frontmatter, nextSlides));
    setActiveIdx(Math.max(0, safeIdx - 1));
  };

  const handleUploadPictureIntoSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      appendToCurrentSlide(`![w:420](${dataUrl})`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <style dangerouslySetInnerHTML={{ __html: deck.css }} />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => appendToCurrentSlide(MARP_INSERT_TEMPLATES.svgFlowchart)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Shapes className="w-3.5 h-3.5 text-blue-600" />
            + SVG Diagram
          </button>

          <button
            onClick={() => appendToCurrentSlide(MARP_INSERT_TEMPLATES.svgChart)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Shapes className="w-3.5 h-3.5 text-emerald-600" />
            + SVG Bar Chart
          </button>

          <button
            onClick={() => appendToCurrentSlide(MARP_INSERT_TEMPLATES.twoColumnGrid)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Columns className="w-3.5 h-3.5 text-indigo-600" />
            + 2-Column Layout
          </button>

          {pictureAssets.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                const pic = pictureAssets.find((p) => p.id === e.target.value);
                if (pic) {
                  appendToCurrentSlide(`![w:440](${pic.content})`);
                }
                e.target.value = '';
              }}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
            >
              <option value="" disabled>
                + Insert Workspace Picture...
              </option>
              {pictureAssets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-md cursor-pointer transition-colors whitespace-nowrap shrink-0">
            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
            + Upload Picture
            <input
              type="file"
              accept="image/*,.svg"
              onChange={handleUploadPictureIntoSlide}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={addNewSlide}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            New Slide
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'present' : 'split')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'present'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200/80 text-slate-700 hover:text-slate-900'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            {viewMode === 'present' ? 'Exit Present' : 'Present'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="w-40 border-r border-slate-200 bg-white flex flex-col p-2.5 gap-2 overflow-y-auto shrink-0">
          {deck.slidesHtml.map((svgHtml, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`group text-left p-2 rounded-lg border transition-all ${
                idx === safeIdx
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 mb-1">
                SLIDE {idx + 1}
              </div>
              <div
                className="w-full aspect-video rounded overflow-hidden border border-slate-200 bg-white pointer-events-none"
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </button>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-0 overflow-hidden">
          <div
            className={`${
              viewMode === 'present' ? 'xl:col-span-12' : 'xl:col-span-7'
            } flex flex-col items-center justify-between p-5 bg-slate-100/80 overflow-y-auto`}
          >
            <div className="w-full max-w-3xl my-auto">
              <div
                className="w-full aspect-video bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentSlideRenderedSvg }}
              />
            </div>

            <div className="w-full max-w-3xl mt-4 flex items-center justify-between">
              <button
                disabled={safeIdx === 0}
                onClick={() => setActiveIdx(Math.max(0, safeIdx - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  Slide {safeIdx + 1} of {deck.rawSlides.length}
                </span>
                {deck.rawSlides.length > 1 && (
                  <button
                    onClick={deleteCurrentSlide}
                    className="text-xs text-slate-400 hover:text-red-600 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
              <button
                disabled={safeIdx >= deck.rawSlides.length - 1}
                onClick={() =>
                  setActiveIdx(Math.min(deck.rawSlides.length - 1, safeIdx + 1))
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {viewMode === 'split' && (
            <div className="xl:col-span-5 border-l border-slate-200 bg-white flex flex-col h-full min-h-0">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-500">
                SLIDE {safeIdx + 1} SOURCE (Marp Markdown + &lt;svg&gt; + Pictures)
              </div>
              <textarea
                value={currentSlideMarkdown}
                onChange={(e) => updateCurrentSlideMarkdown(e.target.value)}
                placeholder="Write Markdown, paste <svg>...</svg>, add pictures ![w:400](...), or LaTeX $$...$$"
                className="flex-1 w-full p-4 font-mono text-xs text-slate-800 leading-relaxed resize-none focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. JUPYTER NOTEBOOK STUDIO (.ipynb)
// ============================================================================
function executeNotebookCellCode(code: string): {
  output: string;
  plotTitle?: string;
  plotData?: { label: string; x: number; y: number }[];
} {
  const logs: string[] = [];
  let plotTitle: string | undefined;
  let plotData: { label: string; x: number; y: number }[] | undefined;

  const plotHelper = (xs: any[], ys: any[], title?: string) => {
    if (Array.isArray(xs) && Array.isArray(ys)) {
      plotTitle = title || 'Notebook Output Plot';
      plotData = xs.map((xVal, i) => ({
        label: String(xVal),
        x: Number(xVal) || i,
        y: Number(ys[i]) || 0,
      }));
    }
  };

  let jsCode = code;
  const looksLikePython =
    code.includes('for ') && code.includes(' in ') && code.includes(':') && !code.includes('function');

  if (looksLikePython) {
    jsCode = jsCode
      .replace(/^#(.*)$/gm, '//$1')
      .replace(/\bprint\s*\(/g, 'console.log(')
      .replace(/f"([^"]*)"/g, (_m, inner) => '`' + inner.replace(/\{([^}]+)\}/g, '${$1}') + '`')
      .replace(/\[([^\]]+)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)\]/g, (_m, expr, v, arr) => {
        return `${arr}.map(${v} => ${expr})`;
      })
      .replace(/for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)\s*:\s*\n((?:[ \t]+.+\n?)+)/g, (_m, v, arr, body) => {
        const cleanBody = body
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean)
          .join(';\n');
        return `for (const ${v} of ${arr}) {\n${cleanBody}\n}\n`;
      });
  }

  try {
    const customConsole = {
      log: (...args: any[]) =>
        logs.push(
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ')
        ),
    };
    const roundFn = (val: number, decimals = 2) => Number(val.toFixed(decimals));
    const rangeFn = (n: number) => Array.from({ length: n }, (_, i) => i);

    const fn = new Function('console', 'plot', 'round', 'range', 'Math', jsCode);
    const result = fn(customConsole, plotHelper, roundFn, rangeFn, Math);
    if (result !== undefined) {
      logs.push(String(result));
    }
    return {
      output: logs.join('\n') || 'Executed successfully.',
      plotTitle,
      plotData,
    };
  } catch (err: any) {
    return {
      output: `Execution Error: ${err.message}`,
    };
  }
}

const JupyterNotebookStudio: React.FC<{
  asset: LearningAsset;
  onUpdate: (content: string) => void;
}> = ({ asset, onUpdate }) => {
  let doc: NotebookDocument = { cells: [] };
  try {
    const parsed = JSON.parse(asset.content);
    doc = Array.isArray(parsed.cells) ? parsed : { cells: [] };
  } catch {
    doc = {
      cells: [{ id: 'c1', type: 'markdown', content: asset.content }],
    };
  }

  const updateCells = (nextCells: NotebookCell[]) => {
    onUpdate(JSON.stringify({ cells: nextCells }, null, 2));
  };

  const runCell = (cellId: string) => {
    const next = doc.cells.map((c) => {
      if (c.id !== cellId || c.type !== 'code') return c;
      const res = executeNotebookCellCode(c.content);
      return {
        ...c,
        output: res.output,
        plotTitle: res.plotTitle,
        plotData: res.plotData,
        lastRunAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    });
    updateCells(next);
  };

  const runAllCells = () => {
    const next = doc.cells.map((c) => {
      if (c.type !== 'code') return c;
      const res = executeNotebookCellCode(c.content);
      return {
        ...c,
        output: res.output,
        plotTitle: res.plotTitle,
        plotData: res.plotData,
        lastRunAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    });
    updateCells(next);
  };

  const addCell = (type: 'markdown' | 'code') => {
    const newCell: NotebookCell =
      type === 'markdown'
        ? {
            id: `cell-${Date.now()}`,
            type: 'markdown',
            content: '### New Study Note & Equation Cell\nWrite Markdown and LaTeX like $E_n = n^2 E_1$.',
          }
        : {
            id: `cell-${Date.now()}`,
            type: 'code',
            language: 'javascript',
            content: `const xs = [1, 2, 3, 4, 5];\nconst ys = xs.map(x => x * x);\nconsole.log("Squared values:", ys.join(", "));\nplot(xs, ys, "Quadratic Growth y = x²");`,
          };
    updateCells([...doc.cells, newCell]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Code2 className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-slate-900">Jupyter Notebook</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addCell('markdown')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-400 whitespace-nowrap shrink-0"
          >
            + Markdown Cell
          </button>
          <button
            onClick={() => addCell('code')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-blue-400 whitespace-nowrap shrink-0"
          >
            + Code Cell
          </button>
          <button
            onClick={runAllCells}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap shrink-0"
          >
            <Play className="w-3 h-3" />
            Run All
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-4xl mx-auto w-full">
        {doc.cells.map((cell, idx) => (
          <div
            key={cell.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>
                  [{idx + 1}] {cell.type === 'code' ? `CODE` : 'MARKDOWN'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cell.type === 'code' && (
                  <button
                    onClick={() => runCell(cell.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </button>
                )}
                {doc.cells.length > 1 && (
                  <button
                    onClick={() => updateCells(doc.cells.filter((c) => c.id !== cell.id))}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {cell.type === 'markdown' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <textarea
                  rows={3}
                  value={cell.content}
                  onChange={(e) =>
                    updateCells(
                      doc.cells.map((c) => (c.id === cell.id ? { ...c, content: e.target.value } : c))
                    )
                  }
                  className="w-full p-3.5 font-mono text-xs text-slate-800 focus:outline-none resize-y"
                />
                <div className="p-3.5">
                  <MarkdownView content={cell.content} />
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  rows={5}
                  value={cell.content}
                  onChange={(e) =>
                    updateCells(
                      doc.cells.map((c) => (c.id === cell.id ? { ...c, content: e.target.value } : c))
                    )
                  }
                  className="w-full p-3.5 font-mono text-xs bg-slate-900 text-slate-100 leading-relaxed focus:outline-none resize-y"
                />
                {cell.output && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="font-mono text-xs text-slate-800 whitespace-pre-wrap">
                      {cell.output}
                    </div>
                    {cell.plotData && cell.plotData.length > 0 && (
                      <div className="p-3.5 bg-white rounded-lg border border-slate-200">
                        <div className="font-display text-xs font-semibold text-slate-800 mb-2">
                          {cell.plotTitle || 'Plot Output'}
                        </div>
                        <div className="flex items-end gap-3 h-32 pt-3 px-2 border-b border-slate-200">
                          {(() => {
                            const maxY = Math.max(...cell.plotData!.map((d) => d.y), 0.01);
                            return cell.plotData!.map((pt, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex-1 flex flex-col items-center justify-end h-full"
                              >
                                <span className="font-mono text-[10px] text-slate-500 mb-1 tabular-nums">
                                  {pt.y}
                                </span>
                                <div
                                  className="w-full max-w-[32px] bg-blue-600 rounded-t"
                                  style={{
                                    height: `${Math.max(6, (pt.y / maxY) * 95)}%`,
                                  }}
                                />
                              </div>
                            ));
                          })()}
                        </div>
                        <div className="flex items-center gap-3 pt-1 px-2">
                          {cell.plotData.map((pt, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex-1 text-center font-mono text-[10px] text-slate-500 truncate"
                            >
                              {pt.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. INTERACTIVE CONCEPT GRAPH STUDIO (.graph) — Powered by @xyflow/react
// ============================================================================
const CATEGORY_BORDER_COLORS: Record<GraphNode['category'], string> = {
  core: '#2563EB',
  equation: '#D97706',
  experiment: '#059669',
  application: '#7C3AED',
};

const ConceptGraphStudio: React.FC<{
  asset: LearningAsset;
  allAssets: LearningAsset[];
  onUpdate: (content: string) => void;
  onSelectAsset: (assetId: string) => void;
}> = ({ asset, allAssets, onUpdate, onSelectAsset }) => {
  const parseDoc = useCallback((): ConceptGraphDocument => {
    try {
      const parsed = JSON.parse(asset.content);
      return {
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      };
    } catch {
      return { nodes: [], edges: [] };
    }
  }, [asset.content]);

  const doc = parseDoc();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    doc.nodes[0]?.id || null
  );

  // Convert domain GraphNodes/GraphEdges into @xyflow/react Nodes & Edges
  const flowNodes: Node[] = doc.nodes.map((n) => ({
    id: n.id,
    position: { x: n.x, y: n.y },
    data: { label: n.label },
    style: {
      border: `2px solid ${
        n.id === selectedNodeId
          ? '#1D4ED8'
          : CATEGORY_BORDER_COLORS[n.category] || '#2563EB'
      }`,
      borderRadius: '10px',
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 600,
      background: '#FFFFFF',
      color: '#0F172A',
      width: 170,
    },
  }));

  const flowEdges: Edge[] = doc.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: false,
  }));

  const saveGraph = (nextDoc: ConceptGraphDocument) => {
    onUpdate(JSON.stringify(nextDoc, null, 2));
  };

  const onNodesChange = (changes: NodeChange[]) => {
    const updatedFlowNodes = applyNodeChanges(changes, flowNodes);
    const nextNodes = doc.nodes.map((n) => {
      const fn = updatedFlowNodes.find((u) => u.id === n.id);
      return fn
        ? { ...n, x: Math.round(fn.position.x), y: Math.round(fn.position.y) }
        : n;
    });
    saveGraph({ ...doc, nodes: nextNodes });
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    const updatedFlowEdges = applyEdgeChanges(changes, flowEdges);
    const nextEdges = updatedFlowEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: String(e.label || ''),
    }));
    saveGraph({ ...doc, edges: nextEdges });
  };

  const onConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const updatedEdges = addEdge(
      { ...connection, id: `e-${Date.now()}`, label: 'connects' },
      flowEdges
    );
    saveGraph({
      ...doc,
      edges: updatedEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: String(e.label || 'connects'),
      })),
    });
  };

  const addConceptNode = () => {
    const newId = `n-${Date.now().toString().slice(-4)}`;
    const newNode: GraphNode = {
      id: newId,
      label: 'New Concept',
      category: 'core',
      summary: 'Concept description.',
      x: 240,
      y: 180,
    };
    const nextEdges = selectedNodeId
      ? [
          ...doc.edges,
          {
            id: `e-${Date.now()}`,
            source: selectedNodeId,
            target: newId,
            label: 'relates to',
          },
        ]
      : doc.edges;
    saveGraph({
      nodes: [...doc.nodes, newNode],
      edges: nextEdges,
    });
    setSelectedNodeId(newId);
  };

  const selectedNode = doc.nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div className="text-xs font-medium text-slate-700">
          Concept Graph (React Flow — Drag nodes or connect handles)
        </div>
        <button
          onClick={addConceptNode}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3 h-3" />
          Add Node
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        <div className="lg:col-span-8 h-full relative">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_e, node) => setSelectedNodeId(node.id)}
            fitView
          >
            <Background color="#CBD5E1" gap={20} />
            <Controls />
          </ReactFlow>
        </div>

        <div className="lg:col-span-4 border-l border-slate-200 p-4 bg-white overflow-y-auto space-y-3">
          {selectedNode ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">NODE DETAILS</span>
                {doc.nodes.length > 1 && (
                  <button
                    onClick={() => {
                      saveGraph({
                        nodes: doc.nodes.filter((n) => n.id !== selectedNode.id),
                        edges: doc.edges.filter(
                          (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
                        ),
                      });
                      setSelectedNodeId(doc.nodes[0]?.id || null);
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) =>
                    saveGraph({
                      ...doc,
                      nodes: doc.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, label: e.target.value } : n
                      ),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Summary</label>
                <textarea
                  rows={3}
                  value={selectedNode.summary}
                  onChange={(e) =>
                    saveGraph({
                      ...doc,
                      nodes: doc.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, summary: e.target.value } : n
                      ),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Linked Asset
                </label>
                <select
                  value={selectedNode.linkedAssetId || ''}
                  onChange={(e) =>
                    saveGraph({
                      ...doc,
                      nodes: doc.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, linkedAssetId: e.target.value } : n
                      ),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                >
                  <option value="">(None)</option>
                  {allAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
                {selectedNode.linkedAssetId && (
                  <button
                    onClick={() => onSelectAsset(selectedNode.linkedAssetId!)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Open Asset
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. PDF DOCUMENT VIEWER (.pdf)
// ============================================================================
const PdfDocumentViewer: React.FC<{
  asset: LearningAsset;
  onAddComment: (text: string, pageNumber: number) => void;
  onDeleteComment: (id: string) => void;
}> = ({ asset, onAddComment, onDeleteComment }) => {
  let pages: { page: number; heading: string; body: string }[] = [];
  try {
    const parsed = JSON.parse(asset.content);
    if (Array.isArray(parsed)) pages = parsed;
  } catch {
    pages = [{ page: 1, heading: asset.title, body: asset.extractedText || asset.content }];
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [noteInput, setNoteInput] = useState('');
  const pageObj = pages.find((p) => p.page === currentPage) || pages[0];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
          <FileText className="w-4 h-4 text-red-600" />
          <span>{asset.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 text-xs bg-slate-100 rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-mono text-xs text-slate-700 tabular-nums">
            Page {currentPage} / {pages.length}
          </span>
          <button
            disabled={currentPage >= pages.length}
            onClick={() => setCurrentPage((p) => Math.min(pages.length, p + 1))}
            className="px-2.5 py-1 text-xs bg-slate-100 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto bg-white p-7 rounded-xl border border-slate-200 space-y-4">
          <h2 className="font-display text-lg font-bold text-slate-900">{pageObj?.heading}</h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {pageObj?.body}
          </div>

          <div className="pt-5 mt-5 border-t border-slate-200 space-y-2.5">
            <h4 className="font-display text-xs font-semibold text-slate-500">Page Notes</h4>
            {asset.comments.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <span className="font-mono font-semibold text-blue-600 mr-2">
                    [Page {c.pageNumber || 1}]
                  </span>
                  <span className="text-slate-700">{c.text}</span>
                </div>
                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder={`Add note for Page ${currentPage}...`}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
              <button
                onClick={() => {
                  if (noteInput.trim()) {
                    onAddComment(noteInput.trim(), currentPage);
                    setNoteInput('');
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. PICTURE VIEWER (.png / image)
// ============================================================================
const ImageAssetViewer: React.FC<{
  asset: LearningAsset;
  onAddComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
}> = ({ asset, onAddComment, onDeleteComment }) => {
  const [note, setNote] = useState('');

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto w-full space-y-5">
        <div className="bg-slate-900 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-4">
          <img
            src={asset.content}
            alt={asset.title}
            referrerPolicy="no-referrer"
            className="max-h-[380px] w-auto object-contain rounded-lg"
          />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="font-display text-xs font-semibold text-slate-900">Notes</div>
          {asset.comments.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
            >
              <span>{c.text}</span>
              <button
                onClick={() => onDeleteComment(c.id)}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note on this picture..."
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
            <button
              onClick={() => {
                if (note.trim()) {
                  onAddComment(note.trim());
                  setNote('');
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. SOUND & VIDEO PLAYER WITH TIMESTAMPED COMMENTS (sound / video)
// ============================================================================
function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MediaTimelineCommentStudio: React.FC<{
  asset: LearningAsset;
  onAddTimestampComment: (text: string, seconds: number) => void;
  onDeleteComment: (id: string) => void;
}> = ({ asset, onAddTimestampComment, onDeleteComment }) => {
  const isVideo = asset.type === 'video';
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(isVideo ? 12 : 8);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    if (!isVideo) return;
    let animId: number;
    let lastTick = performance.now();

    const renderFrame = (now: number) => {
      if (isPlaying) {
        const dt = (now - lastTick) / 1000;
        lastTick = now;
        setCurrentTime((prev) => {
          const next = prev + dt;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.fillRect(360, 40, 40, 200);
          ctx.strokeRect(360, 40, 40, 200);

          ctx.beginPath();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 3;
          const progress = currentTime / duration;
          const center = 100 + progress * 520;

          for (let x = 20; x < 700; x += 2) {
            const dist = x - center;
            const env = Math.exp(-(dist * dist) / 2800);
            const atten = x > 360 ? 0.45 : 1.0;
            const y = 140 - Math.sin(x * 0.12 - currentTime * 6) * 60 * env * atten;
            if (x === 20) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          ctx.fillStyle = '#E2E8F0';
          ctx.font = '12px monospace';
          ctx.fillText(`t = ${currentTime.toFixed(1)}s`, 20, 24);
        }
      }

      if (isPlaying) {
        animId = requestAnimationFrame(renderFrame);
      }
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, [isVideo, isPlaying, currentTime, duration]);

  const togglePlay = () => {
    if (isVideo) {
      setIsPlaying((p) => !p);
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const seekTo = (sec: number) => {
    const clamped = Math.max(0, Math.min(duration, sec));
    setCurrentTime(clamped);
    if (!isVideo && audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const sortedComments = [...asset.comments].sort(
    (a, b) => (a.timestampSeconds || 0) - (b.timestampSeconds || 0)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto w-full space-y-5">
        <div className="bg-slate-900 rounded-xl border border-slate-200 p-5 text-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-white">{asset.title}</h3>
            <span className="font-mono text-xs text-slate-300 tabular-nums">
              {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
            </span>
          </div>

          {isVideo ? (
            <canvas
              ref={canvasRef}
              width={720}
              height={260}
              className="w-full h-56 rounded-lg border border-slate-800 bg-slate-950"
            />
          ) : (
            <div className="py-5 px-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3">
              <audio
                ref={audioRef}
                src={asset.content}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => {
                  if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
                    setDuration(e.currentTarget.duration);
                  }
                }}
                onEnded={() => setIsPlaying(false)}
              />
              <div className="flex items-end gap-1.5 h-10">
                {Array.from({ length: 32 }).map((_, idx) => {
                  const active = idx / 32 <= currentTime / Math.max(1, duration);
                  const height = 12 + ((idx * 17) % 24);
                  return (
                    <div
                      key={idx}
                      style={{ height: `${height}px` }}
                      className={`w-1.5 rounded-full transition-colors ${
                        active ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h4 className="font-display text-xs font-semibold text-slate-900">
            Timestamped Comments
          </h4>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 font-mono text-xs font-semibold text-blue-700 shrink-0 tabular-nums">
              @ {formatTimestamp(currentTime)}
            </span>
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentInput.trim()) {
                  onAddTimestampComment(commentInput.trim(), Math.round(currentTime));
                  setCommentInput('');
                }
              }}
              placeholder={`Add comment at ${formatTimestamp(currentTime)}...`}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
            <button
              onClick={() => {
                if (commentInput.trim()) {
                  onAddTimestampComment(commentInput.trim(), Math.round(currentTime));
                  setCommentInput('');
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap shrink-0"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              Comment
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {sortedComments.map((c) => (
              <div
                key={c.id}
                onClick={() => seekTo(c.timestampSeconds || 0)}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/50 border border-slate-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-600 tabular-nums shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(c.timestampSeconds || 0)}
                  </span>
                  <span className="text-xs text-slate-800">{c.text}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComment(c.id);
                  }}
                  className="text-slate-400 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
