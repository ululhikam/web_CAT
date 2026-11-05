/**
 * Generator gambar figural untuk seed (F3-21).
 *
 * Aset **tidak** disimpan sebagai berkas biner di repo. Setiap gambar
 * dibangkitkan deterministik dari spesifikasi kecil (`FigureSpec`) menjadi
 * string SVG, lalu `MediaService.storeBuffer` mengubahnya menjadi WebP 256×256.
 *
 * Keuntungan:
 *   - repo tetap ringan (tidak ada ratusan berkas biner);
 *   - gambar dan kunci jawaban tidak bisa tidak sinkron karena keduanya berasal
 *     dari spesifikasi yang sama;
 *   - ukuran, latar, dan gaya konsisten sehingga aman dipakai di runner.
 *
 * Kunci kebenaran: `correctOptionVariant(spec)` menghitung sendiri indeks
 * gambar yang benar dari geometri gambar. Data soal tidak menulis kunci secara
 * manual, sehingga kunci tidak mungkin bertentangan dengan gambar.
 */

export const FIGURE_SIZE = 256;

/** Varian STEM memakai indeks khusus karena bukan pilihan jawaban. */
export const STEM_VARIANT = -1;

export type FigureFamily =
  | 'series'
  | 'rotation'
  | 'mirror'
  | 'analogy'
  | 'net'
  | 'count'
  | 'direction';

export interface FigureSpec {
  family: FigureFamily;
  /** Angka kecil yang membedakan variasi di dalam satu keluarga. */
  seed: number;
}

const INK = '#1e3a8a';
const INK_ALT = '#b91c1c';
const INK_TEAL = '#0f766e';
const PAPER = '#ffffff';
const GRID = '#a8b3c4';

/* ------------------------------------------------------------------ bentuk */

type ShapeKind = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'star';

const SHAPES: readonly ShapeKind[] = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'cross',
  'star',
];

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Bentuk dasar berpusat di (cx, cy) dengan jari-jari r. */
function shapeMarkup(
  kind: ShapeKind,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  rotation = 0,
): string {
  const r = Math.max(4, radius);
  let body: string;

  switch (kind) {
    case 'circle':
      body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
      break;
    case 'square':
      body =
        `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" ` +
        `rx="${r * 0.12}" fill="${fill}"/>`;
      break;
    case 'triangle':
      body = `<polygon points="${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}" fill="${fill}"/>`;
      break;
    case 'diamond':
      body = `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="${fill}"/>`;
      break;
    case 'cross': {
      const arm = r * 0.42;
      body =
        `<path d="M${cx - arm},${cy - r} h${arm * 2} v${r - arm} h${r - arm} v${arm * 2} ` +
        `h${-(r - arm)} v${r - arm} h${-arm * 2} v${-(r - arm)} h${-(r - arm)} v${-arm * 2} ` +
        `h${r - arm} z" fill="${fill}"/>`;
      break;
    }
    case 'star': {
      const inner = r * 0.46;
      const points: string[] = [];
      for (let index = 0; index < 10; index += 1) {
        const angle = (Math.PI / 5) * index - Math.PI / 2;
        const distance = index % 2 === 0 ? r : inner;
        points.push(`${round(cx + distance * Math.cos(angle))},${round(cy + distance * Math.sin(angle))}`);
      }
      body = `<polygon points="${points.join(' ')}" fill="${fill}"/>`;
      break;
    }
  }

  return rotation === 0 ? body : `<g transform="rotate(${rotation} ${cx} ${cy})">${body}</g>`;
}

function frame(inner: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${FIGURE_SIZE}" height="${FIGURE_SIZE}" ` +
    `viewBox="0 0 ${FIGURE_SIZE} ${FIGURE_SIZE}"><rect width="${FIGURE_SIZE}" ` +
    `height="${FIGURE_SIZE}" fill="${PAPER}"/>${inner}</svg>`
  );
}

function shapeAt(seed: number): ShapeKind {
  return SHAPES[((seed % SHAPES.length) + SHAPES.length) % SHAPES.length]!;
}

/* --------------------------------------------------------- keluarga: deret */

/** Satu baris berisi `count` bentuk, lebar menyesuaikan jumlah. */
function seriesRow(
  count: number,
  kind: ShapeKind,
  centerY: number,
  maxRadius: number,
  accentFirst: boolean,
): string {
  const gap = FIGURE_SIZE / (count + 1);
  const radius = Math.min(maxRadius, gap * 0.34);
  let out = '';
  for (let index = 0; index < count; index += 1) {
    const accent = index % 2 === 0 ? accentFirst : !accentFirst;
    out += shapeMarkup(kind, gap * (index + 1), centerY, radius, accent ? INK_ALT : INK);
  }
  return out;
}

/** Susunan jumlah bentuk pada pilihan jawaban; satu di antaranya benar. */
function seriesOptionCounts(seed: number): number[] {
  const base = [3, 2, 4, 5];
  const shift = seed % base.length;
  return [...base.slice(shift), ...base.slice(0, shift)];
}

/* ------------------------------------------------------- keluarga: rotasi */

/**
 * Bentuk "L" asimetris (batang tegak + kaki mendatar). Asimetris supaya
 * rotasi 0°/90°/180°/270° terlihat berbeda satu sama lain.
 */
function lShapeMarkup(cx: number, cy: number, size: number, rotation: number, fill: string): string {
  const thickness = size * 0.4;
  const x0 = round(cx - size);
  const y0 = round(cy - size);
  const height = round(size * 2);
  const width = round(size * 2);
  const path =
    `M${x0},${y0} h${round(thickness)} v${round(height - thickness)} ` +
    `h${round(width - thickness)} v${round(thickness)} h${round(-width)} z`;
  return `<g transform="rotate(${rotation} ${cx} ${cy})"><path d="${path}" fill="${fill}"/></g>`;
}

/**
 * Langkah rotasi antar gambar pada soal (derajat, selalu searah jarum jam).
 *
 * 180° sengaja tidak dipakai: pilihan jawaban `2×langkah` dan `0°` akan
 * berimpit, sehingga dua gambar terlihat identik dan soal tidak punya satu
 * jawaban benar.
 */
export function rotationStepDegrees(seed: number): number {
  const steps = [90, 45, 135, 60];
  return steps[seed % steps.length]!;
}

/* ---------------------------------------------------- keluarga: pencerminan */

/** Gambar asimetris untuk soal pencerminan; bentuk & posisi bervariasi. */
function asymmetricMarkup(seed: number): string {
  const scale = 0.82 + (seed % 3) * 0.09;
  const shapes: ShapeKind[] = [shapeAt(seed), shapeAt(seed + 2), shapeAt(seed + 4)];
  return (
    `<g transform="translate(128 128) scale(${round(scale)}) translate(-128 -128)">` +
    shapeMarkup(shapes[0]!, 92, 96, 46, INK) +
    shapeMarkup(shapes[1]!, 160, 150, 20, INK_ALT) +
    shapeMarkup(shapes[2]!, 164, 70, 15, INK_TEAL) +
    `</g>`
  );
}

/* ------------------------------------------------------- keluarga: analogi */

function arrowMarkup(x1: number, x2: number, y: number): string {
  return (
    `<line x1="${x1}" y1="${y}" x2="${x2 - 12}" y2="${y}" stroke="#475569" stroke-width="3"/>` +
    `<polygon points="${x2},${y} ${x2 - 13},${y - 7} ${x2 - 13},${y + 7}" fill="#475569"/>`
  );
}

/* ------------------------------------------------------ keluarga: jaring kubus */

const NET_OPPOSITE: Record<number, number> = { 0: 2, 2: 0, 1: 3, 3: 1, 4: 5, 5: 4 };

/** Koordinat kotak jaring (kolom, baris) 4×3 pola salib. */
const NET_CELLS: ReadonlyArray<{ col: number; row: number }> = [
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 3, row: 1 },
  { col: 1, row: 0 },
  { col: 1, row: 2 },
];

const NET_CELL = 52;
const NET_ORIGIN_X = 26;
const NET_ORIGIN_Y = 52;

function netCellMarkup(index: number, symbol: ShapeKind, marked: boolean): string {
  const cell = NET_CELLS[index]!;
  const x = NET_ORIGIN_X + cell.col * NET_CELL;
  const y = NET_ORIGIN_Y + cell.row * NET_CELL;
  return (
    `<rect x="${x}" y="${y}" width="${NET_CELL}" height="${NET_CELL}" fill="#f8fafc" ` +
    `stroke="${marked ? INK_ALT : '#94a3b8'}" stroke-width="${marked ? 4 : 2}"/>` +
    shapeMarkup(symbol, x + NET_CELL / 2, y + NET_CELL / 2, NET_CELL * 0.3, INK)
  );
}

/** Simbol unik per sisi jaring (diambil dari 6 bentuk berbeda). */
function netSymbols(seed: number): ShapeKind[] {
  return Array.from({ length: 6 }, (_, index) => shapeAt(seed + index));
}

/** Empat sisi yang ditampilkan sebagai pilihan; satu adalah sisi seberang. */
function netOptionFaces(marked: number): number[] {
  const opposite = NET_OPPOSITE[marked]!;
  const others = [0, 1, 2, 3, 4, 5].filter((face) => face !== marked && face !== opposite);
  const ordered = [opposite, ...others.slice(0, 3)];
  // Geser deterministik agar kunci tidak selalu di label A.
  const shift = marked % 4;
  return [...ordered.slice(shift), ...ordered.slice(0, shift)];
}

/* -------------------------------------------------------- keluarga: hitung */

function countAnswer(spec: FigureSpec): number {
  return 5 + (spec.seed % 4);
}

/* --------------------------------------------------------- keluarga: kompas */

const DIRECTIONS = ['Utara', 'Timur', 'Selatan', 'Barat'] as const;
export type CompassDirection = (typeof DIRECTIONS)[number];

function directionAnswer(spec: FigureSpec): CompassDirection {
  return DIRECTIONS[spec.seed % DIRECTIONS.length]!;
}

function compassMarkup(degrees: number): string {
  const cx = FIGURE_SIZE / 2;
  const cy = FIGURE_SIZE / 2;
  const ticks = DIRECTIONS.map((_, index) => {
    const angle = (index * Math.PI) / 2 - Math.PI / 2;
    return `<circle cx="${round(cx + Math.cos(angle) * 96)}" cy="${round(cy + Math.sin(angle) * 96)}" r="4" fill="${GRID}"/>`;
  }).join('');

  return (
    `<circle cx="${cx}" cy="${cy}" r="106" fill="none" stroke="${GRID}" stroke-width="2"/>` +
    ticks +
    `<g transform="rotate(${degrees} ${cx} ${cy})">` +
    `<line x1="${cx}" y1="${cy + 62}" x2="${cx}" y2="${cy - 62}" stroke="${INK}" stroke-width="8"/>` +
    `<polygon points="${cx},${cy - 88} ${cx - 18},${cy - 52} ${cx + 18},${cy - 52}" fill="${INK}"/>` +
    `</g>` +
    `<circle cx="${cx}" cy="${cy}" r="9" fill="${INK_ALT}"/>`
  );
}

/* ------------------------------------------------------------------ render */

/** Jumlah pilihan gambar yang dihasilkan sebuah spesifikasi. */
export function optionVariantCount(_spec: FigureSpec): number {
  return 4;
}

/**
 * Indeks varian gambar yang benar.
 *
 * Dihitung dari geometri, bukan dari data soal — kunci jawaban selalu
 * konsisten dengan gambar yang dilihat peserta.
 */
export function correctOptionVariant(spec: FigureSpec): number {
  switch (spec.family) {
    case 'series':
      // Deret 1, 2, 3 → lanjutan harus 4 bentuk.
      return seriesOptionCounts(spec.seed).indexOf(4);
    case 'rotation':
      // Pilihan A selalu kelanjutan rotasi; lihat `renderFigure`.
      return 0;
    case 'mirror':
      // Pilihan A adalah cermin terhadap sumbu mendatar.
      return 0;
    case 'analogy':
      // Aturan: bentuk tetap, ukuran membesar.
      return 0;
    case 'net': {
      const marked = spec.seed % 6;
      return netOptionFaces(marked).indexOf(NET_OPPOSITE[marked]!);
    }
    case 'count':
    case 'direction':
      // Soal pilihan teks: kuncinya teks, bukan varian gambar.
      return 0;
  }
}

/** Angka jawaban soal berhitung gambar (`count`). */
export function countOfShapes(spec: FigureSpec): number {
  return countAnswer(spec);
}

/** Arah jawaban soal kompas (`direction`). */
export function compassOf(spec: FigureSpec): CompassDirection {
  return directionAnswer(spec);
}

/**
 * Render satu gambar.
 *
 * `variant = STEM_VARIANT` menghasilkan gambar stem (soal); `0..3`
 * menghasilkan gambar pilihan jawaban.
 */
export function renderFigure(spec: FigureSpec, variant: number): string {
  const isStem = variant === STEM_VARIANT;
  const index = ((variant % 4) + 4) % 4;

  switch (spec.family) {
    case 'series': {
      const kind = shapeAt(spec.seed);
      const accentFirst = spec.seed % 2 === 0;
      if (isStem) {
        // Tiga baris 1, 2, 3 bentuk: pola "bertambah satu".
        return frame(
          [1, 2, 3]
            .map((count, row) => seriesRow(count, kind, 58 + row * 70, 26, accentFirst))
            .join(''),
        );
      }
      const count = seriesOptionCounts(spec.seed)[index]!;
      return frame(seriesRow(count, kind, FIGURE_SIZE / 2, 54, accentFirst));
    }

    case 'rotation': {
      const step = rotationStepDegrees(spec.seed);
      if (isStem) {
        // Dua panel: L pada 0° lalu `step` → peserta menyimpulkan langkahnya.
        return frame(
          lShapeMarkup(76, 128, 34, 0, INK) + lShapeMarkup(180, 128, 34, step, INK_ALT),
        );
      }
      // Pilihan: 2×langkah (benar), 0°, 1×langkah, 3×langkah.
      const angles = [step * 2, 0, step, step * 3].map((angle) => ((angle % 360) + 360) % 360);
      return frame(lShapeMarkup(FIGURE_SIZE / 2, FIGURE_SIZE / 2, 58, angles[index]!, INK));
    }

    case 'mirror': {
      const figure = asymmetricMarkup(spec.seed);
      if (isStem) {
        // Gambar asli + sumbu mendatar putus-putus: acuan pencerminan.
        return frame(
          `<g transform="translate(0,-40)">${figure}</g>` +
            `<line x1="18" y1="206" x2="238" y2="206" stroke="#64748b" stroke-width="2" ` +
            `stroke-dasharray="9 7"/>`,
        );
      }
      const transforms = [
        // A: cermin terhadap sumbu mendatar (benar).
        'translate(0,296) scale(1,-1)',
        // B: gambar asli tanpa perubahan.
        'translate(0,-40)',
        // C: rotasi 180°.
        'translate(256,216) scale(-1,-1)',
        // D: cermin terhadap sumbu tegak.
        'translate(256,-40) scale(-1,1)',
      ];
      return frame(`<g transform="${transforms[index]}">${figure}</g>`);
    }

    case 'analogy': {
      const base = shapeAt(spec.seed);
      // Bentuk pembanding sengaja berbeda dari `base` agar aturannya jelas.
      const demo = shapeAt(spec.seed + 3);
      if (isStem) {
        return frame(
          // Baris 1: contoh — bentuk sama, ukuran membesar.
          shapeMarkup(demo, 60, 84, 20, INK) +
            arrowMarkup(96, 148, 84) +
            shapeMarkup(demo, 194, 84, 42, INK) +
            // Baris 2: soal.
            shapeMarkup(base, 60, 180, 20, INK_ALT) +
            arrowMarkup(96, 148, 180) +
            `<text x="194" y="200" font-family="Arial, Helvetica, sans-serif" font-size="62" ` +
            `font-weight="bold" fill="#94a3b8" text-anchor="middle">?</text>`,
        );
      }
      // Semua pilihan berukuran besar; yang membedakan hanya bentuknya.
      const variants = [base, demo, shapeAt(spec.seed + 1), shapeAt(spec.seed + 2)];
      return frame(
        shapeMarkup(variants[index]!, FIGURE_SIZE / 2, FIGURE_SIZE / 2, 46, INK),
      );
    }

    case 'net': {
      const symbols = netSymbols(spec.seed);
      const marked = spec.seed % 6;

      if (isStem) {
        return frame(
          NET_CELLS.map((_, cell) => netCellMarkup(cell, symbols[cell]!, cell === marked)).join(''),
        );
      }

      const face = netOptionFaces(marked)[index]!;
      return frame(shapeMarkup(symbols[face]!, FIGURE_SIZE / 2, FIGURE_SIZE / 2, 62, INK));
    }

    case 'count': {
      const total = countAnswer(spec);
      const kind = shapeAt(spec.seed + 2);
      const accentFirst = spec.seed % 2 === 0;
      let out = '';
      for (let shape = 0; shape < total; shape += 1) {
        const accent = shape % 2 === 0 ? accentFirst : !accentFirst;
        out += shapeMarkup(
          kind,
          58 + (shape % 3) * 70,
          58 + Math.floor(shape / 3) * 70,
          24,
          accent ? INK_ALT : INK,
        );
      }
      return frame(out);
    }

    case 'direction':
      return frame(compassMarkup(DIRECTIONS.indexOf(directionAnswer(spec)) * 90));
  }
}

/** Teks alternatif gambar; wajib ada agar render punya `alt`. */
export function figureAltText(spec: FigureSpec, variant: number): string {
  const suffix = variant === STEM_VARIANT ? 'gambar soal' : `pilihan ${'ABCD'[((variant % 4) + 4) % 4]}`;

  switch (spec.family) {
    case 'series':
      return `Deret bentuk geometri bertambah (${suffix})`;
    case 'rotation':
      return `Bentuk L yang diputar (${suffix})`;
    case 'mirror':
      return `Bentuk asimetris dan sumbu cermin mendatar (${suffix})`;
    case 'analogy':
      return `Analogi figural: ukuran bentuk membesar (${suffix})`;
    case 'net':
      return `Jaring-jaring kubus dengan satu sisi bertanda merah (${suffix})`;
    case 'count':
      return 'Kumpulan bentuk geometri untuk dihitung';
    case 'direction':
      return 'Kompas dengan jarum penunjuk arah';
  }
}
