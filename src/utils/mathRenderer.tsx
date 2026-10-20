import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

/**
 * Standard Markdown + LaTeX Equation Renderer powered by:
 * - `react-markdown`
 * - `remark-math` & `rehype-katex` (for $...$ and $$...$$ equations)
 * - `remark-gfm` (for tables, task lists, and strikethrough)
 */
export const MarkdownView: React.FC<{ content: string; className?: string }> = ({
  content,
  className = '',
}) => {
  return (
    <div
      className={`prose prose-slate max-w-none text-slate-800 leading-relaxed space-y-2.5 [&_h1]:font-display [&_h1]:text-xl [&_h1]:font-bold [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3.5 [&_blockquote]:italic ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};
