import { LearningAsset } from '../types';

/**
 * Generates a real, playable 8-second harmonic chord progression WAV data URI
 * so the pre-loaded Sound asset plays immediately in the browser.
 */
export function createSynthesizedStudyWavDataUri(): string {
  const sampleRate = 8000;
  const durationSeconds = 8;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const chords = [
    [261.63, 329.63, 392.0],
    [293.66, 369.99, 440.0],
    [329.63, 415.3, 493.88],
    [261.63, 329.63, 523.25],
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.min(3, Math.floor(t / 2));
    const freqs = chords[chordIdx];
    const localT = t % 2;
    const env = Math.min(1, localT / 0.1) * Math.exp(-localT * 0.9);
    const wave =
      (Math.sin(2 * Math.PI * freqs[0] * t) +
        0.7 * Math.sin(2 * Math.PI * freqs[1] * t) +
        0.5 * Math.sin(2 * Math.PI * freqs[2] * t)) /
      2.2;
    const sample = Math.max(-1, Math.min(1, wave * env * 0.45));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Generates a scientific SVG diagram data URI for the Picture asset and Marp slides
 */
export function createQuantumDiagramSvgDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0F172A"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>
      <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="50%" stop-color="#818CF8"/>
        <stop offset="100%" stop-color="#34D399"/>
      </linearGradient>
    </defs>
    <rect width="960" height="540" fill="url(#bg)"/>
    <g stroke="#334155" stroke-width="1" opacity="0.5">
      <line x1="80" y1="270" x2="880" y2="270"/>
      <line x1="480" y1="60" x2="480" y2="480"/>
      <line x1="280" y1="60" x2="280" y2="480" stroke-dasharray="4 4"/>
      <line x1="680" y1="60" x2="680" y2="480" stroke-dasharray="4 4"/>
    </g>
    <rect x="455" y="110" width="50" height="320" fill="#F59E0B" fill-opacity="0.18" stroke="#F59E0B" stroke-width="2"/>
    <text x="480" y="95" fill="#FBBF24" font-family="monospace" font-size="14" text-anchor="middle">Potential Barrier V₀ &gt; E</text>
    <path d="M 90 270 Q 125 140 160 270 T 230 270 T 300 270 T 370 270 T 455 270" fill="none" stroke="url(#wave)" stroke-width="4"/>
    <path d="M 455 215 Q 480 250 505 260" fill="none" stroke="#FBBF24" stroke-width="3.5" stroke-dasharray="5 3"/>
    <path d="M 505 270 Q 540 230 575 270 T 645 270 T 715 270 T 785 270 T 855 270" fill="none" stroke="#34D399" stroke-width="3.5"/>
    <text x="260" y="135" fill="#38BDF8" font-family="sans-serif" font-weight="bold" font-size="16">Region I: Incident Wave ψ₁(x)</text>
    <text x="480" y="455" fill="#FBBF24" font-family="sans-serif" font-weight="bold" font-size="15" text-anchor="middle">Region II: Decay e^(-κx)</text>
    <text x="700" y="185" fill="#34D399" font-family="sans-serif" font-weight="bold" font-size="16" text-anchor="middle">Region III: Tunneling ψ₃(x)</text>
    <text x="480" y="42" fill="#F8FAFC" font-family="sans-serif" font-weight="bold" font-size="20" text-anchor="middle">Quantum Wavefunction Tunneling Across a Finite Barrier</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_ASSETS: LearningAsset[] = [
  {
    id: 'asset-md-quantum',
    title: 'Schrödinger Equation & Wavefunctions.md',
    type: 'md',
    createdAt: '2026-10-20T01:00:00Z',
    updatedAt: '2026-10-20T01:30:00Z',
    content: `# Foundations of Quantum Wavefunctions

In quantum mechanics, the physical state of a non-relativistic particle is completely described by its complex-valued wavefunction $\\Psi(x, t)$.

## 1. Time-Dependent Schrödinger Equation

The evolution of $\\Psi(x, t)$ over time is governed by the **Time-Dependent Schrödinger Equation**:

$$i\\hbar \\frac{\\partial \\Psi(x,t)}{\\partial t} = \\left( -\\frac{\\hbar^2}{2m}\\frac{\\partial^2}{\\partial x^2} + V(x,t) \\right) \\Psi(x,t)$$

Where:
- $\\hbar = \\frac{h}{2\\pi}$ is the reduced Planck constant ($1.054 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$).
- $m$ is the mass of the particle.
- $V(x, t)$ represents the potential energy landscape.

## 2. Born's Probability Interpretation

By **Born's Rule**, the probability $P(a \\le x \\le b)$ of detecting the particle between points $a$ and $b$ at time $t$ is given by integrating the probability density $|\\Psi(x,t)|^2$:

$$P(a \\le x \\le b) = \\int_{a}^{b} |\\Psi(x,t)|^2 \\, dx = 1 \\quad \\text{(when normalized over } (-\\infty, \\infty)\\text{)}$$

## 3. Energy Eigenstates in an Infinite Potential Well

For a particle confined to a box of length $L$ where $V(x) = 0$ for $0 < x < L$, the quantized stationary states and discrete energy levels are:

$$\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n\\pi x}{L}\\right), \\qquad E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2mL^2} \\quad (n = 1, 2, 3, \\dots)$$`,
    comments: [
      {
        id: 'c-md-1',
        author: 'Note',
        text: 'n=0 is excluded because sin(0) = 0 everywhere, meaning no particle exists in the box.',
        createdAt: '2026-10-20T01:15:00Z',
      },
    ],
  },
  {
    id: 'asset-ppx-deck',
    title: 'Quantum Tunneling Presentation.ppx',
    type: 'ppx',
    createdAt: '2026-10-20T01:05:00Z',
    updatedAt: '2026-10-20T01:35:00Z',
    content: `---
marp: true
theme: default
paginate: true
---

# Quantum Superposition & Barrier Tunneling
### Open-Source Marp Presentation with SVG Diagrams, Pictures & Equations

$$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\qquad |\\alpha|^2 + |\\beta|^2 = 1$$

<svg viewBox="0 0 680 140" width="100%" height="135" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="20" width="200" height="95" rx="12" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>
  <text x="110" y="58" text-anchor="middle" fill="#1E40AF" font-family="sans-serif" font-size="15" font-weight="bold">1. Incident Matter Wave</text>
  <text x="110" y="86" text-anchor="middle" fill="#475569" font-family="monospace" font-size="13">ψ₁(x) = A e^(ikx)</text>
  <line x1="215" y1="67" x2="245" y2="67" stroke="#64748B" stroke-width="3"/>
  <rect x="250" y="20" width="190" height="95" rx="12" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="345" y="58" text-anchor="middle" fill="#92400E" font-family="sans-serif" font-size="15" font-weight="bold">2. Evanescent Decay</text>
  <text x="345" y="86" text-anchor="middle" fill="#475569" font-family="monospace" font-size="13">ψ₂(x) ∝ e^(-κx)</text>
  <line x1="445" y1="67" x2="475" y2="67" stroke="#64748B" stroke-width="3"/>
  <rect x="480" y="20" width="190" height="95" rx="12" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="575" y="58" text-anchor="middle" fill="#065F46" font-family="sans-serif" font-size="15" font-weight="bold">3. Transmitted Wave</text>
  <text x="575" y="86" text-anchor="middle" fill="#475569" font-family="monospace" font-size="13">T ≈ e^(-2κa)</text>
</svg>

- **Superposition**: Quantum states combine linearly with complex phase amplitudes.
- **Tunneling**: Finite probability of crossing barriers where kinetic energy $E < V_0$.

---

# Wavefunction Picture & Spatial Regions

![w:460](${createQuantumDiagramSvgDataUri()})

- **Region I**: Incident + reflected wave interference.
- **Region II**: Exponential attenuation $\\kappa = \\frac{\\sqrt{2m(V_0 - E)}}{\\hbar}$.
- **Region III**: Emergent traveling wave with reduced amplitude.

---

# Quantitative Transmission Infographic

$$T(a) \\approx 16\\frac{E}{V_0}\\left(1 - \\frac{E}{V_0}\\right) e^{-2\\kappa a}$$

<svg viewBox="0 0 640 165" width="100%" height="155" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="640" height="165" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="24" y="30" fill="#0F172A" font-family="sans-serif" font-size="14" font-weight="bold">Relative Tunneling Probability (%) by Barrier Width (a)</text>
  <rect x="145" y="46" width="380" height="22" rx="4" fill="#2563EB"/>
  <text x="24" y="62" fill="#334155" font-family="monospace" font-size="12">a = 0.2 nm (78%)</text>
  <rect x="145" y="80" width="210" height="22" rx="4" fill="#059669"/>
  <text x="24" y="96" fill="#334155" font-family="monospace" font-size="12">a = 0.4 nm (42%)</text>
  <rect x="145" y="114" width="60" height="22" rx="4" fill="#D97706"/>
  <text x="24" y="130" fill="#334155" font-family="monospace" font-size="12">a = 0.8 nm (11%)</text>
</svg>

- **Scanning Tunneling Microscopy (STM)**: A $0.1\\text{ nm}$ change in distance alters tunneling current by nearly $8\\times$.`,
    comments: [],
  },
  {
    id: 'asset-ipynb-lab',
    title: 'Wavefunction Simulation Lab.ipynb',
    type: 'ipynb',
    createdAt: '2026-10-20T01:10:00Z',
    updatedAt: '2026-10-20T01:40:00Z',
    content: JSON.stringify(
      {
        cells: [
          {
            id: 'cell-1',
            type: 'markdown',
            content:
              '### Interactive Lab: Particle in a 1D Box Energy & Probability Density\nRun the code cells below to calculate quantized energy levels $E_n \\propto n^2$ and plot $|\\psi_n(x)|^2 = \\frac{2}{L}\\sin^2\\left(\\frac{n\\pi x}{L}\\right)$.',
          },
          {
            id: 'cell-2',
            type: 'code',
            language: 'python',
            content: `# Calculate quantized energy levels E_n (in eV) for an electron in a L = 1.0 nm box
E1_eV = 0.376
levels = [1, 2, 3, 4, 5]

for n in levels:
    En = round(E1_eV * (n ** 2), 3)
    print(f"Quantum Number n={n} -> Energy E_{n} = {En} eV")

plot(levels, [round(E1_eV * (n ** 2), 2) for n in levels], "Quantized Energy Levels E_n (eV)")`,
            output: `Quantum Number n=1 -> Energy E_1 = 0.376 eV\nQuantum Number n=2 -> Energy E_2 = 1.504 eV\nQuantum Number n=3 -> Energy E_3 = 3.384 eV\nQuantum Number n=4 -> Energy E_4 = 6.016 eV\nQuantum Number n=5 -> Energy E_5 = 9.4 eV`,
            plotTitle: 'Quantized Energy Levels E_n (eV)',
            plotData: [
              { label: 'n=1', x: 1, y: 0.38 },
              { label: 'n=2', x: 2, y: 1.5 },
              { label: 'n=3', x: 3, y: 3.38 },
              { label: 'n=4', x: 4, y: 6.02 },
              { label: 'n=5', x: 5, y: 9.4 },
            ],
            lastRunAt: 'Ready',
          },
        ],
      },
      null,
      2
    ),
    comments: [],
  },
  {
    id: 'asset-graph-concepts',
    title: 'Quantum Concept Network.graph',
    type: 'graph',
    createdAt: '2026-10-20T01:15:00Z',
    updatedAt: '2026-10-20T01:45:00Z',
    content: JSON.stringify(
      {
        nodes: [
          {
            id: 'n1',
            label: 'Wavefunction Ψ(x,t)',
            category: 'core',
            summary: 'Complex probability amplitude encoding complete quantum state.',
            linkedAssetId: 'asset-md-quantum',
            x: 340,
            y: 180,
          },
          {
            id: 'n2',
            label: 'Schrödinger Equation',
            category: 'equation',
            summary: 'iℏ ∂Ψ/∂t = ĤΨ governing unitary time evolution.',
            linkedAssetId: 'asset-md-quantum',
            x: 150,
            y: 90,
          },
          {
            id: 'n3',
            label: 'Born Probability |Ψ|²',
            category: 'equation',
            summary: 'Modulus squared yields spatial probability density.',
            linkedAssetId: 'asset-ipynb-lab',
            x: 540,
            y: 90,
          },
          {
            id: 'n4',
            label: 'Quantum Tunneling',
            category: 'experiment',
            summary: 'Evanescent penetration across finite barrier V₀ > E.',
            linkedAssetId: 'asset-ppx-deck',
            x: 170,
            y: 300,
          },
          {
            id: 'n5',
            label: 'Scanning Tunneling Microscope',
            category: 'application',
            summary: 'Atomic-scale imaging using exponential tunneling current.',
            linkedAssetId: 'asset-pdf-paper',
            x: 490,
            y: 300,
          },
        ],
        edges: [
          { id: 'e1', source: 'n2', target: 'n1', label: 'evolves' },
          { id: 'e2', source: 'n1', target: 'n3', label: 'modulus squared' },
          { id: 'e3', source: 'n1', target: 'n4', label: 'penetrates barrier' },
          { id: 'e4', source: 'n4', target: 'n5', label: 'enables' },
        ],
      },
      null,
      2
    ),
    comments: [],
  },
  {
    id: 'asset-pdf-paper',
    title: 'Scanning Tunneling Microscopy.pdf',
    type: 'pdf',
    createdAt: '2026-10-20T01:20:00Z',
    updatedAt: '2026-10-20T01:20:00Z',
    extractedText: `Scanning Tunneling Microscopy — Surface Atomic Resolution via Quantum Tunneling.
Page 1: Vacuum Tunneling Current Theory. The tunneling current I is exponentially dependent on tip-sample separation d: I(d) ∝ V · exp(-2κd), where κ = sqrt(2mφ)/ℏ.
Page 2: Piezoelectric Feedback Control. A 1 Å change in distance alters tunneling current by nearly an order of magnitude.`,
    content: JSON.stringify([
      {
        page: 1,
        heading: 'Page 1 — Vacuum Tunneling Current & Work Function Theory',
        body: `When an atomically sharp conducting tip is positioned within d = 4–10 Å of a sample under bias voltage V, electrons tunnel across the vacuum barrier.\n\nGoverning Equation:\nI(d) = C · V · ρ_s(E_F) · exp(-2κd)\n\nWhere κ = √(2mφ) / ℏ ≈ 1.025 √(φ[eV]) Å⁻¹.`,
      },
      {
        page: 2,
        heading: 'Page 2 — Constant-Current Piezoelectric Feedback',
        body: `Because exp(-2κd) changes by a factor of ~7.8 for every 1 Å (0.1 nm) change in barrier width d, locking the tunneling current with a feedback loop maps surface atomic topography with 0.01 Å vertical resolution.`,
      },
    ]),
    comments: [
      {
        id: 'c-pdf-1',
        author: 'Note',
        pageNumber: 1,
        text: 'κ ≈ 1.025 * sqrt(φ) per Angstrom explains why 1 Å changes current by ~8x.',
        createdAt: '2026-10-20T01:22:00Z',
      },
    ],
  },
  {
    id: 'asset-img-diagram',
    title: 'Barrier Tunneling Diagram.png',
    type: 'image',
    createdAt: '2026-10-20T01:25:00Z',
    updatedAt: '2026-10-20T01:25:00Z',
    extractedText:
      'Visual diagram showing Region I incident sinusoidal matter wave, Region II exponential decay inside potential barrier V0 > E, and Region III transmitted wave.',
    content: createQuantumDiagramSvgDataUri(),
    comments: [],
  },
  {
    id: 'asset-sound-podcast',
    title: 'Wave-Particle Duality Audio.wav',
    type: 'sound',
    createdAt: '2026-10-20T01:28:00Z',
    updatedAt: '2026-10-20T01:28:00Z',
    extractedText:
      'Audio overview discussing how the Schrödinger wavefunction unifies wave interference with discrete particle detection events.',
    content: createSynthesizedStudyWavDataUri(),
    comments: [
      {
        id: 'c-aud-1',
        author: 'Note',
        timestampSeconds: 1,
        text: 'Harmonic eigenstates and standing wave frequencies.',
        createdAt: '2026-10-20T01:29:00Z',
      },
      {
        id: 'c-aud-2',
        author: 'Note',
        timestampSeconds: 4,
        text: 'Transition to higher quantum number n=2 frequency shift.',
        createdAt: '2026-10-20T01:30:00Z',
      },
    ],
  },
  {
    id: 'asset-video-lecture',
    title: 'Time-Evolution of Wave Packets.mp4',
    type: 'video',
    createdAt: '2026-10-20T01:32:00Z',
    updatedAt: '2026-10-20T01:32:00Z',
    extractedText:
      'Video lecture demonstrating Gaussian wave packet dispersion and tunneling across a potential barrier.',
    content: 'interactive-wavepacket-simulation',
    comments: [
      {
        id: 'c-vid-1',
        author: 'Note',
        timestampSeconds: 2,
        text: 'Gaussian packet hits the potential barrier — partial reflection creates ripples.',
        createdAt: '2026-10-20T01:33:00Z',
      },
      {
        id: 'c-vid-2',
        author: 'Note',
        timestampSeconds: 6,
        text: 'Transmitted packet emerges on the right with smaller amplitude.',
        createdAt: '2026-10-20T01:34:00Z',
      },
    ],
  },
];
