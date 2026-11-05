# FASE 0 — Persiapan & Jaring Pengaman

**Prioritas:** P0 (prasyarat semua fase)
**Estimasi:** 0,5 hari
**Prasyarat:** —

---

## Tujuan

Menyiapkan kondisi kerja yang aman sebelum menyentuh mesin ujian:

1. Working tree bersih dan branch kerja terpisah.
2. Baseline kualitas tercatat (agar regresi terlihat).
3. Database uji terpisah untuk integration test.
4. Helper test dan skrip kosong siap dipakai fase berikutnya.

## Definition of Done fase

- [ ] Branch kerja aktif; `git status` bersih dari file scratch.
- [ ] Baseline `lint`, `typecheck`, `test`, `build` tercatat di `PROGRESS.md`.
- [ ] `DATABASE_URL_TEST` menunjuk DB terpisah dan sudah dimigrasi.
- [ ] Helper `apps/api/test/integration/setup.ts` bisa connect + truncate.
- [ ] Tidak ada duplikat `(session_id, order_index)` di DB dev.
- [ ] `pnpm test:integration` dan `pnpm smoke:cat` dikenali (boleh belum ada test).

---

## Daftar tugas

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F0-01 | Bersihkan file scratch `_tmp_*.ts` | `apps/api/_tmp_*.ts` | `git status --porcelain` tidak menampilkan `_tmp_*` | 15 m | — |
| F0-02 | Putuskan & commit seed bank soal yang belum masuk git | `apps/api/prisma/seed/questions/` | Commit terpisah ada; `pnpm test` tetap hijau | 30 m | F0-01 |
| F0-03 | Buat branch kerja | — | `git branch --show-current` = `fix/cat-fase-1` | 5 m | F0-02 |
| F0-04 | Catat baseline gerbang mutu | `docs/PROGRESS.md` | Tabel baseline terisi hasil nyata | 30 m | F0-03 |
| F0-05 | Siapkan DB uji terpisah | `.env`, `.env.example` | `pnpm db:ping` (dengan `DATABASE_URL_TEST`) berhasil | 30 m | — |
| F0-06 | Migrasi DB uji | — | `prisma migrate status` = up to date | 15 m | F0-05 |
| F0-07 | Buat helper integration test | `apps/api/test/integration/setup.ts` | Bisa connect + truncate tabel uji | 45 m | F0-06 |
| F0-08 | Cek duplikat data yang menghalangi migrasi | — | Query mengembalikan 0 baris | 10 m | F0-05 |
| F0-09 | Tambah script `test:integration` dan `smoke:cat` | `apps/api/package.json`, `package.json` | Perintah dikenali, exit 0 saat tidak ada test | 15 m | — |
| F0-10 | Catat baseline isi database | `docs/PROGRESS.md` | Jumlah tabel kunci tercatat | 15 m | F0-05 |

---

## Langkah detail

### F0-01 — Bersihkan file scratch

```powershell
Get-ChildItem apps\api -Filter "_tmp_*.ts" -Name
Remove-Item apps\api\_tmp_*.ts -Force
git status --porcelain
```

Berkas scratch yang pernah dipakai saat audit (semua tidak boleh ikut commit):
`_tmp_smoke*.ts`, `_tmp_probe*.ts`, `_tmp_bench.ts`, `_tmp_tx.ts`, `_tmp_pool.ts`,
`_tmp_deadlock.ts`, `_tmp_latency.ts`, `_tmp_state.ts`, `_tmp_url.ts`,
`_tmp_media_audit.ts`.

**Verifikasi:** `git status --porcelain` tidak memuat `_tmp_`.

---

### F0-02 — Putuskan seed bank soal

Repo berisi pekerjaan yang belum di-commit:

| Path | Keputusan |
| --- | --- |
| `apps/api/prisma/seed/questions/` (builder, kecerdasan, kepribadian, kecermatan, pass-hand, tpk) | **commit** — dibutuhkan Fase 4 |
| `apps/api/prisma/seed/question.seed.ts` | **commit** — sekarang hanya re-export |
| `apps/api/test/question-seed.spec.ts` | **commit** — test bank soal |

```powershell
git add apps/api/prisma/seed/questions apps/api/prisma/seed/question.seed.ts apps/api/test/question-seed.spec.ts
git commit -m "feat(seed): bank soal realistis 990 soal (Psikologi + TPK)"
pnpm test
```

**Verifikasi:** commit ada; `pnpm test` hijau.

> Catatan: seed ini **belum** punya TPA dan belum punya soal bergambar.
> Kekurangan itu ditangani di Fase 3 dan Fase 4 — jangan diubah di sini.

---

### F0-03 — Branch kerja

```powershell
git switch main
git pull --ff-only
git switch -c fix/cat-fase-1
```

**Verifikasi:** `git branch --show-current` → `fix/cat-fase-1`.

---

### F0-04 — Catat baseline

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tempel hasil nyata (jumlah task, jumlah test, status) ke tabel **Baseline** di
`docs/PROGRESS.md`. Jangan menulis "hijau" tanpa angka.

**Verifikasi:** setiap baris baseline punya angka dan tanggal.

---

### F0-05 — DB uji terpisah

**Opsi A — Postgres lokal (disarankan untuk lokal)**

```powershell
docker run -d --name webcat-test `
  -e POSTGRES_PASSWORD=test `
  -e POSTGRES_DB=webcat_test `
  -p 5433:5432 postgres:17
```

`apps/api/.env.test` (jangan commit kredensial produksi):

```
DATABASE_URL="postgresql://postgres:test@localhost:5433/webcat_test"
DIRECT_URL="postgresql://postgres:test@localhost:5433/webcat_test"
```

**Opsi B — Supabase project kedua**
Cocok bila ingin menguji perilaku pooler (`connection_limit=1`) yang menjadi
akar B2. Catat pilihan di `PROGRESS.md` karena memengaruhi interpretasi hasil.

**Verifikasi:**

```powershell
$env:DATABASE_URL_TEST="postgresql://postgres:test@localhost:5433/webcat_test"
pnpm --filter @webcat/api exec tsx -e "console.log(process.env.DATABASE_URL_TEST)"
```

---

### F0-06 — Migrasi DB uji

```powershell
$env:DATABASE_URL="postgresql://postgres:test@localhost:5433/webcat_test"
$env:DIRECT_URL=$env:DATABASE_URL
pnpm db:deploy
pnpm --filter @webcat/api prisma:validate
```

**Verifikasi:** `prisma migrate status` → `Database schema is up to date!`

---

### F0-07 — Helper integration test

Buat `apps/api/test/integration/setup.ts`:

```ts
import { PrismaClient } from '@prisma/client';

export const TEST_DB_URL = process.env.DATABASE_URL_TEST ?? '';
/** Test integrasi hanya berjalan bila DB uji tersedia. */
export const integrationEnabled = TEST_DB_URL.length > 0;

export function createTestPrisma(): PrismaClient {
  if (!integrationEnabled) throw new Error('DATABASE_URL_TEST belum diisi');
  return new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
}

/** Bersihkan data uji; urutan mengikuti foreign key. */
export async function resetTestData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      exam_answer_events,
      exam_session_questions,
      subtest_locks,
      exam_session_subtests,
      exam_session_stages,
      exam_sessions,
      question_media,
      question_tags,
      question_options,
      questions,
      media_assets
    RESTART IDENTITY CASCADE
  `);
}
```

**Verifikasi:** file bisa diimpor dan `resetTestData` jalan pada DB uji kosong.

---

### F0-08 — Cek duplikat sebelum migrasi

```sql
SELECT session_id, order_index, count(*)
FROM exam_session_subtests
GROUP BY session_id, order_index
HAVING count(*) > 1;
```

Bila ada baris: **hentikan**. Migrasi index di F1-01 akan gagal selama duplikat
masih ada. Selesaikan dengan mengarsipkan/menghapus sesi uji lama.

**Verifikasi:** 0 baris.

---

### F0-09 — Script npm

`apps/api/package.json`:

```json
{
  "scripts": {
    "test:integration": "vitest run test/integration",
    "smoke:cat": "tsx scripts/smoke-cat.ts"
  }
}
```

Root `package.json`:

```json
{
  "scripts": {
    "test:integration": "pnpm --filter @webcat/api test:integration",
    "smoke:cat": "pnpm --filter @webcat/api smoke:cat"
  }
}
```

Buat `apps/api/scripts/smoke-cat.ts` minimal (isi lengkap di F2-08):

```ts
console.log('smoke:cat belum diimplementasikan — lihat F2-08');
process.exit(0);
```

**Verifikasi:**

```powershell
pnpm test:integration   # boleh 0 test, exit 0
pnpm smoke:cat          # exit 0
```

> `vitest run test/integration` dengan folder kosong akan gagal
> (`passWithNoTests: false`). Tambahkan satu spec placeholder yang di-skip
> bila `integrationEnabled === false`, atau set `--passWithNoTests` sementara.

---

### F0-10 — Baseline isi database

```sql
SELECT 'users' t, count(*) FROM users
UNION ALL SELECT 'questions', count(*) FROM questions
UNION ALL SELECT 'questions_published', count(*) FROM questions WHERE status='PUBLISHED'
UNION ALL SELECT 'plans', count(*) FROM plans
UNION ALL SELECT 'exam_stages', count(*) FROM exam_stages
UNION ALL SELECT 'subtests', count(*) FROM subtests
UNION ALL SELECT 'exam_sessions', count(*) FROM exam_sessions
UNION ALL SELECT 'media_assets', count(*) FROM media_assets
UNION ALL SELECT 'question_media', count(*) FROM question_media;
```

Catat di `PROGRESS.md` sebagai pembanding setelah seed.

---

## Verifikasi fase

```powershell
git status --porcelain          # bersih
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:integration
pnpm smoke:cat
```

Semua harus lulus sebelum masuk Fase 1.

## Risiko fase ini

| Risiko | Mitigasi |
| --- | --- |
| Commit seed mengubah hasil test lain | jalankan `pnpm test` sebelum commit |
| DB uji tidak sengaja menunjuk DB produksi | cek `DATABASE_URL_TEST` != `DATABASE_URL` sebelum truncate |
| `resetTestData` menghapus data penting | helper hanya dipakai bila `integrationEnabled` dan host bukan produksi |
