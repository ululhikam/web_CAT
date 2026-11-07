/**
 * Generator SVG deterministik untuk soal figural HITAM-PUTIH (Monokrom).
 *
 * Seluruh gambar menggunakan palet hitam-putih murni (#000000, #ffffff, dan
 * arsiran abu-abu gelap/terang) sesuai standar buku soal Psikotes Kecerdasan
 * & Penalaran Gambar (Deret 4-Kotak, Matriks 3×3, Rotasi, Pencerminan, Analogi,
 * Jaring Kubus, Hitung Bangun, dan Arah Kompas).
 */

export type FigureFamily =
  | 'series'
  | 'rotation'
  | 'mirror'
  | 'analogy'
  | 'net'
  | 'count'
  | 'direction'
  | 'gridseries'
  | 'matrixline'
  | 'matrixshape';

export type CompassDirection = 'Utara' | 'Timur' | 'Selatan' | 'Barat';

export interface FigureSpec {
  family: FigureFamily;
  /** Penentu variasi di dalam satu keluarga (0, 1, 2, ...). */
  seed: number;
}

/** Ukuran kanvas SVG; cocok dengan `THUMBNAIL_MAX_PX = 256` di `MediaService`. */
export const FIGURE_SIZE = 256;

/** Penanda bahwa gambar yang diminta adalah stem, bukan pilihan 0..3. */
export const STEM_VARIANT = -1;

// Palet Hitam-Putih Murni (Monokrom)
const INK = '#000000';
const INK_ALT = '#000000';
const INK_GRAY = '#666666';
const INK_LIGHT = '#d4d4d8';
const PAPER = '#ffffff';
const GRID = '#18181b';

const COMPASS: readonly CompassDirection[] = ['Utara', 'Timur', 'Selatan', 'Barat'];

type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond';
const SHAPES: readonly ShapeKind[] = ['circle', 'square', 'triangle', 'diamond'];

function shapeAt(kind: ShapeKind, cx: number, cy: number, r: number, color = INK, filled = true): string {
  const fill = filled ? color : PAPER;
  const stroke = `stroke="${INK}" stroke-width="2.5"`;
  switch (kind) {
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${stroke}/>`;
    case 'square':
      return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="2" fill="${fill}" ${stroke}/>`;
    case 'triangle': {
      const top = `${cx},${cy - r}`;
      const left = `${cx - r},${cy + r}`;
      const right = `${cx + r},${cy + r}`;
      return `<polygon points="${top} ${left} ${right}" fill="${fill}" ${stroke}/>`;
    }
    case 'diamond': {
      const pts = `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
      return `<polygon points="${pts}" fill="${fill}" ${stroke}/>`;
    }
  }
}

function rowOfShapes(kind: ShapeKind, count: number, cy: number, r: number, color = INK, filled = true): string {
  const gap = r * 2.5;
  const startX = FIGURE_SIZE / 2 - ((count - 1) * gap) / 2;
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    parts.push(shapeAt(kind, Math.round(startX + i * gap), cy, r, color, filled));
  }
  return parts.join('');
}

function canvas(inner: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${FIGURE_SIZE}" height="${FIGURE_SIZE}" viewBox="0 0 ${FIGURE_SIZE} ${FIGURE_SIZE}">`,
    `<rect width="${FIGURE_SIZE}" height="${FIGURE_SIZE}" rx="12" fill="${PAPER}" stroke="${GRID}" stroke-width="4"/>`,
    inner,
    '</svg>',
  ].join('');
}

/* ------------------------------------------------------------------ series */

function renderSeries(seed: number, variant: number): string {
  const kind = SHAPES[seed % SHAPES.length]!;
  const filled = seed % 2 === 0;
  if (variant === STEM_VARIANT) {
    return canvas(
      [
        rowOfShapes(kind, 1, 52, 16, INK, filled),
        rowOfShapes(kind, 2, 108, 16, INK, filled),
        rowOfShapes(kind, 3, 164, 16, INK, filled),
        `<line x1="28" y1="202" x2="228" y2="202" stroke="${GRID}" stroke-width="2.5" stroke-dasharray="6 6"/>`,
        `<text x="128" y="236" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="700" fill="${INK}">?</text>`,
      ].join(''),
    );
  }
  const count = [4, 2, 3, 5][variant] ?? 4;
  return canvas(rowOfShapes(kind, count, 128, 17, INK, filled));
}

/* ---------------------------------------------------------------- rotation */

function lShape(angleDeg: number, cx = 128, cy = 128, scale = 1): string {
  return [
    `<g transform="translate(${cx} ${cy}) rotate(${angleDeg}) scale(${scale})">`,
    `<path d="M-36 -44 H-8 V16 H36 V44 H-36 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>`,
    `<circle cx="24" cy="-28" r="10" fill="${PAPER}" stroke="${INK}" stroke-width="3.5"/>`,
    `<circle cx="24" cy="-28" r="4" fill="${INK}"/>`,
    '</g>',
  ].join('');
}

export function rotationStepDegrees(seed: number): number {
  const steps = [90, 45, 135, 90, -90, -45, -135, -90];
  return steps[seed % steps.length]!;
}

function renderRotation(seed: number, variant: number): string {
  const base = (seed * 45) % 360;
  const step = rotationStepDegrees(seed);

  if (variant === STEM_VARIANT) {
    return canvas(
      [
        lShape(base, 56, 128, 0.52),
        `<path d="M92 128 H108" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
        lShape(base + step, 140, 128, 0.52),
        `<path d="M176 128 H192" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
        `<text x="218" y="138" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="${INK}">?</text>`,
      ].join(''),
    );
  }

  const target = base + step * 2;
  const angles = [target, target + 90, target + 180, target + 270];
  return canvas(lShape(angles[variant] ?? base));
}

/* ------------------------------------------------------------------ mirror */

function asymmetricMotif(seed: number): string {
  const kind = SHAPES[seed % SHAPES.length]!;
  const offset = (seed % 3) * 8;
  return [
    `<path d="M64 ${72 + offset} L172 64 L132 108 Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>`,
    shapeAt(kind, 176, 92, 16, PAPER, false),
    `<rect x="60" y="96" width="38" height="12" fill="${INK}"/>`,
  ].join('');
}

function renderMirror(seed: number, variant: number): string {
  const motif = asymmetricMotif(seed);
  if (variant === STEM_VARIANT) {
    return canvas(
      [
        motif,
        `<line x1="24" y1="132" x2="232" y2="132" stroke="${INK}" stroke-width="3" stroke-dasharray="8 6"/>`,
        `<text x="128" y="204" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="${INK}">?</text>`,
      ].join(''),
    );
  }

  const transforms = [
    `translate(0 ${FIGURE_SIZE}) scale(1 -1)`,
    `translate(${FIGURE_SIZE} 0) scale(-1 1)`,
    `translate(${FIGURE_SIZE} ${FIGURE_SIZE}) scale(-1 -1)`,
    'translate(0 40)',
  ];
  return canvas(`<g transform="${transforms[variant] ?? ''}">${motif}</g>`);
}

/* ----------------------------------------------------------------- analogy */

function renderAnalogy(seed: number, variant: number): string {
  const first = SHAPES[seed % SHAPES.length]!;
  const second = SHAPES[(seed + 1) % SHAPES.length]!;

  if (variant === STEM_VARIANT) {
    return canvas(
      [
        shapeAt(first, 62, 76, 16, PAPER, false),
        `<text x="116" y="84" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="${INK}">→</text>`,
        shapeAt(first, 180, 76, 32, INK, true),
        `<line x1="28" y1="128" x2="228" y2="128" stroke="${GRID}" stroke-width="2"/>`,
        shapeAt(second, 62, 184, 16, PAPER, false),
        `<text x="116" y="192" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="${INK}">→</text>`,
        `<text x="180" y="194" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="${INK}">?</text>`,
      ].join(''),
    );
  }

  const specs: Array<{ kind: ShapeKind; r: number; filled: boolean }> = [
    { kind: second, r: 36, filled: true },
    { kind: second, r: 16, filled: false },
    { kind: first, r: 36, filled: true },
    { kind: SHAPES[(seed + 2) % SHAPES.length]!, r: 36, filled: false },
  ];
  const pick = specs[variant] ?? specs[0]!;
  return canvas(shapeAt(pick.kind, 128, 128, pick.r, INK, pick.filled));
}

/* --------------------------------------------------------------------- net */

function renderNet(seed: number, variant: number): string {
  const markCell = seed % 4;
  const cells: Array<{ x: number; y: number; id: number }> = [
    { x: 36, y: 104, id: 0 },
    { x: 84, y: 104, id: 1 },
    { x: 132, y: 104, id: 2 },
    { x: 180, y: 104, id: 3 },
    { x: 84, y: 56, id: 4 },
    { x: 84, y: 152, id: 5 },
  ];
  const oppositeOf: Record<number, number> = { 0: 2, 1: 3, 2: 0, 3: 1 };
  const target = oppositeOf[markCell]!;

  if (variant === STEM_VARIANT) {
    const rects = cells
      .map((cell) => {
        const marked = cell.id === markCell;
        return [
          `<rect x="${cell.x}" y="${cell.y}" width="44" height="44" fill="${
            marked ? INK : PAPER
          }" stroke="${INK}" stroke-width="3"/>`,
          marked ? `<circle cx="${cell.x + 22}" cy="${cell.y + 22}" r="7" fill="${PAPER}"/>` : '',
        ].join('');
      })
      .join('');
    return canvas(rects);
  }

  const candidateIds = [target, markCell, 4, 5];
  const highlight = candidateIds[variant] ?? target;
  const rects = cells
    .map((cell) => {
      const active = cell.id === highlight;
      return [
        `<rect x="${cell.x}" y="${cell.y}" width="44" height="44" fill="${
          active ? INK : PAPER
        }" stroke="${INK}" stroke-width="3"/>`,
        active
          ? `<rect x="${cell.x + 13}" y="${cell.y + 13}" width="18" height="18" fill="${PAPER}"/>`
          : '',
      ].join('');
    })
    .join('');
  return canvas(rects);
}

/* ------------------------------------------------------------------- count */

export function countOfShapes(spec: FigureSpec): number {
  return 5 + (spec.seed % 5);
}

function renderCount(spec: FigureSpec): string {
  const total = countOfShapes(spec);
  const kind = SHAPES[spec.seed % SHAPES.length]!;
  const cols = 3;
  const parts: string[] = [];

  for (let i = 0; i < total; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 64 + col * 64;
    const cy = 64 + row * 64;
    const filled = (i + spec.seed) % 2 === 0;
    parts.push(shapeAt(kind, cx, cy, 20, INK, filled));
  }
  return canvas(parts.join(''));
}

/* --------------------------------------------------------------- direction */

export function compassOf(spec: FigureSpec): CompassDirection {
  return COMPASS[spec.seed % COMPASS.length]!;
}

function renderDirection(spec: FigureSpec): string {
  const dir = compassOf(spec);
  const angleByDir: Record<CompassDirection, number> = {
    Utara: 0,
    Timur: 90,
    Selatan: 180,
    Barat: 270,
  };
  const angle = angleByDir[dir];

  return canvas(
    [
      `<circle cx="128" cy="128" r="84" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`,
      `<text x="128" y="34" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="${INK}">U</text>`,
      `<text x="230" y="134" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="${INK}">T</text>`,
      `<text x="128" y="238" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="${INK}">S</text>`,
      `<text x="26" y="134" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="${INK}">B</text>`,
      `<g transform="translate(128 128) rotate(${angle})">`,
      `<polygon points="0,-64 14,18 0,6 -14,18" fill="${INK}" stroke="${INK}" stroke-width="1.5"/>`,
      `<circle cx="0" cy="0" r="7" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>`,
      '</g>',
    ].join(''),
  );
}

/* -------------------------------------------------------------- gridseries */
/**
 * Keluarga `gridseries`: Sesuai gambar referensi WhatsApp Image 00.41.56 & 00.41.56 (1)
 * Menampilkan 4 kotak berurutan (Kotak 1, Kotak 2, Kotak 3, dan Kotak 4 = ?)
 * Sub-pola berdasarkan `seed % 4`:
 *   0: Kisi jendela 3×5 dengan sel hitam & arsiran bergeser sistematis
 *   1: Baling-baling 4 kelopak (1 kelopak hitam pekat, 3 putih) berputar + ornamen sudut
 *   2: Matriks titik hitam (dot matrix) yang berkurang/bertambah secara teratur (9 → 7 → 5 → 3)
 *   3: Bangun pusat dengan 4 simbol mikro di sudut kotak yang bergeser searah jarum jam
 */
function drawMiniCellContent(submode: number, seed: number, step: number, x: number, y: number, size: number): string {
  const cx = x + size / 2;
  const cy = y + size / 2;

  if (submode === 0) {
    // Kisi jendela 3 kolom × 4 baris seperti gambar 00.41.56 (1) baris 1
    const cols = 3;
    const rows = 4;
    const pad = size * 0.12;
    const gw = size - pad * 2;
    const gh = size - pad * 2;
    const cw = gw / cols;
    const ch = gh / rows;
    const total = cols * rows;
    const blackPos1 = (seed + step) % total;
    const blackPos2 = (seed + 5 + step * 2) % total;
    const shadePos = (seed + 2 + step) % total;
    const parts: string[] = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const idx = r * cols + c;
        const rx = x + pad + c * cw;
        const ry = y + pad + r * ch;
        let fill = PAPER;
        if (idx === blackPos1 || idx === blackPos2) fill = INK;
        else if (idx === shadePos) fill = INK_GRAY;
        parts.push(
          `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${fill}" stroke="${INK}" stroke-width="1.6"/>`,
        );
      }
    }
    return parts.join('');
  }

  if (submode === 1) {
    // Baling-baling 4 kelopak (1 hitam, 3 putih) berputar 90° per langkah seperti gambar 00.41.56 (1) baris 2
    const activePetal = (seed + step) % 4;
    const r = size * 0.28;
    const angles = [0, 90, 180, 270];
    const petals = angles
      .map((deg, idx) => {
        const fill = idx === activePetal ? INK : PAPER;
        return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${deg})"><ellipse cx="0" cy="${(-r * 0.65).toFixed(1)}" rx="${(r * 0.36).toFixed(1)}" ry="${(r * 0.62).toFixed(1)}" fill="${fill}" stroke="${INK}" stroke-width="2"/></g>`;
      })
      .join('');
    // Ornamen sudut bergeser
    const cornerIdx = (seed + step) % 4;
    const cOffsets = [
      [x + size * 0.18, y + size * 0.18],
      [x + size * 0.82, y + size * 0.18],
      [x + size * 0.82, y + size * 0.82],
      [x + size * 0.18, y + size * 0.82],
    ];
    const [ox, oy] = cOffsets[cornerIdx]!;
    return `${petals}<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="${INK}"/><rect x="${(ox! - 4).toFixed(1)}" y="${(oy! - 4).toFixed(1)}" width="8" height="8" fill="${INK}"/>`;
  }

  if (submode === 2) {
    // Dot matrix berkurang/bertambah teratur seperti gambar 00.41.56 (9 -> 7 -> 5 -> 3 atau 2 -> 4 -> 6 -> 8)
    const grid = 3;
    const spacing = size * 0.25;
    const startX = cx - spacing;
    const startY = cy - spacing;
    const dotCounts = seed % 2 === 0 ? [9, 7, 5, 3, 1, 8, 4] : [2, 4, 6, 8, 9, 5, 3];
    const count = dotCounts[step % dotCounts.length]!;
    const parts: string[] = [];
    for (let i = 0; i < Math.min(9, count); i += 1) {
      const r = Math.floor(i / grid);
      const c = i % grid;
      const dx = startX + c * spacing;
      const dy = startY + r * spacing;
      parts.push(`<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${(size * 0.075).toFixed(1)}" fill="${INK}"/>`);
    }
    return parts.join('');
  }

  // submode === 3: Bangun pusat + 4 simbol mikro di sudut yang berputar searah jarum jam (seperti gambar 00.41.56 (1) baris 4)
  const centerShape = SHAPES[(seed + step) % SHAPES.length]!;
  const centerFilled = (seed + step) % 2 === 0;
  const corners = [
    [x + size * 0.2, y + size * 0.2],
    [x + size * 0.8, y + size * 0.2],
    [x + size * 0.8, y + size * 0.8],
    [x + size * 0.2, y + size * 0.8],
  ];
  const microElements = corners
    .map(([mx, my], idx) => {
      const role = (idx - step + 8) % 4;
      if (role === 0) return `<circle cx="${mx!.toFixed(1)}" cy="${my!.toFixed(1)}" r="4.5" fill="${INK}"/>`;
      if (role === 1) return `<rect x="${(mx! - 4).toFixed(1)}" y="${(my! - 4).toFixed(1)}" width="8" height="8" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>`;
      if (role === 2) return `<path d="M${(mx! - 4.5).toFixed(1)} ${my!.toFixed(1)} H${(mx! + 4.5).toFixed(1)} M${mx!.toFixed(1)} ${(my! - 4.5).toFixed(1)} V${(my! + 4.5).toFixed(1)}" stroke="${INK}" stroke-width="2"/>`;
      return `<polygon points="${mx!.toFixed(1)},${(my! - 5).toFixed(1)} ${(mx! + 5).toFixed(1)},${(my! + 4).toFixed(1)} ${(mx! - 5).toFixed(1)},${(my! + 4).toFixed(1)}" fill="${INK}"/>`;
    })
    .join('');

  return `${shapeAt(centerShape, cx, cy, size * 0.2, INK, centerFilled)}${microElements}`;
}

function renderGridSeries(seed: number, variant: number): string {
  const submode = seed % 4;
  if (variant === STEM_VARIANT) {
    // 4 kotak sejajar (2×2 grid berlabel 1, 2, 3, ?) agar besar dan jelas di kanvas 256×256
    const positions = [
      { x: 24, y: 24, step: 0, label: '1' },
      { x: 140, y: 24, step: 1, label: '2' },
      { x: 24, y: 140, step: 2, label: '3' },
    ];
    const boxes = positions
      .map(
        (pos) =>
          `<rect x="${pos.x}" y="${pos.y}" width="92" height="92" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>` +
          drawMiniCellContent(submode, seed, pos.step, pos.x, pos.y, 92),
      )
      .join('');
    const qBox =
      `<rect x="140" y="140" width="92" height="92" fill="${PAPER}" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 4"/>` +
      `<text x="186" y="198" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="700" fill="${INK}">?</text>`;
    return canvas(boxes + qBox);
  }

  // variant 0 = benar (step 3); variant 1..3 = pengecoh (step 0, 1, 2 yang semuanya unik mod 4)
  const stepMap = [3, 0, 1, 2];
  const step = stepMap[variant] ?? 3;
  return canvas(
    `<rect x="36" y="36" width="184" height="184" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>` +
      drawMiniCellContent(submode, seed, step, 36, 36, 184),
  );
}

/* -------------------------------------------------------------- matrixline */
/**
 * Keluarga `matrixline`: Sesuai gambar referensi WhatsApp Image 00.41.57 & 00.41.57 (1)
 * Matriks 3×3 di mana setiap baris memiliki bentuk bingkai luar (Persegi, Lingkaran, Belah Ketupat, Segi Enam),
 * Kolom 1 memuat palang (+) atau garis, Kolom 2 memuat silang (×) dan/atau 4 titik sudut,
 * dan Kolom 3 merupakan penggabungan (superposisi) atau selisih logis Kolom 1 & Kolom 2!
 */
function drawMatrixLineCell(
  frameType: number,
  hasPlus: boolean,
  hasCross: boolean,
  hasDots: boolean,
  hasInnerCircle: boolean,
  x: number,
  y: number,
  size: number,
): string {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.36;
  const parts: string[] = [];

  // Bingkai utama per baris
  if (frameType === 0) {
    parts.push(
      `<rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>`,
    );
  } else if (frameType === 1) {
    parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>`);
  } else if (frameType === 2) {
    parts.push(
      `<polygon points="${cx.toFixed(1)},${(cy - r).toFixed(1)} ${(cx + r).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + r).toFixed(1)} ${(cx - r).toFixed(1)},${cy.toFixed(1)}" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>`,
    );
  } else {
    // Segi enam / kapsul bersudut seperti gambar 00.41.57
    const hr = r * 0.55;
    parts.push(
      `<polygon points="${(cx - hr).toFixed(1)},${(cy - r).toFixed(1)} ${(cx + hr).toFixed(1)},${(cy - r).toFixed(1)} ${(cx + r).toFixed(1)},${(cy - hr).toFixed(1)} ${(cx + r).toFixed(1)},${(cy + hr).toFixed(1)} ${(cx + hr).toFixed(1)},${(cy + r).toFixed(1)} ${(cx - hr).toFixed(1)},${(cy + r).toFixed(1)} ${(cx - r).toFixed(1)},${(cy + hr).toFixed(1)} ${(cx - r).toFixed(1)},${(cy - hr).toFixed(1)}" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>`,
    );
  }

  if (hasPlus) {
    parts.push(
      `<line x1="${(cx - r).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + r).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${INK}" stroke-width="2.2"/>`,
      `<line x1="${cx.toFixed(1)}" y1="${(cy - r).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(cy + r).toFixed(1)}" stroke="${INK}" stroke-width="2.2"/>`,
    );
  }

  if (hasCross) {
    const dr = frameType === 1 || frameType === 2 ? r * 0.71 : r;
    parts.push(
      `<line x1="${(cx - dr).toFixed(1)}" y1="${(cy - dr).toFixed(1)}" x2="${(cx + dr).toFixed(1)}" y2="${(cy + dr).toFixed(1)}" stroke="${INK}" stroke-width="2.2"/>`,
      `<line x1="${(cx + dr).toFixed(1)}" y1="${(cy - dr).toFixed(1)}" x2="${(cx - dr).toFixed(1)}" y2="${(cy + dr).toFixed(1)}" stroke="${INK}" stroke-width="2.2"/>`,
    );
  }

  if (hasDots) {
    const dOff = r * 0.45;
    const dotR = Math.max(2.2, size * 0.042);
    for (const [dx, dy] of [
      [-dOff, -dOff],
      [dOff, -dOff],
      [dOff, dOff],
      [-dOff, dOff],
    ]) {
      parts.push(
        `<circle cx="${(cx + dx!).toFixed(1)}" cy="${(cy + dy!).toFixed(1)}" r="${dotR.toFixed(1)}" fill="${INK}"/>`,
      );
    }
  }

  if (hasInnerCircle) {
    parts.push(
      `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.28).toFixed(1)}" fill="${INK}"/>`,
    );
  }

  return parts.join('');
}

function renderMatrixLine(seed: number, variant: number): string {
  const rowFrames = [seed % 4, (seed + 1) % 4, (seed + 2) % 4];
  const ruleMode = seed % 3; // 0: Col3 = Col1 + Col2, 1: Col1 dilengkapi titik, 2: Col3 + titik pusat

  function cellConfig(row: number, col: number) {
    const frame = rowFrames[row]!;
    if (ruleMode === 0) {
      return {
        frame,
        hasPlus: col === 0 || col === 2,
        hasCross: col === 1 || col === 2,
        hasDots: col === 1 || col === 2,
        hasInnerCircle: false,
      };
    }
    if (ruleMode === 1) {
      return {
        frame,
        hasPlus: col === 0 || col === 2,
        hasCross: col === 1 || col === 2,
        hasDots: col === 0 || col === 2,
        hasInnerCircle: col === 1,
      };
    }
    return {
      frame,
      hasPlus: col !== 1,
      hasCross: col !== 0,
      hasDots: col === 2,
      hasInnerCircle: col === 0 || col === 2,
    };
  }

  if (variant === STEM_VARIANT) {
    const cellSize = 68;
    const start = 20;
    const gap = 6;
    const cells: string[] = [];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const x = start + c * (cellSize + gap);
        const y = start + r * (cellSize + gap);
        if (r === 2 && c === 2) {
          cells.push(
            `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${PAPER}" stroke="${INK}" stroke-width="2" stroke-dasharray="5 3"/>`,
            `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 10}" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="${INK}">?</text>`,
          );
        } else {
          const cfg = cellConfig(r, c);
          cells.push(
            `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${PAPER}" stroke="${INK_LIGHT}" stroke-width="1"/>`,
            drawMatrixLineCell(cfg.frame, cfg.hasPlus, cfg.hasCross, cfg.hasDots, cfg.hasInnerCircle, x, y, cellSize),
          );
        }
      }
    }
    return canvas(cells.join(''));
  }

  const target = cellConfig(2, 2);
  const optionConfigs = [
    target, // 0: benar
    { ...target, hasPlus: !target.hasPlus }, // 1: tanpa/lebih plus
    { ...target, hasDots: !target.hasDots, hasInnerCircle: !target.hasInnerCircle }, // 2: beda titik
    { ...target, frame: (target.frame + 1) % 4, hasCross: !target.hasCross }, // 3: beda bingkai & silang
  ];
  const pick = optionConfigs[variant] ?? target;
  return canvas(
    drawMatrixLineCell(pick.frame, pick.hasPlus, pick.hasCross, pick.hasDots, pick.hasInnerCircle, 32, 32, 192),
  );
}

/* ------------------------------------------------------------- matrixshape */
/**
 * Keluarga `matrixshape`: Sesuai gambar referensi WhatsApp Image 00.41.57 (2) & (3)
 * Matriks 3×3 kombinasi bangun bersarang (nested shapes), juring lingkaran hitam-putih,
 * dan inversi warna hitam-putih antar baris & kolom.
 */
function drawNestedCell(
  outerKind: ShapeKind,
  innerKind: ShapeKind,
  outerFilled: boolean,
  innerFilled: boolean,
  hasCrossbar: boolean,
  x: number,
  y: number,
  size: number,
): string {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const outerR = size * 0.36;
  const innerR = size * 0.17;

  const outerColor = outerFilled ? INK : PAPER;
  const innerColor = innerFilled ? (outerFilled ? PAPER : INK) : outerFilled ? INK : PAPER;
  const innerStroke = outerFilled ? PAPER : INK;

  const parts: string[] = [shapeAt(outerKind, cx, cy, outerR, outerColor, outerFilled)];

  if (hasCrossbar) {
    parts.push(
      `<line x1="${(cx - outerR * 0.85).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + outerR * 0.85).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${innerStroke}" stroke-width="2.2"/>`,
    );
  }

  // Gambar bangun dalam dengan kontras penuh agar selalu tampak jelas di atas bangun luar
  const strokeAttr = `stroke="${innerStroke}" stroke-width="2.5"`;
  if (innerKind === 'circle') {
    parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${innerR.toFixed(1)}" fill="${innerColor}" ${strokeAttr}/>`);
  } else if (innerKind === 'square') {
    parts.push(
      `<rect x="${(cx - innerR).toFixed(1)}" y="${(cy - innerR).toFixed(1)}" width="${(innerR * 2).toFixed(1)}" height="${(innerR * 2).toFixed(1)}" fill="${innerColor}" ${strokeAttr}/>`,
    );
  } else if (innerKind === 'triangle') {
    parts.push(
      `<polygon points="${cx.toFixed(1)},${(cy - innerR).toFixed(1)} ${(cx - innerR).toFixed(1)},${(cy + innerR).toFixed(1)} ${(cx + innerR).toFixed(1)},${(cy + innerR).toFixed(1)}" fill="${innerColor}" ${strokeAttr}/>`,
    );
  } else {
    parts.push(
      `<polygon points="${cx.toFixed(1)},${(cy - innerR).toFixed(1)} ${(cx + innerR).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + innerR).toFixed(1)} ${(cx - innerR).toFixed(1)},${cy.toFixed(1)}" fill="${innerColor}" ${strokeAttr}/>`,
    );
  }

  return parts.join('');
}

function renderMatrixShape(seed: number, variant: number): string {
  const rowOuters: ShapeKind[] = [
    SHAPES[seed % 4]!,
    SHAPES[(seed + 1) % 4]!,
    SHAPES[(seed + 2) % 4]!,
  ];
  const colInners: ShapeKind[] = [
    SHAPES[(seed + 1) % 4]!,
    SHAPES[(seed + 2) % 4]!,
    SHAPES[(seed + 3) % 4]!,
  ];

  function cellSpec(r: number, c: number) {
    return {
      outerKind: rowOuters[r]!,
      innerKind: colInners[c]!,
      outerFilled: (r + c + seed) % 2 === 0,
      innerFilled: c === 1,
      hasCrossbar: r === 1 || c === 2,
    };
  }

  if (variant === STEM_VARIANT) {
    const cellSize = 68;
    const start = 20;
    const gap = 6;
    const cells: string[] = [];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const x = start + c * (cellSize + gap);
        const y = start + r * (cellSize + gap);
        if (r === 2 && c === 2) {
          cells.push(
            `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${PAPER}" stroke="${INK}" stroke-width="2" stroke-dasharray="5 3"/>`,
            `<text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 10}" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700" fill="${INK}">?</text>`,
          );
        } else {
          const sp = cellSpec(r, c);
          cells.push(
            `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${PAPER}" stroke="${INK_LIGHT}" stroke-width="1"/>`,
            drawNestedCell(sp.outerKind, sp.innerKind, sp.outerFilled, sp.innerFilled, sp.hasCrossbar, x, y, cellSize),
          );
        }
      }
    }
    return canvas(cells.join(''));
  }

  const target = cellSpec(2, 2);
  const options = [
    target, // 0: benar
    { ...target, outerFilled: !target.outerFilled }, // 1: warna luar terbalik
    { ...target, innerKind: rowOuters[0]!, innerFilled: !target.innerFilled }, // 2: bangun dalam salah
    { ...target, outerKind: rowOuters[1]!, hasCrossbar: !target.hasCrossbar }, // 3: bangun luar & garis salah
  ];
  const pick = options[variant] ?? target;
  return canvas(
    drawNestedCell(pick.outerKind, pick.innerKind, pick.outerFilled, pick.innerFilled, pick.hasCrossbar, 32, 32, 192),
  );
}

/* ------------------------------------------------------------------ public */

/**
 * Varian opsi (0..3) yang benar untuk satu spesifikasi.
 *
 * Seluruh generator menempatkan konstruksi yang benar pada `variant = 0`;
 * urutan tampil pada opsi A–D diacak di `questions/figural.ts` sehingga kunci
 * tidak selalu jatuh di label A.
 */
export function correctOptionVariant(_spec: FigureSpec): number {
  return 0;
}

/** Render SVG deterministik untuk stem (`STEM_VARIANT`) atau pilihan `0..3`. */
export function renderFigure(spec: FigureSpec, variant: number = STEM_VARIANT): string {
  switch (spec.family) {
    case 'series':
      return renderSeries(spec.seed, variant);
    case 'rotation':
      return renderRotation(spec.seed, variant);
    case 'mirror':
      return renderMirror(spec.seed, variant);
    case 'analogy':
      return renderAnalogy(spec.seed, variant);
    case 'net':
      return renderNet(spec.seed, variant);
    case 'count':
      return renderCount(spec);
    case 'direction':
      return renderDirection(spec);
    case 'gridseries':
      return renderGridSeries(spec.seed, variant);
    case 'matrixline':
      return renderMatrixLine(spec.seed, variant);
    case 'matrixshape':
      return renderMatrixShape(spec.seed, variant);
  }
}

/** Teks alternatif aksesibel untuk setiap gambar. */
export function figureAltText(spec: FigureSpec, variant: number): string {
  const familyName: Record<FigureFamily, string> = {
    series: 'Deret bentuk figural hitam-putih',
    rotation: 'Rotasi bentuk figural hitam-putih',
    mirror: 'Pencerminan bentuk figural hitam-putih',
    analogy: 'Analogi bentuk figural hitam-putih',
    net: 'Jaring-jaring kubus hitam-putih',
    count: 'Himpunan bentuk geometri hitam-putih untuk dihitung',
    direction: 'Kompas penunjuk arah mata angin hitam-putih',
    gridseries: 'Deret matriks dan pergeseran elemen visual hitam-putih',
    matrixline: 'Matriks 3x3 superposisi garis dan bangun hitam-putih',
    matrixshape: 'Matriks 3x3 transformasi bangun bersarang hitam-putih',
  };
  const role =
    variant === STEM_VARIANT ? 'gambar soal' : `pilihan ${['A', 'B', 'C', 'D'][variant] ?? variant}`;
  return `${familyName[spec.family]} (variasi ${spec.seed + 1}, ${role})`;
}
