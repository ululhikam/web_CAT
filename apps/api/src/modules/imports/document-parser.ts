import {
  QUESTION_TYPES,
  STAGE_CODES,
  type QuestionType,
  type StageCode,
  type SubtestCode,
} from '@webcat/contracts';
import { buildPayload, parseCorrectLabels, scoreConfidence } from './draft';
import type { ImportSettings, ParsedFile, ParsedRow } from './imports.types';

/* ------------------------------------------------------------------ regexes */

const NUMBERED_START = /^\s*(\d{1,3})\s*[.)]\s+(.*)$/;
const OPTION_START = /^\s*\**([A-Ea-e])\**\s*[.)]\s+(.*)$/;
const ANSWER_LINE =
  /^\s*(?:jawaban|kunci(?:\s+jawaban)?)\s*[:=]\s*\**\s*([A-Ea-e](?:\s*[,/]\s*[A-Ea-e])*)\s*\**\s*$/i;
const EXPLANATION_START = /^\s*(?:pembahasan|penjelasan)\s*[:=]\s*(.*)$/i;
const SUBTEST_HEADING =
  /^\s*(?:sub\s*tes|bagian|tes)?\s*[:-]?\s*(KECERDASAN|KEPRIBADIAN|KECERMATAN|PAS+HAND|TPA|TPK)\s*$/i;
const ANSWER_KEY_BLOCK = /^\s*(?:kunci\s+jawaban|kunci)\s*:?\s*$/i;
const IMAGE_TOKEN = /\[\[IMG:(\d+)\]\]/g;

const SUBTEST_FROM_HEADING: Record<string, SubtestCode> = {
  KECERDASAN: 'KECERDASAN',
  KEPRIBADIAN: 'KEPRIBADIAN',
  KECERMATAN: 'KECERMATAN',
  PASSHAND: 'PASS_HAND',
  TPA: 'TPA',
  TPK: 'TPK',
};

const STAGE_OF: Record<SubtestCode, StageCode> = {
  KECERDASAN: 'PSIKOLOGI',
  KEPRIBADIAN: 'PSIKOLOGI',
  KECERMATAN: 'PSIKOLOGI',
  PASS_HAND: 'PSIKOLOGI',
  TPA: 'TPA',
  TPK: 'TPK',
};

/** Subtes yang sah per stage; dipakai validasi target impor. */
export const SUBTEST_OF_STAGE_HINT: Record<StageCode, readonly SubtestCode[]> = {
  PSIKOLOGI: ['KECERDASAN', 'KEPRIBADIAN', 'KECERMATAN', 'PASS_HAND'],
  TPA: ['TPA'],
  TPK: ['TPK'],
};

/* ------------------------------------------------------------------ types */

export interface SourceLine {
  text: string;
  page?: number;
  /** Koordinat Y (origin kiri-bawah) untuk PDF; tidak ada untuk DOCX. */
  y?: number;
}

export interface SourceImage {
  index: number;
  page?: number;
  y?: number;
  height?: number;
}

export interface BlockImage {
  index: number;
  role: 'STEM' | 'OPTION';
  optionLabel?: string;
}

export interface RawBlock {
  rowNumber: number;
  page?: number;
  number?: number;
  lines: string[];
  heading?: SubtestCode;
  images: BlockImage[];
  /** Rentang vertikal blok (koordinat PDF) untuk penempatan gambar. */
  yMin?: number;
  yMax?: number;
  optionPositions: Array<{ label: string; y?: number }>;
}

interface KeyEntry {
  number: number;
  labels: string[];
}

export interface DocParseInput {
  sourceKind: 'PDF' | 'DOCX';
  lines: SourceLine[];
  /** Gambar tanpa token inline (PDF); ditempatkan lewat koordinat. */
  images?: SourceImage[];
  settings: ImportSettings;
  pageCount: number;
  extractorWarnings: string[];
}

/* ------------------------------------------------------------------ segmentation */

/**
 * Segmentasi baris teks menjadi blok soal.
 *
 * Heuristik berlapis (§10.4B): nomor soal, heading subtes, kunci jawaban
 * inline, dan blok kunci di akhir dokumen. Token `[[IMG:n]]` (DOCX) dipakai
 * untuk menempatkan gambar relatif terhadap stem/opsi.
 */
export function segmentLines(lines: SourceLine[]): {
  blocks: RawBlock[];
  keyEntries: KeyEntry[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const blocks: RawBlock[] = [];
  const keyEntries: KeyEntry[] = [];

  let current: RawBlock | null = null;
  let heading: SubtestCode | undefined;
  let inKeySection = false;
  let rowNumber = 0;

  const flush = () => {
    if (current) {
      if (current.lines.some((line) => line.trim().length > 0) || current.images.length > 0) {
        blocks.push(current);
      }
      current = null;
    }
  };

  for (const line of lines) {
    const tokens = [...line.text.matchAll(IMAGE_TOKEN)].map((match) => Number(match[1]));
    const raw = line.text
      .replace(IMAGE_TOKEN, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trimEnd();

    if (!raw.trim()) {
      // Baris berisi gambar saja menempel ke blok aktif.
      if (current) tokens.forEach((index) => attachImage(current!, index));
      continue;
    }

    const headingMatch = SUBTEST_HEADING.exec(raw);
    if (headingMatch) {
      flush();
      inKeySection = false;
      heading = SUBTEST_FROM_HEADING[headingMatch[1]!.toUpperCase().replace(/\s+/g, '')];
      continue;
    }

    if (ANSWER_KEY_BLOCK.test(raw)) {
      flush();
      inKeySection = true;
      continue;
    }

    if (inKeySection) {
      const parsed = parseKeyLine(raw);
      if (parsed.length > 0) {
        keyEntries.push(...parsed);
        continue;
      }
      // Baris petunjuk pendek mengakhiri blok kunci.
      if (raw.length < 60) inKeySection = false;
    }

    const numbered = NUMBERED_START.exec(raw);
    if (numbered && isPlausibleQuestionStart(raw)) {
      flush();
      rowNumber += 1;
      current = {
        rowNumber,
        page: line.page,
        number: Number(numbered[1]),
        heading,
        lines: [numbered[2] ?? ''],
        images: [],
        optionPositions: [],
        yMin: line.y,
        yMax: line.y,
      };
      tokens.forEach((index) => attachImage(current!, index));
      continue;
    }

    if (!current) continue;

    current.lines.push(raw);
    if (line.y !== undefined) {
      current.yMin = current.yMin === undefined ? line.y : Math.min(current.yMin, line.y);
      current.yMax = current.yMax === undefined ? line.y : Math.max(current.yMax, line.y);
    }

    const option = OPTION_START.exec(raw);
    if (option) {
      current.optionPositions.push({ label: option[1]!.toUpperCase(), y: line.y });
    }

    tokens.forEach((index) => attachImage(current!, index));
  }

  flush();

  if (blocks.length === 0) warnings.push('Tidak ada blok soal bernomor yang terdeteksi');

  return { blocks, keyEntries, warnings };
}

/** Token inline: gambar sebelum opsi pertama = STEM, sesudahnya = opsi terakhir. */
function attachImage(block: RawBlock, index: number): void {
  if (block.images.some((image) => image.index === index)) return;
  const lastOption = block.optionPositions[block.optionPositions.length - 1];
  if (lastOption) {
    block.images.push({ index, role: 'OPTION', optionLabel: lastOption.label });
  } else {
    block.images.push({ index, role: 'STEM' });
  }
}

function isPlausibleQuestionStart(line: string): boolean {
  // Hindari salah deteksi tahun ("2024.") dan nomor halaman.
  return line.trim().length >= 6 && !/^\s*\d{4}\s*[.)]\s/.test(line);
}

function parseKeyLine(line: string): KeyEntry[] {
  const entries: KeyEntry[] = [];
  const pattern = /(\d{1,3})\s*[.)]?\s*[-:=]?\s*([A-Ea-e])(?=\s|$|[,;])/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line)) !== null) {
    entries.push({ number: Number(match[1]), labels: [match[2]!.toUpperCase()] });
  }
  return entries;
}

/**
 * Penempatan gambar PDF berdasarkan koordinat: gambar yang berada di rentang
 * vertikal blok menjadi milik blok tersebut; jika tidak, blok terdekat pada
 * halaman yang sama. Posisi di atas opsi pertama = STEM.
 */
function assignPdfImages(blocks: RawBlock[], images: SourceImage[]): void {
  const tolerance = 24;

  for (const image of images) {
    const onPage = blocks.filter((block) => block.page === image.page);
    const candidates = onPage.length > 0 ? onPage : blocks;
    if (candidates.length === 0) continue;

    const y = image.y ?? 0;
    const imageTop = y + (image.height ?? 0);

    let target = candidates.find(
      (block) =>
        block.yMin !== undefined &&
        block.yMax !== undefined &&
        imageTop >= block.yMin - tolerance &&
        y <= block.yMax + tolerance,
    );

    if (!target) {
      let best = Number.POSITIVE_INFINITY;
      for (const block of candidates) {
        const center = ((block.yMin ?? 0) + (block.yMax ?? 0)) / 2;
        const distance = Math.abs(center - y);
        if (distance < best) {
          best = distance;
          target = block;
        }
      }
    }

    if (!target) continue;
    if (target.images.some((entry) => entry.index === image.index)) continue;

    const firstOption = target.optionPositions[0]?.y;
    if (firstOption === undefined || y > firstOption + tolerance) {
      target.images.push({ index: image.index, role: 'STEM' });
      continue;
    }

    const nearest = [...target.optionPositions]
      .filter((entry) => entry.y !== undefined && entry.y <= y + tolerance)
      .sort((a, b) => (b.y ?? 0) - (a.y ?? 0))[0];
    const label = nearest?.label ?? target.optionPositions[target.optionPositions.length - 1]?.label;
    target.images.push({ index: image.index, role: 'OPTION', optionLabel: label });
  }
}

/* ------------------------------------------------------------------ parsing */

export interface DocParseOutput extends ParsedFile {
  rawBlocks: Array<{ rowNumber: number; text: string; page?: number }>;
}

export function parseDocBlocks(input: DocParseInput): DocParseOutput {
  const { blocks, keyEntries, warnings } = segmentLines(input.lines);

  if (input.sourceKind === 'PDF' && input.images?.length) {
    assignPdfImages(blocks, input.images);
  }

  const keyByNumber = new Map<number, string[]>();
  for (const entry of keyEntries) keyByNumber.set(entry.number, entry.labels);

  // Blok yang hanya berisi deretan kunci di akhir dokumen tidak dipakai.
  const questionBlocks = blocks.filter((block) => !isKeyOnlyBlock(block));

  const detectedSubtestCode =
    input.settings.detectedSubtestCode ??
    questionBlocks.find((block) => block.heading)?.heading ??
    null;

  const settings: ImportSettings = { ...input.settings, detectedSubtestCode };

  const rows: ParsedRow[] = [];
  for (const block of questionBlocks) {
    const parsed = parseQuestionBlock(block, settings, keyByNumber);
    if (parsed) rows.push(parsed);
  }

  const warningsAll = [...input.extractorWarnings, ...warnings];
  if (rows.length === 0) warningsAll.push('Parser tidak menemukan soal yang dapat direview');

  return {
    sourceKind: input.sourceKind,
    rows,
    rawBlocks: questionBlocks.map((block) => ({
      rowNumber: block.rowNumber,
      text: block.lines.join('\n'),
      page: block.page,
    })),
    warnings: warningsAll,
    pageCount: input.pageCount,
    detectedSubtestCode,
  };
}

function isKeyOnlyBlock(block: RawBlock): boolean {
  const meaningful = block.lines.filter((line) => line.trim().length > 0);
  if (meaningful.length === 0) return true;
  return meaningful.every(
    (line) => parseKeyLine(line).length > 0 && !/[a-z]{3,}/i.test(line),
  );
}

function parseQuestionBlock(
  block: RawBlock,
  settings: ImportSettings,
  keyByNumber: Map<number, string[]>,
): ParsedRow | null {
  const warnings: string[] = [];
  const stemLines: string[] = [];
  const options: Array<{ label: string; contentText: string; isCorrect?: boolean }> = [];
  let correctLabels: string[] = [];
  let explanation: string | null = null;
  let explanationCollecting = false;

  for (const line of block.lines) {
    const answer = ANSWER_LINE.exec(line);
    if (answer) {
      correctLabels = parseCorrectLabels(answer[1] ?? '');
      explanationCollecting = false;
      continue;
    }

    const explanationMatch = EXPLANATION_START.exec(line);
    if (explanationMatch) {
      explanation = (explanationMatch[1] ?? '').replace(/\*\*/g, '').trim() || null;
      explanationCollecting = true;
      continue;
    }

    const option = OPTION_START.exec(line);
    if (option) {
      options.push({
        label: option[1]!.toUpperCase(),
        // Label opsi tebal menandakan kunci (mis. dari DOCX).
        contentText: (option[2] ?? '').replace(/\*\*/g, '').trim(),
        isCorrect: /^\s*\*\*[A-Ea-e]\*\*/.test(line) || undefined,
      });
      explanationCollecting = false;
      continue;
    }

    if (explanationCollecting) {
      explanation = [explanation, line.replace(/\*\*/g, '').trim()].filter(Boolean).join(' ');
      continue;
    }

    if (options.length === 0) {
      stemLines.push(line.replace(/\*\*/g, '').trim());
    } else {
      const last = options[options.length - 1]!;
      last.contentText = `${last.contentText} ${line.replace(/\*\*/g, '').trim()}`.trim();
    }
  }

  const stemText = stemLines.join(' ').replace(/\s+/g, ' ').trim();
  if (!stemText) return null;

  if (block.number !== undefined && keyByNumber.has(block.number)) {
    correctLabels = keyByNumber.get(block.number)!;
  }
  if (correctLabels.length === 0) {
    const bolded = options.filter((option) => option.isCorrect).map((option) => option.label);
    if (bolded.length > 0) {
      correctLabels = bolded;
      warnings.push('Kunci diambil dari opsi tebal (bold); periksa kembali');
    }
  }

  const subtestCode = block.heading ?? settings.detectedSubtestCode ?? settings.targetSubtestCode;
  const stageCode = settings.targetStageCode ?? (subtestCode ? STAGE_OF[subtestCode] : undefined);
  const type = detectType({ stemText, options, settings, subtestCode });

  if (options.length === 0 && type !== 'LIKERT_STATEMENT' && type !== 'PASS_HAND_COLUMN') {
    warnings.push('Opsi jawaban tidak terdeteksi');
  }
  if (correctLabels.length === 0 && type !== 'LIKERT_STATEMENT' && type !== 'PASS_HAND_COLUMN') {
    warnings.push('Kunci jawaban tidak terdeteksi');
  }
  if (!subtestCode) warnings.push('Subtes tidak terdeteksi dari heading dokumen');

  const confidence = scoreConfidence({
    numbered: block.number !== undefined,
    optionCount: options.length,
    keyValid: correctLabels.length > 0,
    subtestKnown: Boolean(subtestCode),
    warnings,
  });

  const { payload, issues, warnings: builtWarnings } = buildPayload(
    {
      rowNumber: block.rowNumber,
      rawText: block.lines.join('\n'),
      page: block.page,
      stageCode,
      subtestCode,
      type,
      stemText,
      explanation,
      options,
      correctLabels,
      warnings,
      confidence,
    },
    settings,
  );

  return {
    rowNumber: block.rowNumber,
    rawText: block.lines.join('\n'),
    page: block.page,
    payload,
    issues,
    warnings: [...new Set([...warnings, ...builtWarnings])],
    confidence,
    imageRefs: block.images,
  };
}

/** Tebakan tipe soal sesuai aturan fallback §10.4B butir 6. */
export function detectType(input: {
  stemText: string;
  options: Array<{ label: string; contentText: string }>;
  settings: ImportSettings;
  subtestCode?: SubtestCode;
}): QuestionType {
  const { stemText, options, settings, subtestCode } = input;

  if (subtestCode === 'PASS_HAND') return 'PASS_HAND_COLUMN';
  if (subtestCode === 'KEPRIBADIAN') return 'LIKERT_STATEMENT';

  const likertLabels = options.map((option) => option.contentText.toLowerCase());
  const looksLikert =
    options.length === 5 &&
    likertLabels.some((text) => /sangat setuju|setuju/.test(text)) &&
    likertLabels.some((text) => /tidak setuju|sangat tidak/.test(text));
  if (looksLikert) return 'LIKERT_STATEMENT';

  if (/\.{3,}|…|\bmissing\b|\bberapa\b.*\?/i.test(stemText) && /\b(hilang|missing|titik-titik)\b/i.test(stemText)) {
    return 'MISSING_ELEMENT';
  }
  if (options.filter((option) => option.contentText).length < 2 && settings.defaultType === 'IMAGE_CHOICE') {
    return 'IMAGE_CHOICE';
  }

  return QUESTION_TYPES.includes(settings.defaultType) ? settings.defaultType : 'SINGLE_CHOICE';
}

export function stageCodeFor(subtestCode: SubtestCode): StageCode {
  return STAGE_OF[subtestCode];
}

export function isValidStage(value: string): value is StageCode {
  return (STAGE_CODES as readonly string[]).includes(value);
}