/**
 * Smoke test alur CAT end-to-end (F2-08).
 *
 * Skrip ini menjalankan perjalanan peserta yang sesungguhnya lewat HTTP:
 *
 *   login → mulai sesi → untuk keenam subtes:
 *     buka → ambil soal (berhalaman) → autosave → heartbeat → kirim event →
 *     selesaikan
 *   → ambil hasil → bersihkan data uji
 *
 * Supaya bisa menyelesaikan keenam subtes (termasuk sistem gugur), skrip
 * membaca snapshot soal yang SUDAH dibekukan server pada baris sesi. Snapshot
 * itu memang berisi kunci jawaban, tetapi hanya untuk keperluan uji — bukan
 * lewat API peserta.
 *
 * Pemakaian:
 *
 *   pnpm smoke:cat
 *   SMOKE_API=http://localhost:3100/api/v1 pnpm smoke:cat
 *   pnpm smoke:cat -- --keep     # jangan hapus sesi setelah selesai
 *   pnpm smoke:cat -- --no-answer  # kirim jawaban kosong (uji jalur gugur)
 *
 * Exit code 0 hanya bila seluruh langkah penting berhasil.
 */
import { PrismaClient } from '@prisma/client';
import { loadLocalEnv } from '../src/core/config/load-env';

loadLocalEnv();

const API = (process.env.SMOKE_API ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');
const EMAIL = process.env.SMOKE_EMAIL ?? 'user@example.com';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'PesertaDemo123';
const KEEP = process.argv.includes('--keep');
const ANSWER = !process.argv.includes('--no-answer');

const prisma = new PrismaClient({ log: ['error'] });

/* ------------------------------------------------------------------ util */

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: { nextCursor?: string | null; hasMore?: boolean; total?: number; requestId?: string };
  error: { code: string; message: string; details?: unknown } | null;
}

class SmokeError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
  }
}

function log(step: string, message: string): void {
  console.log(`  ${step.padEnd(26)} ${message}`);
}

async function api<T>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; expect?: number } = {},
): Promise<T> {
  return (await apiRaw<T>(method, path, options)).data;
}

async function apiRaw<T>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; expect?: number } = {},
): Promise<Envelope<T>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  let parsed: Envelope<T> | null = null;
  try {
    parsed = text ? (JSON.parse(text) as Envelope<T>) : null;
  } catch {
    throw new SmokeError(
      `${method} ${path} → ${response.status} (respons bukan JSON)`,
      text.slice(0, 300),
    );
  }

  if (options.expect !== undefined) {
    if (response.status !== options.expect) {
      throw new SmokeError(
        `${method} ${path} → ${response.status} (diharapkan ${options.expect})`,
        parsed?.error ?? null,
      );
    }
  } else if (!response.ok || !parsed?.success) {
    throw new SmokeError(
      `${method} ${path} → ${response.status}`,
      parsed?.error ?? text.slice(0, 300),
    );
  }

  if (!parsed) throw new SmokeError(`${method} ${path} → respons kosong`);
  return parsed;
}

/* --------------------------------------------------- data dari snapshot */

interface SnapshotOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface QuestionSnapshot {
  type: string;
  scale: number | null;
  columnNumbers: number[] | null;
  missingElement: { answer: string } | null;
  options: SnapshotOption[];
}

interface AnswerPayload {
  optionIds?: string[];
  value?: number;
  text?: string;
  values?: string[];
}

/** Kunci digit Pass Hand: digit terakhir penjumlahan tiap pasangan. */
function passHandKey(columnNumbers: number[]): string[] {
  const pairs = Math.floor(columnNumbers.length / 2);
  const key: string[] = [];
  for (let index = 0; index < pairs; index += 1) {
    const a = columnNumbers[index * 2] ?? 0;
    const b = columnNumbers[index * 2 + 1] ?? 0;
    key.push(String((a + b) % 10));
  }
  return key;
}

/**
 * Susun jawaban dari snapshot server sehingga subtes dapat dinilai benar.
 * Urutan pemeriksaan penting: Likert (skala) dan Pass Hand (kolom angka)
 * sama-sama punya `options`, tetapi payload-nya berbeda.
 */
function buildAnswer(snapshot: QuestionSnapshot): AnswerPayload | null {
  if (snapshot.columnNumbers && snapshot.columnNumbers.length >= 2) {
    return { values: passHandKey(snapshot.columnNumbers) };
  }
  if (snapshot.missingElement?.answer) {
    return { text: snapshot.missingElement.answer };
  }
  if (typeof snapshot.scale === 'number' && snapshot.scale > 1) {
    return { value: Math.round(snapshot.scale / 2) };
  }
  const correct = snapshot.options.filter((option) => option.isCorrect).map((option) => option.id);
  return correct.length > 0 ? { optionIds: correct } : null;
}

/* -------------------------------------------------------------- tipe API */

interface ClockState {
  serverTime: string;
  endsAt: string | null;
  remainingMs: number | null;
  status: string;
}

interface SubtestSummary {
  id: string;
  subtestCode: string;
  name: string;
  status: string;
  questionCount: number;
  percentage: number | null;
  passed: boolean | null;
  lockReason: string | null;
}

interface StageSummary {
  id: string;
  stageCode: string;
  subtests: SubtestSummary[];
}

interface SessionDetail {
  session: {
    id: string;
    status: string;
    totalScore: number | null;
    passed: boolean | null;
    eliminatedSubtestCode: string | null;
    stages: StageSummary[];
  };
  currentSubtest: SubtestSummary | null;
  clock: ClockState | null;
  lockedReason: string | null;
}

interface QuestionItem {
  id: string;
  position: number;
}

interface QuestionPage {
  items: QuestionItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

/**
 * `ResponseInterceptor` membongkar payload berhalaman: daftar item ada di
 * `data`, sedangkan `nextCursor`/`hasMore`/`total` pindah ke `meta`.
 */
async function fetchQuestions(
  token: string,
  base: string,
  cursor: string | null,
): Promise<QuestionPage> {
  const query: string = cursor ? `?limit=50&cursor=${cursor}` : '?limit=50';
  const envelope = await apiRaw<QuestionItem[]>('GET', `${base}/questions${query}`, { token });
  return {
    items: envelope.data,
    nextCursor: envelope.meta?.nextCursor ?? null,
    hasMore: envelope.meta?.hasMore === true,
    total: envelope.meta?.total ?? envelope.data.length,
  };
}

/* ------------------------------------------------------------------ alur */

async function login(): Promise<string> {
  const data = await api<{ accessToken: string; user: { id: string; email: string } }>(
    'POST',
    '/auth/login',
    { body: { email: EMAIL, password: PASSWORD }, expect: 200 },
  );
  log('login', `${data.user.email} (${data.user.id})`);
  return data.accessToken;
}

async function startSession(token: string): Promise<SessionDetail> {
  const data = await api<SessionDetail>('POST', '/exams/sessions', {
    token,
    body: { acknowledgeRules: true },
    expect: 201,
  });
  const subtests = data.session.stages.flatMap((stage) => stage.subtests);
  log('start sesi', `${data.session.id} — ${subtests.length} subtes, status ${data.session.status}`);
  if (subtests.length !== 6) {
    throw new SmokeError(`jumlah subtes tidak 6 (dapat ${subtests.length})`);
  }
  return data;
}

/** Baca snapshot soal langsung dari DB untuk menyusun jawaban benar. */
async function answersFromSnapshot(
  subtestSessionId: string,
): Promise<Array<{ questionId: string; payload: AnswerPayload }>> {
  const rows = await prisma.examSessionQuestion.findMany({
    where: { subtestSessionId },
    orderBy: { position: 'asc' },
    select: { id: true, snapshot: true },
  });

  const answers: Array<{ questionId: string; payload: AnswerPayload }> = [];
  for (const row of rows) {
    const payload = buildAnswer(row.snapshot as unknown as QuestionSnapshot);
    if (payload) answers.push({ questionId: row.id, payload });
  }
  return answers;
}

async function runSubtest(
  token: string,
  sessionId: string,
  stage: StageSummary,
  subtest: SubtestSummary,
): Promise<void> {
  const base = `/exams/sessions/${sessionId}/subtests/${subtest.id}`;
  const label = subtest.subtestCode;

  const openStarted = Date.now();
  await api<SessionDetail>('POST', `${base.replace('/subtests/', `/stages/${stage.id}/subtests/`)}/open`, {
    token,
    body: {},
  });
  log(`${label} open`, `${subtest.questionCount} soal (${Date.now() - openStarted} ms)`);

  // Ambil soal berhalaman sampai habis.
  let cursor: string | null = null;
  let total = 0;
  let pages = 0;
  let fetched = 0;
  do {
    const page = await fetchQuestions(token, base, cursor);
    total = page.total;
    fetched += page.items.length;
    pages += 1;
    cursor = page.hasMore ? page.nextCursor : null;
  } while (cursor);

  if (total !== subtest.questionCount) {
    throw new SmokeError(`${label}: total soal ${total} != konfigurasi ${subtest.questionCount}`);
  }
  if (fetched !== total) {
    throw new SmokeError(`${label}: item terbaca ${fetched} != total ${total}`);
  }
  log(`${label} soal`, `${total} dalam ${pages} halaman`);

  // Autosave bertahap (maks 50 per request), seperti runner asli.
  if (ANSWER) {
    const answers = await answersFromSnapshot(subtest.id);
    if (answers.length === 0) throw new SmokeError(`${label}: tidak ada jawaban terbentuk`);

    let seq = 0;
    for (let offset = 0; offset < answers.length; offset += 50) {
      const chunk = answers.slice(offset, offset + 50);
      const result = await api<{ saved: string[]; rejected: unknown[] }>(
        'PATCH',
        `${base}/answers`,
        { token, body: { clientSeq: seq, answers: chunk } },
      );
      if (result.rejected.length > 0) {
        throw new SmokeError(`${label}: ${result.rejected.length} jawaban ditolak`, result.rejected);
      }
      seq += 1;
    }

    // Replay batch pertama: harus idempoten (tidak menambah baris event).
    const replay = await api<{ saved: string[]; rejected: unknown[] }>('PATCH', `${base}/answers`, {
      token,
      body: { clientSeq: 0, answers: answers.slice(0, 50) },
    });
    if (replay.rejected.length > 0) throw new SmokeError(`${label}: replay ditolak`);
    log(`${label} autosave`, `${answers.length} jawaban, replay clientSeq=0 OK`);
  }

  await api<unknown>('POST', `/exams/sessions/${sessionId}/heartbeat`, {
    token,
    body: { clientTime: new Date().toISOString() },
  });

  await api<unknown>('POST', `/exams/sessions/${sessionId}/events`, {
    token,
    body: {
      events: [
        {
          clientEventId: `smoke-${subtest.id}-${Date.now()}`,
          type: 'TAB_BLUR',
          subtestSessionId: subtest.id,
          occurredAt: new Date().toISOString(),
          payload: { source: 'smoke-cat' },
        },
      ],
    },
  });
  log(`${label} heartbeat/event`, 'ok');

  const finishStarted = Date.now();
  const finished = await api<SessionDetail>('POST', `${base}/finish`, {
    token,
    body: { clientSeq: 999 },
  });
  const after = finished.session.stages
    .flatMap((entry) => entry.subtests)
    .find((entry) => entry.id === subtest.id);
  log(
    `${label} finish`,
    `status ${after?.status ?? '?'}, nilai ${after?.percentage ?? '-'}%, lulus ${after?.passed ?? '-'} (${Date.now() - finishStarted} ms)`,
  );
}

interface ResultView {
  sessionId: string;
  status: string;
  totalScore: number | null;
  passed: boolean | null;
  eliminatedSubtestCode: string | null;
  totalPassingScore: number;
  stages: Array<{
    stageCode: string;
    subtests: Array<{
      subtestCode: string;
      status: string;
      percentage: number | null;
      passed: boolean | null;
    }>;
  }>;
}

async function getResult(token: string, sessionId: string): Promise<ResultView> {
  const data = await api<ResultView>('GET', `/exams/sessions/${sessionId}/result`, { token });
  const subtests = data.stages.flatMap((stage) => stage.subtests);
  const done = subtests.filter((entry) => entry.status === 'COMPLETED').length;
  log(
    'hasil',
    `sesi ${data.status}, total ${data.totalScore ?? '-'} (ambang ${data.totalPassingScore}), ${done}/${subtests.length} subtes selesai`,
  );
  return data;
}

async function cleanup(sessionId: string): Promise<void> {
  const deleted = await prisma.examSession.deleteMany({ where: { id: sessionId } });
  const [sessions, subtestRows, questions] = await Promise.all([
    prisma.examSession.count(),
    prisma.examSessionSubtest.count(),
    prisma.examSessionQuestion.count(),
  ]);
  log(
    'bersihkan',
    `hapus ${deleted.count} sesi — sisa: sesi ${sessions}, subtes ${subtestRows}, soal ${questions}`,
  );
}

/* ------------------------------------------------------------------ main */

async function main(): Promise<void> {
  console.log(`smoke:cat → ${API}`);

  const health = await api<{ status: string; database: string }>('GET', '/health/ready');
  log('health', `status ${health.status}, database ${health.database}`);

  const token = await login();
  const started = await startSession(token);
  const sessionId = started.session.id;

  let failure: unknown = null;
  try {
    const stages = started.session.stages;
    // Selesaikan subtes sesuai urutan stage lalu urutan subtes di dalamnya.
    for (const stage of stages) {
      for (const subtest of stage.subtests) {
        // Subtes bisa sudah terkunci karena sistem gugur; lewati dengan catatan.
        const current = await api<SessionDetail>('GET', `/exams/sessions/${sessionId}`, { token });
        const row = current.session.stages
          .flatMap((entry) => entry.subtests)
          .find((entry) => entry.id === subtest.id);
        if (!row || row.status === 'LOCKED') {
          log(`${subtest.subtestCode}`, `dilewati (status ${row?.status ?? 'tidak ada'})`);
          continue;
        }
        await runSubtest(token, sessionId, stage, subtest);
      }
    }

    const result = await getResult(token, sessionId);
    const subtests = result.stages.flatMap((stage) => stage.subtests);
    const unresolved = subtests.filter(
      (entry) => !['COMPLETED', 'EXPIRED', 'ELIMINATED'].includes(entry.status),
    );
    if (unresolved.length > 0) {
      throw new SmokeError(
        `masih ada subtes belum terminal: ${unresolved.map((entry) => `${entry.subtestCode}=${entry.status}`).join(', ')}`,
      );
    }
    if (result.status !== 'COMPLETED') {
      throw new SmokeError(`status sesi ${result.status}, diharapkan COMPLETED`);
    }
    const failed = subtests.filter((entry) => entry.passed === false);
    if (failed.length > 0) {
      throw new SmokeError(
        `subtes tidak lulus: ${failed.map((entry) => `${entry.subtestCode}=${entry.percentage}%`).join(', ')}`,
      );
    }
    log('verifikasi', `semua ${subtests.length} subtes COMPLETED, tidak ada yang gugur`);
  } catch (error) {
    failure = error;
  } finally {
    if (KEEP) {
      log('bersihkan', `dilewati (--keep); sesi ${sessionId}`);
    } else {
      await cleanup(sessionId);
    }
  }

  if (failure) throw failure;
  console.log('\nsmoke:cat LULUS');
}

main()
  .catch((error: unknown) => {
    console.error('\nsmoke:cat GAGAL');
    if (error instanceof SmokeError) {
      console.error(`  ${error.message}`);
      if (error.detail) console.error('  detail:', JSON.stringify(error.detail));
    } else {
      console.error(' ', error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
