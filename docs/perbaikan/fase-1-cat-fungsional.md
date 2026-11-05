# FASE 1 — Alur CAT Fungsional (P0)

**Prioritas:** P0 — memblokir seluruh fitur ujian
**Estimasi:** 2 hari
**Prasyarat:** Fase 0 selesai

---

## Tujuan

Membuat peserta bisa: mulai sesi → buka subtes → jawab → selesai → lihat hasil,
**tanpa intervensi database**.

Saat ini alur gagal total di dua titik:

| Blocker | Gejala | Akar masalah |
| --- | --- | --- |
| **B1** | `POST /exams/sessions` → 409 `EXAM_SESSION_ALREADY_TODAY` padahal 0 sesi | `orderIndex` subtes per-stage vs `@@unique([sessionId, orderIndex])` → `P2002`; handler memetakan semua `P2002` ke kode itu |
| **B2** | `POST .../open` → 500 timeout 5000 ms | `prepare()` memakai root `this.prisma` di dalam `$transaction` + `connection_limit=1` |

## Definition of Done fase

- [ ] `POST /api/v1/exams/sessions` → 2xx, 6 baris `exam_session_subtests` terbentuk.
- [ ] `P2002` non-sesi-harian tidak lagi menjadi `EXAM_SESSION_ALREADY_TODAY`.
- [ ] `POST .../subtests/:id/open` → 2xx untuk **keenam** subtes.
- [ ] Alur penuh sampai `GET .../result` berhasil.
- [ ] Tidak ada timeout transaksi di log.
- [ ] Data uji dibersihkan kembali ke baseline.

---

## Daftar tugas

### 1A — Blocker B1 (`order_index`)

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F1-01 | Ubah `@@unique([sessionId, orderIndex])` → `@@index([sessionId, orderIndex])` | `apps/api/prisma/schema/exam.prisma:181` | `prisma validate` lulus | 10 m | F0-03 |
| F1-02 | Buat migrasi bernama | `apps/api/prisma/migrations/` | SQL memuat `DROP INDEX` + `CREATE INDEX` | 20 m | F1-01 |
| F1-03 | Terapkan migrasi ke DB dev | — | `prisma migrate status` up to date | 10 m | F1-02 |
| F1-04 | Sempitkan handler `P2002` | `exam-session.service.ts:264-272` | Hanya `(user_id, exam_date)` yang dipetakan | 30 m | F1-01 |
| F1-05 | Unit test pemetaan error | `apps/api/test/exam-session-start.spec.ts` (baru) | Test lulus | 45 m | F1-04 |
| F1-06 | Verifikasi runtime start sesi | — | 201 + 6 baris subtes | 20 m | F1-03, F1-04 |

### 1B — Blocker B2 (deadlock transaksi)

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F1-07 | Tambah parameter client pada `prepare()` & `loadFromDatabase()` | `exam-question-source.ts:405-435` | Typecheck lulus; default tetap root | 45 m | F0-03 |
| F1-08 | `materializeQuestions` memanggil `prepare(input, tx)` | `exam-session.service.ts:480` | Jalur tx tidak menyentuh `this.prisma` | 15 m | F1-07 |
| F1-09 | Naikkan batas transaksi `openSubtest` | `exam-session.service.ts:414` | `timeout: 20_000`, `maxWait: 10_000` | 15 m | F1-08 |
| F1-10 | Audit semua `$transaction` yang memakai root client | `apps/api/src` | Daftar hasil audit di `PROGRESS.md` | 1 j | F1-08 |
| F1-11 | (Opsional) Materialisasi di luar transaksi | `exam-session.service.ts` | Transaksi hanya update status | 3 j | F1-10 |

### 1C — Verifikasi alur end-to-end

| ID | Pekerjaan | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- |
| F1-12 | Login user demo + `POST /exams/sessions` | 201, `session.id` ada | 10 m | F1-06 |
| F1-13 | `POST .../subtests/KECERDASAN/open` | 200, status `ACTIVE` | 10 m | F1-12 |
| F1-14 | `GET .../questions?limit=20` dua halaman | `meta.total` benar; tidak ada `isCorrect`/`dimensionMap` | 15 m | F1-13 |
| F1-15 | `PATCH .../answers` + replay `clientSeq` | `saved` lengkap, `rejected: []`, idempoten | 15 m | F1-14 |
| F1-16 | `POST .../heartbeat` + `POST .../events` | 2xx | 10 m | F1-13 |
| F1-17 | `POST .../finish` + `GET .../result` | 2xx, skor terisi | 15 m | F1-15 |
| F1-18 | Ulangi untuk keenam subtes | Semua subtes selesai | 45 m | F1-17 |
| F1-19 | Bersihkan data uji | `exam_sessions` kembali ke baseline | 15 m | F1-18 |

---

## Langkah detail

### F1-01 — Perubahan schema

```prisma
model ExamSessionSubtest {
  // ...
  // sebelum
  @@unique([sessionId, orderIndex])
  @@unique([sessionId, subtestId])

  // sesudah
  @@index([sessionId, orderIndex])
  @@unique([sessionId, subtestId])
}
```

**Alasan memilih index non-unik** (bukan membuat `orderIndex` global 1..6):

- `orderIndex` dipakai untuk label "Subtes ke-N" di runner.
- `previousSubtestEndedAt` dan `assertPreviousSubtestsTerminal` membandingkan
  `orderIndex` **di dalam stage yang sama**.
- Mengubahnya jadi global = perubahan perilaku tanpa manfaat.
- `@@unique([sessionId, subtestId])` sudah mencegah subtes duplikat dalam sesi.

**Verifikasi:**

```powershell
pnpm db:validate
```

---

### F1-02 — Migrasi

```powershell
pnpm --filter @webcat/api prisma:migrate -- --name fix_exam_session_subtest_order_index
```

Buka file migrasi yang dihasilkan, pastikan berisi:

```sql
DROP INDEX "exam_session_subtests_session_id_order_index_key";
CREATE INDEX "exam_session_subtests_session_id_order_index_idx"
  ON "exam_session_subtests"("session_id", "order_index");
```

Bila Prisma justru membuat `@@unique` baru, periksa kembali edit schema.

**Verifikasi:** isi file migrasi sesuai di atas.

---

### F1-03 — Terapkan migrasi

```powershell
pnpm db:deploy
# atau untuk dev:
pnpm db:migrate
pnpm --filter @webcat/api prisma:migrate -- --status
```

**Verifikasi:** `Database schema is up to date!`

---

### F1-04 — Sempitkan handler `P2002`

Lokasi: `apps/api/src/modules/exams/exam-session.service.ts`, sekitar baris 264.

```ts
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target)
      ? (error.meta.target as string[])
      : [];

    // Hanya partial unique index sesi harian yang berarti kuota habis.
    const isDailySessionLimit = target.includes('user_id') && target.includes('exam_date');
    if (isDailySessionLimit) {
      throw new AppError({
        code: 'EXAM_SESSION_ALREADY_TODAY',
        status: 409,
        message: 'Sesi ujian hari ini sudah pernah dibuat',
      });
    }

    // Constraint lain = bug konfigurasi/data; jangan disamarkan.
    this.logger.error('P2002 tak terduga saat membuat sesi ujian', { target });
  }
  throw error;
}
```

Bila `Logger` belum ada, tambahkan `private readonly logger = new Logger(ExamSessionService.name)`.

**Verifikasi:** kode tidak lagi menelan semua `P2002`.

---

### F1-05 — Unit test pemetaan error

Buat `apps/api/test/exam-session-start.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ExamSessionService } from '../src/modules/exams/exam-session.service';

// Bangun service dengan dependency palsu; cukup uji jalur error.
function makeService(createImpl: () => Promise<unknown>) {
  const prisma = {
    examSession: { create: vi.fn(createImpl), count: vi.fn(async () => 0), findFirst: vi.fn(async () => null) },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  // ... inject prisma + fake config/accessPolicy/questionPool/finalizer/projection/source
  return { prisma };
}

describe('startSession — pemetaan P2002', () => {
  it('P2002 (session_id, order_index) bukan EXAM_SESSION_ALREADY_TODAY', async () => {
    // harapan: error dilempar ulang sebagai P2002 / CommonError, bukan 409 harian
  });

  it('P2002 (user_id, exam_date) menjadi EXAM_SESSION_ALREADY_TODAY', async () => {
    // harapan: 409 dengan code EXAM_SESSION_ALREADY_TODAY
  });
});
```

Asersi penting:

```ts
expect(error.code).not.toBe('EXAM_SESSION_ALREADY_TODAY'); // kasus pertama
expect(error.code).toBe('EXAM_SESSION_ALREADY_TODAY');     // kasus kedua
```

**Verifikasi:** `pnpm --filter @webcat/api test exam-session-start`

---

### F1-06 — Verifikasi runtime start

```powershell
# 1. Jalankan API
$env:PORT="3100"; pnpm --filter @webcat/api dev

# 2. Login
curl -s -X POST http://localhost:3100/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"user@example.com\",\"password\":\"PesertaDemo123\"}'

# 3. Start sesi
curl -s -X POST http://localhost:3100/api/v1/exams/sessions `
  -H "Authorization: Bearer <TOKEN>"
```

**Verifikasi:** response 2xx. Lalu cek DB:

```sql
SELECT count(*) FROM exam_session_subtests WHERE session_id = '<id>';  -- 6
SELECT subtest_code, order_index, status FROM exam_session_subtests
WHERE session_id = '<id>' ORDER BY created_at;  -- KECERDASAN..TPK, urutan benar
```

---

### F1-07 — Parameter client pada `ExamQuestionSource`

`apps/api/src/modules/exams/exam-question-source.ts`:

```ts
async prepare(
  input: { subtestSessionId: string; subtestCode: SubtestCode; count: number },
  db: Prisma.TransactionClient | PrismaService = this.prisma,
): Promise<MaterializedQuestionSeed[]> {
  const dbQuestions = await this.loadFromDatabase(input.subtestCode, input.count, db);
  if (dbQuestions.length >= input.count) {
    const rng = createRng(hashSeed(input.subtestSessionId));
    return shuffle(rng, dbQuestions).map((row, index) => mapDbQuestion(row, index + 1));
  }
  return buildFixture(input.subtestCode, input.count, input.subtestSessionId);
}

private async loadFromDatabase(
  code: SubtestCode,
  count: number,
  db: Prisma.TransactionClient | PrismaService,
): Promise<QuestionRow[]> {
  const rows = await db.question.findMany({ /* ...sama... */ });
  // ...
}
```

**Verifikasi:** `pnpm --filter @webcat/api typecheck`

---

### F1-08 — Pakai `tx`

`apps/api/src/modules/exams/exam-session.service.ts` (`materializeQuestions`, sekitar 480):

```ts
const seeds = await this.questionSource.prepare(
  {
    subtestSessionId,
    subtestCode: subtestCode as SubtestCode,
    count: config.questionCount,
  },
  tx, // ← koneksi transaksi, bukan root
);
```

**Verifikasi:** grep jalur ini tidak menyentuh `this.prisma`.

---

### F1-09 — Batas transaksi

`openSubtest`, sekitar baris 414:

```ts
await this.prisma.$transaction(
  async (tx) => {
    /* ... */
  },
  {
    // Materialisasi terbesar = KECERMATAN 500 soal; default 5 detik terlalu ketat
    // terutama pada pooler dengan connection_limit=1.
    maxWait: 10_000,
    timeout: 20_000,
  },
);
```

**Verifikasi:** `openSubtest` KECERMATAN selesai < 3 detik (lihat F1-18).

---

### F1-10 — Audit transaksi lain

```powershell
Select-String -Path apps\api\src\**\*.ts -SimpleMatch -Pattern '$transaction' | ForEach-Object { "$($_.Path):$($_.LineNumber)" }
```

Titik yang sudah diketahui (audit 5 Nov 2026):

| Lokasi | Isi | Status |
| --- | --- | --- |
| `exam-session.service.ts:222` | `startSession` — `tx.*` saja | aman |
| `exam-session.service.ts:414` | `openSubtest` — **memakai `prepare()` root** | **perlu F1-07/F1-08** |
| `exam-session.service.ts:736` | `autosave` — `tx.*` saja | aman |
| `auth/users` (array-form `$transaction([...])`) | batch, bukan interaktif | aman |

Aturan umum: **jangan pernah** memanggil `this.prisma.*` atau service lain yang
memakai Prisma sendiri di dalam callback `$transaction(async (tx) => ...)`.

---

### F1-11 — Materialisasi di luar transaksi (opsional)

Lakukan hanya bila F1-09 belum cukup. Rancangan:

```
1. tx pendek: advisory lock + baca status subtes
2. di luar tx: materializeQuestions(subtestSessionId, ...)  // idempoten
3. tx pendek: update status subtes/stage/sesi + endsAt
```

Aman karena materialisasi memakai guard `count` + `createMany({ skipDuplicates: true })`.

---

### F1-12 .. F1-17 — Alur manual

Gunakan skrip ad-hoc **atau** langsung kerjakan F2-08 (`smoke:cat`) lalu pakai
skrip itu. Urutan asersi:

| Langkah | Endpoint | Asersi |
| --- | --- | --- |
| 1 | `POST /exams/sessions` | 201; `session.id`; `current` = KECERDASAN |
| 2 | `POST .../open` | 200; `subtest.status` = ACTIVE; `remainingMs > 0` |
| 3 | `GET .../questions?limit=20` | 20 item; `meta.nextCursor` ada |
| 4 | `GET .../questions?cursor=<next>` | tidak ada `id` duplikat |
| 5 | `PATCH .../answers` (10 item) | `saved.length` = 10; `rejected` kosong |
| 6 | `PATCH .../answers` (clientSeq sama) | tetap 10; DB tidak bertambah |
| 7 | `POST .../heartbeat` | 2xx; `serverTime` valid |
| 8 | `POST .../events` | 2xx; `accepted` = jumlah event |
| 9 | `POST .../finish` | 2xx; status terminal |
| 10 | `GET .../result` | 2xx; skor terisi |

Catatan bentuk response: `ResponseInterceptor` meng-unwrap payload paginasi →
item ada di `data`, metadata (`nextCursor`, `hasMore`, `total`) ada di `meta`.

---

### F1-18 — Enam subtes

Hambatan: `finish` dengan skor di bawah passing **langsung** membuat sesi
`ELIMINATED` dan subtes berikutnya `LOCKED` (by design).

Pilih salah satu:

**Opsi A — jawab benar semua** (tanpa ubah kode)
Kunci jawaban ada di `exam_session_questions.snapshot.options[].isCorrect`
(lingkungan uji saja). Bacara langsung dari DB, lalu kirim `optionIds` yang benar.

**Opsi B — flag dev**
Tambahkan env `EXAM_BYPASS_PASSING=true`; pada `finalizer`/`finishSubtest`,
bila `NODE_ENV !== 'production'` dan flag aktif, jangan tandai `ELIMINATED` dan
buka subtes berikutnya. **Wajib** menolak flag ini di produksi.

Catat pilihan di `PROGRESS.md` bagian **Keputusan**.

**Verifikasi:** 6 subtes berstatus terminal; `GET /exams/history` memuat 1 sesi.

---

### F1-19 — Cleanup

```sql
DELETE FROM exam_sessions WHERE id = '<session-id>';  -- cascade ke stage/subtest/question/event
```

Atau lewat Prisma di skrip. **Verifikasi:**

```sql
SELECT count(*) FROM exam_sessions;              -- kembali ke baseline
SELECT count(*) FROM exam_session_questions;     -- 0 untuk sesi uji
```

---

## Verifikasi fase

```powershell
pnpm lint
pnpm typecheck
pnpm test
$env:PORT="3100"; pnpm --filter @webcat/api dev   # terminal terpisah
pnpm smoke:cat                                    # setelah F2-08
```

| Cek | Target |
| --- | --- |
| `POST /exams/sessions` | 2xx |
| `POST .../open` × 6 subtes | 2xx semua |
| `exam_session_questions` KECERDASAN | 100 baris |
| `exam_session_questions` KECERMATAN | 500 baris |
| `open` KECERMATAN | < 3 detik |
| Log | tidak ada `timeout` / `P2002` |

---

## Risiko fase ini

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Data duplikat `(session_id, order_index)` | migrasi gagal | F0-08 lebih dulu |
| Migrasi menghapus `@@unique` yang masih dibutuhkan | subtes duplikat bisa masuk | `@@unique([sessionId, subtestId])` tetap ada |
| Masih ada root client di jalur tx | timeout berulang | F1-10 audit menyeluruh |
| 500 soal memakan > 20 detik | transaksi putus | kerjakan F1-11 |
| Sistem gugur menyulitkan uji alur penuh | F1-18 gagal | opsi A (jawab benar) atau B (flag dev) |

---

## Commit yang disarankan

1. `fix(exam): hapus unique index order_index subtes sesi (F1-01)`
2. `fix(exam): petakan P2002 hanya untuk kuota sesi harian (F1-04)`
3. `test(exam): unit test pemetaan error startSession (F1-05)`
4. `fix(exam): materialisasi soal memakai transaksi yang sama (F1-07)`
5. `chore(exam): naikkan batas transaksi openSubtest (F1-09)`
