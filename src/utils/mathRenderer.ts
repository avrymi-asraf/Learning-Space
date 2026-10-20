import katex from 'katex';

export function renderLatexEquation(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return `<code>${escapeHtml(latex)}</code>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders Markdown prose enriched with block `$$...$$` and inline `$...$` KaTeX equations,
 * code blocks, tables, lists, and [Source: ...] citation highlights.
 */
export function renderMarkdownWithMath(markdown: string): string {
  if (!markdown) return '';

  const mathBlocks: string[] = [];
  const codeBlocks: string[] = [];

  // 1. Extract fenced code blocks first so math inside code isn't touched
  let processed = markdown.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(
      `<pre class="my-3 p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed"><div class="text-[10px] text-slate-400 mb-1.5 select-none">${escapeHtml(
        lang || 'code'
      )}</div><code>${escapeHtml(code.trim())}</code></pre>`
    );
    return `@@CODE_BLOCK_${idx}@@`;
  });

  // 2. Extract block equations $$...$$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, eq) => {
    const idx = mathBlocks.length;
    const html = renderLatexEquation(eq, true);
    mathBlocks.push(
      `<div class="my-3 py-2.5 px-4 rounded-lg bg-slate-50 border border-slate-200/80 overflow-x-auto text-center">${html}</div>`
    );
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 3. Extract inline equations $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_match, eq) => {
    const idx = mathBlocks.length;
    const html = renderLatexEquation(eq, false);
    mathBlocks.push(`<span class="inline-block px-0.5">${html}</span>`);
    return `@@MATH_BLOCK_${idx}@@`;
  });

  // 4. Escape HTML on remaining text
  processed = escapeHtml(processed);

  // 5. Render headings, blockquotes, lists, bold/italic, inline code, and citations
  const lines = processed.split('\n');
  const outLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      outLines.push('<div class="h-2.5"></div>');
      continue;
    }

    if (trimmed.startsWith('### ')) {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      outLines.push(
        `<h3 class="font-display text-base font-semibold text-slate-900 mt-4 mb-1.5">${formatInline(
          trimmed.slice(4)
        )}</h3>`
      );
    } else if (trimmed.startsWith('## ')) {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      outLines.push(
        `<h2 class="font-display text-lg font-semibold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-200">${formatInline(
          trimmed.slice(3)
        )}</h2>`
      );
    } else if (trimmed.startsWith('# ')) {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      outLines.push(
        `<h1 class="font-display text-xl font-bold text-slate-900 mt-2 mb-3">${formatInline(
          trimmed.slice(2)
        )}</h1>`
      );
    } else if (trimmed.startsWith('&gt; ')) {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      outLines.push(
        `<blockquote class="my-2.5 px-4 py-2.5 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-sm italic">${formatInline(
          trimmed.slice(5)
        )}</blockquote>`
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        outLines.push('<ul class="list-disc pl-5 space-y-1 my-2 text-slate-700 text-[15px] leading-relaxed">');
        inList = true;
      }
      outLines.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      const content = trimmed.replace(/^\d+\.\s+/, '');
      const num = trimmed.match(/^(\d+)\./)?.[1] || '1';
      outLines.push(
        `<div class="flex items-baseline gap-2.5 my-1.5 text-[15px] text-slate-700 leading-relaxed"><span class="font-mono text-xs font-semibold text-blue-600 shrink-0">${num}.</span><div>${formatInline(
          content
        )}</div></div>`
      );
    } else {
      if (inList) {
        outLines.push('</ul>');
        inList = false;
      }
      outLines.push(`<p class="text-[15px] text-slate-700 leading-relaxed my-1.5">${formatInline(trimmed)}</p>`);
    }
  }

  if (inList) {
    outLines.push('</ul>');
  }

  let html = outLines.join('\n');

  // 6. Restore math and code placeholders
  html = html.replace(/@@MATH_BLOCK_(\d+)@@/g, (_m, idx) => mathBlocks[Number(idx)] || '');
  html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_m, idx) => codeBlocks[Number(idx)] || '');

  return html;
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[13px]">$1</code>'
    )
    .replace(
      /\[Source:?\s*([^\]]+)\]/gi,
      '<span class="inline-flex items-center text-xs font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 mx-0.5">[Source: $1]</span>'
    );
}
