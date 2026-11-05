# FASE 2 — Integration Test & Anti-Regresi (P0)

**Prioritas:** P0
**Estimasi:** 1,5 hari
**Prasyarat:** Fase 1 selesai (blocker sudah diperbaiki)

---

## Tujuan

Membuat bug Fase 1 **tidak bisa kembali diam-diam**.

Masalah saat ini:

- Seluruh test API memakai fake Prisma → tidak pernah menyentuh PostgreSQL.
- Tidak ada satu pun spec untuk `startSession` / `openSubtest`.
- `pnpm test` hijau padahal alur ujian gagal total.

## Definition of Done fase

- [ ] `pnpm test:integration` hijau terhadap PostgreSQL nyata.
- [ ] `pnpm smoke:cat` lulus berulang dan membersihkan data uji.
- [ ] CI menjalankan job integrasi otomatis.
- [ ] Dokumentasi cara menjalankan tersedia.

---

## Daftar tugas

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F2-01 | Factory data uji (user, langganan, konfigurasi ujian) | `apps/api/test/integration/factory.ts` | Satu sesi bisa dibuat lewat service | 1 j | F0-07 |
| F2-02 | Spec struktur `startSession` | `exam-start.spec.ts` | 3 stage, 6 subtes, urutan benar | 1 j | F2-01 |
| F2-03 | Spec kuota harian | idem | 409 dengan kode benar | 30 m | F2-02 |
| F2-04 | Spec `openSubtest` KECERDASAN | `exam-open.spec.ts` | 100 soal, status ACTIVE | 1 j | F2-01 |
| F2-05 | Spec `openSubtest` KECERMATAN (500) | idem | Selesai < 5 s | 1 j | F2-04 |
| F2-06 | Spec alur penuh | `exam-flow.spec.ts` | open→questions→autosave→heartbeat→events→finish→result | 2 j | F2-04 |
| F2-07 | Spec autosave idempoten | idem | `clientSeq` sama tidak menduplikasi | 30 m | F2-06 |
| F2-08 | Script smoke HTTP | `apps/api/scripts/smoke-cat.ts` | Lulus berulang + cleanup | 2 j | F2-06 |
| F2-09 | Job CI integrasi | `.github/workflows/ci.yml` | Job jalan di PR | 1 j | F2-06 |
| F2-10 | Dokumentasi | `docs/README.md`, `docs/perbaikan/README-test.md` | Langkah jelas | 30 m | F2-08 |

---

## Langkah detail

### F2-01 — Factory data uji

Buat `apps/api/test/integration/factory.ts`:

```ts
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

/** User uji dengan email terverifikasi + langganan aktif. */
export async function createExamUser(prisma: PrismaClient, suffix = 'default') {
  const email = `integration-${suffix}@example.test`;
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: `Integration ${suffix}`,
      passwordHash: createHash('sha256').update('Integration123!').digest('hex'),
      emailVerifiedAt: new Date(),
      role: 'USER',
    },
  });
}
```

Konfigurasi ujian (`exam_stages`, `subtests`, `exam_settings`, `plans`) diambil
dari seeder yang sudah ada — **jangan** menduplikasi angka di test. Panggil
`seedExamConfig`/`seedPlans` dari `apps/api/prisma/seed/`.

Bila `ACCESS_POLICY=dev`, langganan tidak wajib; namun test integrasi sebaiknya
memakai `billing` untuk menguji jalur nyata. Catat pilihan di `PROGRESS.md`.

**Verifikasi:** helper bisa membuat user + sesi lewat `ExamSessionService.startSession`.

---

### F2-02 — Spec struktur `startSession`

```ts
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { integrationEnabled, createTestPrisma, resetTestData } from './setup';

describe.skipIf(!integrationEnabled)('startSession (Postgres nyata)', () => {
  const prisma = createTestPrisma();

  beforeAll(async () => { await resetTestData(prisma); /* seed konfigurasi */ });
  afterAll(async () => { await prisma.$disconnect(); });

  it('membuat 3 stage dan 6 subtes dengan urutan benar', async () => {
    const session = await service.startSession(user.id);
    expect(session.stages).toHaveLength(3);
    expect(session.subtests.map((s) => s.subtestCode)).toEqual([
      'KECERDASAN',
      'KEPRIBADIAN',
      'KECERMATAN',
      'PASS_HAND',
      'TPA',
      'TPK',
    ]);
  });
});
```

Asersi wajib:

- jumlah baris `exam_session_subtests` = 6
- `subtest_code` unik dalam sesi
- `order_index` boleh berulang antar-stage (regresi B1)
- subtes pertama `READY`, sisanya `LOCKED`

---

### F2-03 — Spec kuota harian

```ts
it('menolak sesi kedua di hari yang sama', async () => {
  await service.startSession(user.id);
  // selesaikan/void sesi pertama sesuai kebijakan
  await expect(service.startSession(user.id)).rejects.toMatchObject({
    code: expect.stringMatching(/EXAM_SESSION_(ALREADY_TODAY|ACTIVE_EXISTS)/),
  });
});
```

Pastikan kode yang diharapkan sesuai kebijakan: sesi aktif → `EXAM_SESSION_ACTIVE_EXISTS`;
kuota harian → `EXAM_SESSION_ALREADY_TODAY`.

---

### F2-04 — Spec `openSubtest`

```ts
it('membuka KECERDASAN dan mematerialisasi 100 soal', async () => {
  const session = await service.startSession(user.id);
  const opened = await service.openSubtest(user.id, session.session.id, subtestId);
  expect(opened.current?.status).toBe('ACTIVE');

  const count = await prisma.examSessionQuestion.count({
    where: { subtestSessionId: subtestId },
  });
  expect(count).toBe(100);
});
```

Asersi tambahan:

- `ends_at` ≈ `started_at + durationMinutes`
- membuka dua kali idempoten (tidak menambah soal)

---

### F2-05 — Spec KECERMATAN 500

```ts
it('materialisasi 500 soal selesai di bawah 5 detik', async () => {
  const started = Date.now();
  await service.openSubtest(user.id, sessionId, subtestIdKecermatan);
  expect(Date.now() - started).toBeLessThan(5_000);
});
```

Test ini adalah **jaring pengaman utama** untuk B2: pada konfigurasi lama
(root client di dalam tx) test ini gagal karena timeout.

---

### F2-06 — Spec alur penuh

Urutan asersi:

1. `startSession` → `sessionId`, subtes pertama.
2. `openSubtest` → ACTIVE, `remainingMs > 0`.
3. `getQuestions({ limit: 50 })` → 50 item, `nextCursor` ada.
4. Halaman kedua → tidak ada `id` duplikat.
5. `autosave` 10 jawaban → `saved` 10.
6. `heartbeat` → 2xx.
7. `proctoring.recordEvents` → `accepted` sesuai.
8. `finishSubtest` → status terminal.
9. `getResult` → skor terisi.
10. `getHistory` → memuat sesi.

---

### F2-07 — Spec autosave idempoten

```ts
it('replay clientSeq yang sama tidak menduplikasi jawaban', async () => {
  const batch = { clientSeq: 'seq-1', answers: [/* 10 */] };
  const first = await service.autosave(user.id, sessionId, subtestId, batch);
  const second = await service.autosave(user.id, sessionId, subtestId, batch);

  expect(second.saved).toEqual(first.saved);
  const events = await prisma.examAnswerEvent.count({
    where: { sessionQuestionId: { in: first.saved } },
  });
  expect(events).toBe(10);
});
```

---

### F2-08 — Script smoke `smoke:cat`

`apps/api/scripts/smoke-cat.ts` — persyaratan:

1. Login lewat `POST /auth/login` (jangan hardcode token).
2. Jalankan minimal: start → open 1 subtes → ambil 20 soal → jawab → finish → result.
3. Opsional `--full` untuk keenam subtes.
4. `finally`: hapus sesi uji + data turunan.
5. Exit code ≠ 0 bila ada langkah gagal.
6. Cetak ringkasan langkah + durasi.

Kerangka:

```ts
const API = process.env.SMOKE_API ?? 'http://localhost:3100/api/v1';
const steps: Array<{ name: string; ok: boolean; ms: number }> = [];

async function step(name: string, fn: () => Promise<void>) {
  const t = Date.now();
  await fn();
  steps.push({ name, ok: true, ms: Date.now() - t });
}

try {
  await step('login', login);
  await step('start session', start);
  await step('open subtest', open);
  await step('fetch questions', fetchQuestions);
  await step('answer', answer);
  await step('finish', finish);
  await step('result', result);
} finally {
  await cleanup().catch(() => undefined);
}

const failed = steps.filter((s) => !s.ok);
process.exit(failed.length === 0 ? 0 : 1);
```

**Verifikasi:** jalankan 2× berturut-turut; keduanya lulus dan `exam_sessions`
kembali ke baseline.

---

### F2-09 — Job CI

Tambahkan ke `.github/workflows/ci.yml`:

```yaml
  integration:
    name: Integration (Postgres)
    runs-on: ubuntu-latest
    needs: verify
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: webcat_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://postgres:test@localhost:5432/webcat_test
      DIRECT_URL: postgresql://postgres:test@localhost:5432/webcat_test
      DATABASE_URL_TEST: postgresql://postgres:test@localhost:5432/webcat_test

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm --filter @webcat/contracts build
      - run: pnpm db:deploy
      - run: pnpm test:integration
```

Catatan: job ini memakai `postgres:17` lokal tanpa pooler, sehingga
`connection_limit` tidak diuji. Bila ingin mereplikasi B2 secara persis,
tambahkan `?connection_limit=1` pada URL.

---

### F2-10 — Dokumentasi

Tambahkan bagian "Menjalankan test integrasi" di `docs/README.md`:

1. Siapkan DB uji (Docker atau Supabase kedua).
2. Set `DATABASE_URL_TEST`.
3. `pnpm db:deploy` dengan `DATABASE_URL` = DB uji.
4. `pnpm test:integration`.
5. `pnpm smoke:cat` (API harus berjalan).

---

## Verifikasi fase

```powershell
$env:DATABASE_URL="postgresql://postgres:test@localhost:5433/webcat_test"
$env:DIRECT_URL=$env:DATABASE_URL
$env:DATABASE_URL_TEST=$env:DATABASE_URL
pnpm db:deploy
pnpm test:integration
pnpm smoke:cat
```

| Cek | Target |
| --- | --- |
| `test:integration` | semua spec lulus |
| `smoke:cat` dijalankan 2× | lulus keduanya |
| `exam_sessions` setelah smoke | kembali ke baseline |
| CI job `integration` | hijau di PR |

---

## Risiko fase ini

| Risiko | Mitigasi |
| --- | --- |
| Test integrasi tidak sengaja menghapus data produksi | guard: host harus `localhost` atau `*.test`; tolak bila `NODE_ENV=production` |
| Test lambat (500 soal) memperlambat CI | batasi hanya satu spec berat; jalankan paralel bila perlu |
| Flaky karena waktu/timer | pakai `exam-clock` dengan waktu tetap (inject `now`) |
| `passWithNoTests: false` membuat CI gagal saat DB tidak ada | gunakan `describe.skipIf` + `--passWithNoTests` hanya untuk job tanpa DB |

---

## Commit yang disarankan

1. `test(integration): harness + factory data uji (F2-01)`
2. `test(integration): startSession & kuota harian (F2-02, F2-03)`
3. `test(integration): openSubtest termasuk KECERMATAN 500 soal (F2-04, F2-05)`
4. `test(integration): alur penuh & autosave idempoten (F2-06, F2-07)`
5. `feat(scripts): smoke:cat (F2-08)`
6. `ci: job integrasi Postgres (F2-09)`
