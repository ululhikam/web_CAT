import type {
  ExamQuestionType,
  StageCode,
  SubtestCode,
  SubtestStatus,
  SessionStatus,
  ViolationPolicy,
  ViolationRule,
  ViolationSeverity,
  ViolationAction,
} from '@webcat/contracts';
import {
  DEFAULT_VIOLATION_POLICY,
  DEFAULT_TIMEZONE,
  DEFAULT_TOTAL_PASSING_SCORE,
  DEFAULT_MAX_SESSIONS_PER_DAY,
  DEFAULT_GRACE_SHORT_MS,
  DEFAULT_GRACE_LONG_MS,
  DEFAULT_SUBTEST_TRANSITION,
} from './exam-defaults';
import type { SessionConfigSnapshot, StageConfigSnapshot, SubtestConfigSnapshot } from './types';
import type {
  MissingElementSnapshot,
  QuestionSnapshot,
  SnapshotMedia,
  SnapshotOption,
} from '../scoring/scoring.types';

/**
 * Parser defensif untuk data JSON dari database.
 *
 * Snapshot ditulis server dan dibaca kembali sebagai `unknown` oleh Prisma.
 * Semua akses field melewati helper di file ini agar tipe aman dan snapshot
 * lama/rusak tidak membuat endpoint 500.
 */

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function asNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Konversi `Decimal` Prisma / string / number ke number. */
export function decimalToNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === 'object' && 'toNumber' in value) {
    const parsed = Number((value as { toNumber: () => number }).toNumber());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function decimalToNumberOr(value: unknown, fallback: number): number {
  return decimalToNumber(value) ?? fallback;
}

const QUESTION_TYPES: readonly ExamQuestionType[] = [
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'IMAGE_CHOICE',
  'LIKERT_STATEMENT',
  'MISSING_ELEMENT',
  'PASS_HAND_COLUMN',
];

function asQuestionType(value: unknown): ExamQuestionType {
  return QUESTION_TYPES.includes(value as ExamQuestionType)
    ? (value as ExamQuestionType)
    : 'SINGLE_CHOICE';
}

function asSeverity(value: unknown): ViolationSeverity {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'low';
}

const VIOLATION_ACTIONS: readonly ViolationAction[] = [
  'WARN',
  'LOCK_SUBTEST',
  'ELIMINATE',
  'LOCK_ACCOUNT',
];

function asViolationAction(value: unknown): ViolationAction | null {
  return VIOLATION_ACTIONS.includes(value as ViolationAction) ? (value as ViolationAction) : null;
}

/* ------------------------------------------------------------------ snapshot soal */

function parseMedia(value: unknown): SnapshotMedia | null {
  const raw = asRecord(value);
  const path = asString(raw.path);
  if (!path) return null;
  const role = raw.role === 'OPTION' || raw.role === 'EXPLANATION' ? raw.role : 'STEM';
  return {
    role,
    // Snapshot lama tidak punya `assetId`/`optionId`; biarkan `undefined`/null
    // agar jalur proyeksi tahu harus memakai `path` (fallback signed URL).
    assetId: asString(raw.assetId) || undefined,
    optionId: asNullableString(raw.optionId),
    path,
    alt: asNullableString(raw.alt),
  };
}

function parseMediaList(value: unknown): SnapshotMedia[] {
  return asArray(value)
    .map(parseMedia)
    .filter((entry): entry is SnapshotMedia => entry !== null);
}

function parseOption(value: unknown): SnapshotOption | null {
  const raw = asRecord(value);
  const id = asString(raw.id);
  if (!id) return null;

  const dimension = asRecord(raw.dimensionMap);
  const dimensionMap: Record<string, number> = {};
  for (const [key, entry] of Object.entries(dimension)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) dimensionMap[key] = entry;
  }

  return {
    id,
    label: asString(raw.label),
    text: asNullableString(raw.text),
    isCorrect: asBoolean(raw.isCorrect),
    scoreValue: asNumber(raw.scoreValue, 0),
    dimensionMap: Object.keys(dimensionMap).length > 0 ? dimensionMap : null,
    // Snapshot lama tidak punya media per opsi → `[]`, bukan `undefined`.
    media: parseMediaList(raw.media),
  };
}

function parseMissingElement(value: unknown): MissingElementSnapshot | null {
  const raw = asRecord(value);
  const left = asString(raw.left);
  const right = asString(raw.right);
  if (!left && !right) return null;
  return { left, right, answer: asString(raw.answer) };
}

export function parseQuestionSnapshot(value: unknown): QuestionSnapshot {
  const raw = asRecord(value);
  const options = asArray(raw.options)
    .map(parseOption)
    .filter((option): option is SnapshotOption => option !== null);
  const media = parseMediaList(raw.media);
  const columnNumbers = asArray(raw.columnNumbers)
    .map((entry) => (typeof entry === 'number' ? entry : Number(entry)))
    .filter((entry) => Number.isFinite(entry));

  return {
    sourceId: asString(raw.sourceId),
    type: asQuestionType(raw.type),
    stem: asString(raw.stem),
    stemFormat: raw.stemFormat === 'HTML' ? 'HTML' : 'MARKDOWN',
    difficulty: raw.difficulty === 'EASY' || raw.difficulty === 'HARD' ? raw.difficulty : 'MEDIUM',
    weight: Math.max(0.0001, asNumber(raw.weight, 1)),
    scale: asNullableNumber(raw.scale),
    isReverse: asBoolean(raw.isReverse),
    pairGroup: asNullableString(raw.pairGroup),
    columnIndex: asNullableNumber(raw.columnIndex),
    columnNumbers: columnNumbers.length > 0 ? columnNumbers : null,
    missingElement: parseMissingElement(raw.missingElement),
    options,
    media,
  };
}

/* ------------------------------------------------------------------ konfigurasi */

const STAGE_CODES: readonly StageCode[] = ['PSIKOLOGI', 'TKK', 'TPK'];
const SUBTEST_CODES: readonly SubtestCode[] = [
  'KECERDASAN',
  'KEPRIBADIAN',
  'KECERMATAN',
  'PASS_HAND',
  'TKK',
  'TPK',
];

function asStageCode(value: unknown): StageCode | null {
  // `TPA` adalah kode lama (sebelum F5-16). Snapshot sesi historis masih
  // menyimpan teks `TPA` di dalam JSON, jadi dibaca sebagai `TKK`.
  if (value === 'TPA') return 'TKK';
  return STAGE_CODES.includes(value as StageCode) ? (value as StageCode) : null;
}

function asSubtestCode(value: unknown): SubtestCode | null {
  if (value === 'TPA') return 'TKK';
  return SUBTEST_CODES.includes(value as SubtestCode) ? (value as SubtestCode) : null;
}

/**
 * Snapshot sesi lama masih menyimpan nama "Tes Potensi Akademik" untuk kode
 * yang sekarang bernama TKK. Kodenya sudah dipetakan ke TKK, jadi namanya ikut
 * dinormalkan agar halaman hasil tidak menampilkan dua nama untuk satu tes.
 */
function normalizeTkkName(code: StageCode | SubtestCode, name: string): string {
  if (code !== 'TKK') return name;
  return /potensi\s+akademik/i.test(name) ? 'Tes Kemampuan Komputer' : name;
}

export function parseSubtestConfig(value: unknown): SubtestConfigSnapshot | null {
  const raw = asRecord(value);
  const code = asSubtestCode(raw.code);
  if (!code) return null;
  const scoringConfig = asRecord(raw.scoringConfig);
  return {
    subtestId: asString(raw.subtestId),
    code,
    name: normalizeTkkName(code, asString(raw.name, code)),
    orderIndex: asNumber(raw.orderIndex, 1),
    questionCount: Math.max(1, asNumber(raw.questionCount, 1)),
    durationMinutes: Math.max(1, asNumber(raw.durationMinutes, 1)),
    weight: Math.max(0, asNumber(raw.weight, 0)),
    passingScore: Math.max(0, asNumber(raw.passingScore, 60)),
    eliminationEnabled: asBoolean(raw.eliminationEnabled, true),
    scoringStrategy: asString(raw.scoringStrategy, 'KEYED_CORRECT'),
    scoringConfig: Object.keys(scoringConfig).length > 0 ? scoringConfig : null,
  };
}

export function parseStageConfig(value: unknown): StageConfigSnapshot | null {
  const raw = asRecord(value);
  const code = asStageCode(raw.code);
  if (!code) return null;
  return {
    stageId: asString(raw.stageId),
    code,
    name: normalizeTkkName(code, asString(raw.name, code)),
    description: asNullableString(raw.description),
    orderIndex: asNumber(raw.orderIndex, 1),
    weight: Math.max(0, asNumber(raw.weight, 0)),
    passingScore: Math.max(0, asNumber(raw.passingScore, 60)),
    eliminationEnabled: asBoolean(raw.eliminationEnabled, true),
    subtests: asArray(raw.subtests)
      .map(parseSubtestConfig)
      .filter((entry): entry is SubtestConfigSnapshot => entry !== null),
  };
}

export function parseSessionConfig(value: unknown): SessionConfigSnapshot {
  const raw = asRecord(value);
  const stages = asArray(raw.stages)
    .map(parseStageConfig)
    .filter((entry): entry is StageConfigSnapshot => entry !== null);
  const policy = parseViolationPolicy(raw.violationPolicy);

  return {
    capturedAt: asString(raw.capturedAt, new Date(0).toISOString()),
    timezone: asString(raw.timezone, DEFAULT_TIMEZONE),
    totalPassingScore: asNumber(raw.totalPassingScore, DEFAULT_TOTAL_PASSING_SCORE),
    maxSessionsPerDay: Math.max(1, asNumber(raw.maxSessionsPerDay, DEFAULT_MAX_SESSIONS_PER_DAY)),
    gracePeriodShortMs: Math.max(0, asNumber(raw.gracePeriodShortMs, DEFAULT_GRACE_SHORT_MS)),
    gracePeriodLongMs: Math.max(0, asNumber(raw.gracePeriodLongMs, DEFAULT_GRACE_LONG_MS)),
    subtestTransition: raw.subtestTransition === 'immediate' ? 'immediate' : 'on_open',
    violationPolicy: policy,
    stages,
  };
}

export function parseViolationPolicy(value: unknown): ViolationPolicy {
  const raw = asRecord(value);
  const events = asRecord(raw.events);
  const parsed: Record<string, ViolationRule> = {};

  for (const [type, entry] of Object.entries(events)) {
    const rule = asRecord(entry);
    const actions = asArray(rule.actions)
      .map((action) => {
        const row = asRecord(action);
        const at = asNumber(row.at, 0);
        const actionName = asViolationAction(row.action);
        return actionName && at > 0 ? { at, action: actionName } : null;
      })
      .filter((action): action is { at: number; action: ViolationAction } => action !== null)
      .sort((a, b) => a.at - b.at);

    if (actions.length > 0) {
      parsed[type] = { severity: asSeverity(rule.severity), actions };
    }
  }

  if (Object.keys(parsed).length === 0) return DEFAULT_VIOLATION_POLICY;

  return {
    events: parsed,
    warningTemplate: asString(raw.warningTemplate, DEFAULT_VIOLATION_POLICY.warningTemplate),
  };
}

export function defaultSessionConfig(now = new Date()): SessionConfigSnapshot {
  return {
    capturedAt: now.toISOString(),
    timezone: DEFAULT_TIMEZONE,
    totalPassingScore: DEFAULT_TOTAL_PASSING_SCORE,
    maxSessionsPerDay: DEFAULT_MAX_SESSIONS_PER_DAY,
    gracePeriodShortMs: DEFAULT_GRACE_SHORT_MS,
    gracePeriodLongMs: DEFAULT_GRACE_LONG_MS,
    subtestTransition: DEFAULT_SUBTEST_TRANSITION,
    violationPolicy: DEFAULT_VIOLATION_POLICY,
    stages: [],
  };
}

/* ------------------------------------------------------------------ status */

export function asSubtestStatus(value: unknown): SubtestStatus {
  return value === 'READY' ||
    value === 'ACTIVE' ||
    value === 'COMPLETED' ||
    value === 'EXPIRED' ||
    value === 'ELIMINATED'
    ? value
    : 'LOCKED';
}

export function asSessionStatus(value: unknown): SessionStatus {
  return value === 'IN_PROGRESS' ||
    value === 'COMPLETED' ||
    value === 'ELIMINATED' ||
    value === 'EXPIRED' ||
    value === 'ABANDONED' ||
    value === 'VOIDED'
    ? value
    : 'CREATED';
}
