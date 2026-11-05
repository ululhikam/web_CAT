/**
 * Bukti visual end-to-end soal bergambar (F3-31).
 *
 * Skrip ini menempuh jalur yang SAMA dengan peserta:
 *
 *   login → mulai/buka sesi → buka subtes Kecerdasan → ambil soal berhalaman
 *   → ambil SETIAP URL media (stem + opsi) → pastikan HTTP 200 + gambar
 *   → susun artefak bukti (PNG montase + HTML mandiri) di docs/perbaikan/
 *
 * Yang dibuktikan bukan sekadar "kode ada":
 *   1. soal figural dari bank soal benar-benar masuk sesi (bukan fixture),
 *   2. payload peserta memuat URL `/api/v1/media/:id/content?exp&sig`,
 *   3. URL tersebut melayani byte gambar WebP yang sah,
 *   4. media per opsi ada untuk setiap label opsi pada `IMAGE_CHOICE`,
 *   5. `isCorrect` tidak bocor ke payload peserta.
 *
 * Pemakaian:
 *
 *   pnpm smoke:media
 *   SMOKE_API=http://localhost:3000/api/v1 pnpm smoke:media
 *   pnpm smoke:media -- --keep     # jangan hapus sesi setelah selesai
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import sharp, { type OverlayOptions } from 'sharp';
import { loadLocalEnv } from '../src/core/config/load-env';

loadLocalEnv();

const API = (process.env.SMOKE_API ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');
const EMAIL = process.env.SMOKE_EMAIL ?? 'user@example.com';
const PASSWORD = process.env.SMOKE_PASSWORD ?? 'PesertaDemo123';
const KEEP = process.argv.includes('--keep');
const OUT_DIR = resolve(__dirname, '../../../docs/perbaikan/fase-3-bukti');

const prisma = new PrismaClient({ log: ['error'] });

/* ------------------------------------------------------------------ util */

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: { nextCursor?: string | null; hasMore?: boolean; total?: number };
  error: { code: string; message: string } | null;
}

class VerifyError extends Error {
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
    throw new VerifyError(`${method} ${path} → ${response.status} (respons bukan JSON)`);
  }

  if (options.expect !== undefined) {
    if (response.status !== options.expect) {
      throw new VerifyError(
        `${method} ${path} → ${response.status} (diharapkan ${options.expect})`,
        parsed?.error ?? null,
      );
    }
  } else if (!response.ok || !parsed?.success) {
    throw new VerifyError(`${method} ${path} → ${response.status}`, parsed?.error ?? null);
  }
  if (!parsed) throw new VerifyError(`${method} ${path} → respons kosong`);
  return parsed;
}

async function api<T>(
  method: string,
  path: string,
  options: { token?: string; body?: unknown; expect?: number } = {},
): Promise<T> {
  return (await apiRaw<T>(method, path, options)).data;
}

/** Basis origin untuk URL media relatif (`/api/v1/...`). */
function origin(): string {
  const url = new URL(API);
  return `${url.protocol}//${url.host}`;
}

function absolute(url: string): string {
  return url.startsWith('http') ? url : `${origin()}${url}`;
}

/* -------------------------------------------------------------- tipe API */

interface SessionDetail {
  session: {
    id: string;
    status: string;
    stages: Array<{
      id: string;
      stageCode: string;
      subtests: Array<{
        id: string;
        subtestCode: string;
        status: string;
        questionCount: number;
      }>;
    }>;
  };
}

interface MediaRef {
  role: 'STEM' | 'OPTION' | 'EXPLANATION';
  url: string;
  alt: string | null;
}

interface QuestionItem {
  id: string;
  position: number;
  type: string;
  stem: string;
  media: MediaRef[];
  options: Array<{ id: string; label: string; text: string | null; media: MediaRef[] }>;
}

interface MediaBytes {
  url: string;
  mime: string;
  bytes: Buffer;
}

/* ------------------------------------------------------------------ cek */

function imageMimeOf(buffer: Buffer): string | null {
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  return null;
}

async function downloadMedia(ref: MediaRef, questionId: string): Promise<MediaBytes> {
  const response = await fetch(absolute(ref.url));
  if (response.status !== 200) {
    throw new VerifyError(`media ${ref.url} → HTTP ${response.status}`, { questionId });
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const mime = imageMimeOf(bytes);
  if (!mime) {
    const declared = response.headers.get('content-type') ?? '(kosong)';
    throw new VerifyError(`media ${ref.url} → byte bukan gambar (content-type ${declared})`, {
      questionId,
    });
  }
  return { url: ref.url, mime, bytes };
}

/* --------------------------------------------------------------- artefak */

/** Montase: stem di baris atas, lalu setiap opsi berlabel (melipat bila perlu). */
async function buildMontage(
  question: QuestionItem,
  assets: { stem: MediaBytes[]; options: Array<{ label: string; media: MediaBytes[] }> },
): Promise<Buffer> {
  const cell = 220;
  const gap = 12;
  const labelHeight = 28;
  const cellHeight = cell + labelHeight;
  const perRow = Math.min(Math.max(1, assets.options.length), 4);
  const optionRows = Math.max(1, Math.ceil(assets.options.length / perRow));

  const width = perRow * (cell + gap) + gap;
  const height = cellHeight + gap + optionRows * (cellHeight + gap);

  const composites: OverlayOptions[] = [];

  const place = async (
    media: MediaBytes | undefined,
    x: number,
    y: number,
    label: string,
  ): Promise<void> => {
    const caption = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${labelHeight}">
         <rect width="100%" height="100%" fill="#111827"/>
         <text x="8" y="20" font-family="Segoe UI, Arial" font-size="15" fill="#ffffff">${escapeXml(label)}</text>
       </svg>`,
    );
    composites.push({ input: caption, left: x, top: y });
    if (!media) return;
    const image = await sharp(media.bytes)
      .resize(cell, cell, { fit: 'contain', background: '#ffffff' })
      .png()
      .toBuffer();
    composites.push({ input: image, left: x, top: y + labelHeight });
  };

  await place(assets.stem[0], gap, gap, `Soal ${question.position} — media stem`);
  for (const [index, option] of assets.options.entries()) {
    const column = index % perRow;
    const row = Math.floor(index / perRow);
    await place(
      option.media[0],
      gap + column * (cell + gap),
      gap + cellHeight + gap + row * (cellHeight + gap),
      `Opsi ${option.label}`,
    );
  }

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 243, g: 244, b: 246 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(
  entries: Array<{
    question: QuestionItem;
    stem: MediaBytes[];
    options: Array<{ label: string; media: MediaBytes[] }>;
  }>,
  meta: { sessionId: string; subtestId: string; checked: number; bytes: number },
): string {
  const dataUri = (media: MediaBytes): string =>
    `data:${media.mime};base64,${media.bytes.toString('base64')}`;

  const blocks = entries
    .map(({ question, stem, options }) => {
      const stemMedia = stem
        .map((media) => `<img src="${dataUri(media)}" alt="media soal" />`)
        .join('');
      const optionMarkup = options
        .map(
          (option) => `
        <figure class="option">
          <figcaption>${escapeXml(option.label)}</figcaption>
          ${option.media
            .map(
              (media) =>
                `<img src="${dataUri(media)}" alt="Opsi ${escapeXml(option.label)}" />`,
            )
            .join('')}
        </figure>`,
        )
        .join('');

      return `
    <article class="question">
      <header>
        <span class="badge">posisi ${question.position}</span>
        <span class="badge badge--type">${escapeXml(question.type)}</span>
        <span class="mono">${escapeXml(question.id)}</span>
      </header>
      <p class="stem-text">${escapeXml(question.stem)}</p>
      <div class="stem">${stemMedia}</div>
      <div class="options">${optionMarkup}</div>
    </article>`;
    })
    .join('');

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>F3-31 — bukti soal bergambar di runner peserta</title>
<style>
  :root { color-scheme: light; }
  body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 32px; background: #f3f4f6; color: #111827; }
  main { max-width: 1080px; margin: 0 auto; }
  .panel { background: #fff; border-radius: 16px; padding: 28px 32px; box-shadow: 0 10px 30px rgba(15,23,42,.08); margin-bottom: 24px; }
  h1 { font-size: 22px; margin: 0 0 10px; }
  h2 { font-size: 15px; margin: 28px 0 12px; color: #374151; }
  .meta { color: #4b5563; font-size: 13px; line-height: 1.8; }
  code, .mono { font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; }
  .question { border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; margin-bottom: 20px; background: #fff; }
  .question header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .badge { background: #111827; color: #fff; border-radius: 999px; padding: 2px 10px; font-size: 11px; letter-spacing: .02em; }
  .badge--type { background: #1d4ed8; }
  .stem-text { margin: 0 0 14px; font-size: 14px; color: #374151; }
  .stem img { max-width: 300px; display: block; margin-bottom: 18px; }
  .options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
  .option { margin: 0; border: 2px solid #e5e7eb; border-radius: 12px; padding: 10px; background: #fafafa; }
  .option img { width: 100%; height: auto; display: block; }
  figcaption { font-weight: 600; font-size: 13px; margin-bottom: 8px; color: #374151; }
  .note { font-size: 12px; color: #6b7280; margin: 16px 0 0; }
</style>
</head>
<body>
<main>
  <section class="panel">
    <h1>F3-31 — soal bergambar yang benar-benar diterima peserta</h1>
    <div class="meta">
      Sumber: <code>GET /api/v1/exams/sessions/:id/subtests/:subId/questions</code>
      (endpoint peserta, bukan snapshot server).<br />
      Sesi <code>${escapeXml(meta.sessionId)}</code> · subtes <code>${escapeXml(meta.subtestId)}</code><br />
      ${entries.length} soal <code>IMAGE_CHOICE</code> ditampilkan · ${meta.checked} URL media diunduh,
      semuanya <strong>HTTP 200</strong> dan byte-nya gambar sah (${(meta.bytes / 1024).toFixed(1)} KB).<br />
      Gambar disematkan sebagai <code>data:</code> URI agar dokumen ini tetap utuh setelah
      tanda tangan URL (TTL 2 jam) kedaluwarsa.
    </div>
    <p class="note">
      Payload ini tidak memuat <code>isCorrect</code>, <code>dimensionMap</code>, maupun
      <code>missingElement.answer</code> — kunci jawaban hanya hidup di snapshot server.
    </p>
  </section>

  <section class="panel">
    <h2>Soal yang diterima peserta</h2>
    ${blocks}
  </section>
</main>
</body>
</html>`;
}

/* ------------------------------------------------------------------ alur */

async function login(): Promise<string> {
  const data = await api<{ accessToken: string; user: { email: string } }>('POST', '/auth/login', {
    body: { email: EMAIL, password: PASSWORD },
    expect: 200,
  });
  log('login', data.user.email);
  return data.accessToken;
}

/** Mulai sesi baru; bila sudah ada sesi hari ini, pakai yang ada (tanpa hapus). */
async function startOrReuseSession(token: string): Promise<{ session: SessionDetail['session']; reused: boolean }> {
  try {
    const data = await api<SessionDetail>('POST', '/exams/sessions', {
      token,
      body: { acknowledgeRules: true },
      expect: 201,
    });
    log('start sesi', data.session.id);
    return { session: data.session, reused: false };
  } catch (error) {
    const code =
      error instanceof VerifyError && typeof error.detail === 'object' && error.detail
        ? (error.detail as { code?: string }).code
        : null;
    if (code !== 'EXAM_SESSION_ALREADY_TODAY') throw error;

    const data = await api<SessionDetail>('GET', '/exams/sessions/active', { token });
    log('pakai sesi aktif', `${data.session.id} (sudah dibuat hari ini)`);
    return { session: data.session, reused: true };
  }
}

async function fetchQuestionPage(
  token: string,
  base: string,
  cursor: string | null,
): Promise<{ items: QuestionItem[]; nextCursor: string | null; total: number }> {
  const query = cursor ? `?limit=50&cursor=${cursor}` : '?limit=50';
  const envelope = await apiRaw<QuestionItem[]>('GET', `${base}/questions${query}`, { token });
  return {
    items: envelope.data,
    nextCursor: envelope.meta?.hasMore ? (envelope.meta.nextCursor ?? null) : null,
    total: envelope.meta?.total ?? envelope.data.length,
  };
}

async function main(): Promise<void> {
  console.log(`smoke:media → ${API}`);

  const health = await api<{ status: string; database: string }>('GET', '/health/ready');
  log('health', `status ${health.status}, database ${health.database}`);

  const token = await login();
  const { session, reused } = await startOrReuseSession(token);
  const sessionId = session.id;

  let failure: unknown = null;
  try {
    const stage = session.stages.find((entry) =>
      entry.subtests.some((subtest) => subtest.subtestCode === 'KECERDASAN'),
    );
    const subtest = stage?.subtests.find((entry) => entry.subtestCode === 'KECERDASAN');
    if (!stage || !subtest) throw new VerifyError('subtes KECERDASAN tidak ditemukan di sesi');

    // Subtes mungkin sudah dibuka pada sesi yang dipakai ulang.
    if (subtest.status === 'READY' || subtest.status === 'LOCKED') {
      await api('POST', `/exams/sessions/${sessionId}/stages/${stage.id}/subtests/${subtest.id}/open`, {
        token,
        body: {},
      });
      log('buka KECERDASAN', `${subtest.questionCount} soal`);
    } else {
      log('KECERDASAN', `sudah berstatus ${subtest.status}`);
    }

    // Soal dari bank soal (bukan fixture) wajib tercatat pada snapshot sesi.
    const fromDb = await prisma.examSessionQuestion.count({
      where: { subtestSessionId: subtest.id, questionId: { not: null } },
    });
    const figural = await prisma.examSessionQuestion.count({
      where: { subtestSessionId: subtest.id, externalId: { startsWith: 'PSI-KEC-FIG-' } },
    });
    log('sumber soal', `${fromDb}/${subtest.questionCount} dari bank soal`);
    log('soal figural', `${figural} soal PSI-KEC-FIG-* terpilih`);
    if (fromDb === 0) throw new VerifyError('sesi memakai fixture — bank soal tidak terbaca');
    if (figural === 0) {
      throw new VerifyError('tidak ada soal figural terpilih — seleksi pool memotong ekor pool');
    }

    const base = `/exams/sessions/${sessionId}/subtests/${subtest.id}`;
    const items: QuestionItem[] = [];
    let cursor: string | null = null;
    let total = 0;
    do {
      const page = await fetchQuestionPage(token, base, cursor);
      items.push(...page.items);
      total = page.total;
      cursor = page.nextCursor;
    } while (cursor);
    log('ambil soal', `${items.length}/${total} soal lewat API peserta`);
    if (items.length !== total) throw new VerifyError(`item terbaca ${items.length} != total ${total}`);

    if (JSON.stringify(items).includes('"isCorrect"')) {
      throw new VerifyError('payload peserta membocorkan isCorrect');
    }
    log('kebocoran kunci', 'tidak ada isCorrect pada payload');

    const imageQuestions = items.filter((question) => question.type === 'IMAGE_CHOICE');
    log('tipe IMAGE_CHOICE', `${imageQuestions.length} soal`);
    if (imageQuestions.length === 0) throw new VerifyError('tidak ada soal IMAGE_CHOICE pada payload');

    const incomplete = imageQuestions.filter(
      (question) =>
        !question.media.some((media) => media.role === 'STEM') ||
        question.options.some((option) => option.media.length === 0),
    );
    if (incomplete.length > 0) {
      throw new VerifyError(
        `${incomplete.length} soal IMAGE_CHOICE tanpa media stem/opsi lengkap`,
        incomplete.slice(0, 3).map((question) => question.id),
      );
    }
    log('kelengkapan media', 'stem + media untuk setiap opsi terisi');

    const signedPrefix = '/api/v1/media/';
    let checked = 0;
    let totalBytes = 0;
    /** Simpan byte yang sudah diunduh agar artefak tidak mengunduh ulang. */
    const cache = new Map<string, MediaBytes>();

    for (const question of imageQuestions) {
      const refs = [...question.media, ...question.options.flatMap((option) => option.media)];
      for (const ref of refs) {
        if (!ref.url.startsWith(signedPrefix)) {
          throw new VerifyError(`URL media inesperian: ${ref.url}`, { questionId: question.id });
        }
        const media = await downloadMedia(ref, question.id);
        cache.set(ref.url, media);
        checked += 1;
        totalBytes += media.bytes.length;
      }
    }
    log('unduh media', `${checked} URL → 200, ${totalBytes} byte gambar`);

    /** Ambil byte dari cache; unduh bila belum ada (mis. URL berbeda per soal). */
    const bytesOf = async (ref: MediaRef, questionId: string): Promise<MediaBytes> => {
      const cached = cache.get(ref.url);
      return cached ?? downloadMedia(ref, questionId);
    };

    // Artefak bukti: montase satu soal + dokumen HTML semua soal bergambar.
    await mkdir(OUT_DIR, { recursive: true });
    const entries: Array<{
      question: QuestionItem;
      stem: MediaBytes[];
      options: Array<{ label: string; media: MediaBytes[] }>;
    }> = await Promise.all(
      imageQuestions.map(async (question) => ({
        question,
        stem: await Promise.all(question.media.map((ref) => bytesOf(ref, question.id))),
        options: await Promise.all(
          question.options.map(async (option) => ({
            label: option.label,
            media: await Promise.all(option.media.map((ref) => bytesOf(ref, question.id))),
          })),
        ),
      })),
    );

    const sample = entries[0]!;
    const pngPath = resolve(OUT_DIR, 'f3-31-contoh-soal.png');
    const htmlPath = resolve(OUT_DIR, 'f3-31-semua-soal.html');
    await writeFile(pngPath, await buildMontage(sample.question, sample));
    await writeFile(
      htmlPath,
      buildHtml(entries, {
        sessionId,
        subtestId: subtest.id,
        checked,
        bytes: totalBytes,
      }),
      'utf8',
    );
    log('artefak', `${entries.length} soal → f3-31-contoh-soal.png + f3-31-semua-soal.html`);

    // Kontrol negatif: tanda tangan rusak harus ditolak, bukan tetap 200.
    const sampleUrl = sample.question.media[0]?.url ?? '';
    const signature = /sig=([^&]+)/.exec(sampleUrl)?.[1];
    if (signature) {
      const tampered = absolute(sampleUrl.replace(/sig=[^&]+/, `sig=${'0'.repeat(signature.length)}`));
      const response = await fetch(tampered);
      log('kontrol negatif', `sig dirusak → HTTP ${response.status}`);
      if (response.status === 200) throw new VerifyError('URL dengan tanda tangan rusak tetap dilayani');
    }

    console.log('\nsmoke:media LULUS');
  } catch (error) {
    failure = error;
  } finally {
    if (KEEP || reused) {
      log('bersihkan', `dilewati; sesi ${sessionId}`);
    } else {
      const deleted = await prisma.examSession.deleteMany({ where: { id: sessionId } });
      log('bersihkan', `hapus ${deleted.count} sesi`);
    }
  }

  if (failure) throw failure;
}

main()
  .catch((error: unknown) => {
    console.error('\nsmoke:media GAGAL');
    if (error instanceof VerifyError) {
      console.error(`  ${error.message}`);
      if (error.detail) console.error('  detail:', JSON.stringify(error.detail));
    } else {
      console.error(' ', error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
