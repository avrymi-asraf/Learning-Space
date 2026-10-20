import { Marp } from '@marp-team/marp-core';

/**
 * Open-Source Presentation Engine for `.ppx` Assets:
 * Powered by `@marp-team/marp-core` (Marp — Markdown Presentation Ecosystem).
 *
 * Why Marp (`@marp-team/marp-core`) is ideal for `.ppx`:
 * - Open-source standard that compiles Markdown + HTML + Inline `<svg>` + Pictures (`![]()`) + KaTeX Math
 *   into crisp, scalable 16:9 `<svg data-marpit-svg>` presentation slides.
 * - Supports background images (`![bg right:40%](...)`), sized images (`![w:320](...)`),
 *   arbitrary inline `<svg>` diagrams/shapes/infographics, CSS grid layouts, and math equations.
 */

let marpInstance: Marp | null = null;

function getMarp(): Marp {
  if (!marpInstance) {
    marpInstance = new Marp({
      html: true, // Enables inline <svg>, <img>, <div>, <style>, etc.
      math: 'katex',
    });
  }
  return marpInstance;
}

export interface RenderedMarpDeck {
  slidesHtml: string[];
  css: string;
  rawSlides: string[];
  frontmatter: string;
}

/**
 * Splits a Marp `.ppx` document into its optional YAML frontmatter and individual slide Markdown strings.
 */
export function splitMarpSlides(markdown: string): {
  frontmatter: string;
  slides: string[];
} {
  const trimmed = (markdown || '').trim();
  if (!trimmed) {
    return {
      frontmatter: '---\nmarp: true\ntheme: default\npaginate: true\n---',
      slides: ['# Untitled Presentation\n\nAdd pictures, inline SVGs, and equations.'],
    };
  }

  let frontmatter = '---\nmarp: true\ntheme: default\npaginate: true\n---';
  let body = trimmed;

  if (trimmed.startsWith('---')) {
    const endFrontmatter = trimmed.indexOf('\n---', 3);
    if (endFrontmatter !== -1) {
      const candidateFm = trimmed.slice(0, endFrontmatter + 4).trim();
      if (candidateFm.includes('marp:') || candidateFm.includes('theme:')) {
        frontmatter = candidateFm;
        body = trimmed.slice(endFrontmatter + 4).trim();
      }
    }
  }

  const slides = body
    .split(/\n---\n|^---\n|\n---$/g)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    frontmatter,
    slides: slides.length > 0 ? slides : ['# Slide 1'],
  };
}

export function joinMarpSlides(frontmatter: string, slides: string[]): string {
  const fm = frontmatter.trim() || '---\nmarp: true\ntheme: default\npaginate: true\n---';
  return `${fm}\n\n${slides.map((s) => s.trim()).join('\n\n---\n\n')}`;
}

/**
 * Renders the full `.ppx` deck using `@marp-team/marp-core` and extracts each `<svg data-marpit-svg>` slide.
 */
export function renderMarpDeck(markdown: string): RenderedMarpDeck {
  const { frontmatter, slides } = splitMarpSlides(markdown);
  const fullSource = joinMarpSlides(frontmatter, slides);

  try {
    const marp = getMarp();
    const { html, css } = marp.render(fullSource, { htmlAsArray: true });
    return {
      slidesHtml: Array.isArray(html) ? html : [html],
      css,
      rawSlides: slides,
      frontmatter,
    };
  } catch (err) {
    console.error('Marp render error:', err);
    return {
      slidesHtml: slides.map(
        (s) =>
          `<div class="p-8 bg-white text-slate-900"><pre class="font-mono text-xs whitespace-pre-wrap">${s}</pre></div>`
      ),
      css: '',
      rawSlides: slides,
      frontmatter,
    };
  }
}

/**
 * Ready-to-insert SVG, Picture, and Layout blocks for the `.ppx` Presentation Editor
 */
export const MARP_INSERT_TEMPLATES = {
  svgFlowchart: `<svg viewBox="0 0 680 150" width="100%" height="145" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="25" width="180" height="95" rx="12" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>
  <text x="100" y="65" text-anchor="middle" fill="#1E40AF" font-family="sans-serif" font-size="15" font-weight="bold">1. Incident Wave</text>
  <text x="100" y="90" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">ψ₁(x) = A e^(ikx)</text>
  <path d="M 195 72 L 240 72" stroke="#64748B" stroke-width="2.5" marker-end="url(#arrow)"/>
  <rect x="245" y="25" width="190" height="95" rx="12" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="340" y="65" text-anchor="middle" fill="#92400E" font-family="sans-serif" font-size="15" font-weight="bold">2. Barrier Decay</text>
  <text x="340" y="90" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">ψ₂(x) ∝ e^(-κx)</text>
  <path d="M 440 72 L 485 72" stroke="#64748B" stroke-width="2.5"/>
  <rect x="490" y="25" width="180" height="95" rx="12" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="580" y="65" text-anchor="middle" fill="#065F46" font-family="sans-serif" font-size="15" font-weight="bold">3. Tunneling Wave</text>
  <text x="580" y="90" text-anchor="middle" fill="#475569" font-family="sans-serif" font-size="12">T ≈ e^(-2κa)</text>
</svg>`,

  svgChart: `<svg viewBox="0 0 640 170" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="640" height="170" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="24" y="32" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Tunneling Transmission Probability vs Barrier Width</text>
  <rect x="140" y="50" width="380" height="22" rx="4" fill="#2563EB"/>
  <text x="24" y="66" fill="#334155" font-family="monospace" font-size="12">0.2 nm (78%)</text>
  <rect x="140" y="85" width="210" height="22" rx="4" fill="#059669"/>
  <text x="24" y="101" fill="#334155" font-family="monospace" font-size="12">0.4 nm (42%)</text>
  <rect x="140" y="120" width="65" height="22" rx="4" fill="#D97706"/>
  <text x="24" y="136" fill="#334155" font-family="monospace" font-size="12">0.8 nm (11%)</text>
</svg>`,

  twoColumnGrid: `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: center;">
<div style="background: #F8FAFC; padding: 18px; border-radius: 12px; border: 1px solid #E2E8F0;">

### Left Column
- Key theoretical principle
- Governing formula: $\\hat{H}\\Psi = E\\Psi$

</div>
<div style="background: #EFF6FF; padding: 18px; border-radius: 12px; border: 1px solid #BFDBFE;">

### Right Column
- Experimental verification
- Sub-angstrom STM resolution

</div>
</div>`,
};
