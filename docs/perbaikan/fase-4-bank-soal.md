# FASE 4 — Bank Soal & Konten (P1)

**Prioritas:** P1
**Estimasi:** 2 hari
**Prasyarat:** Fase 1 selesai; Fase 3 (untuk soal figural)

---

## Tujuan

Membuat `QUESTION_POOL=db` valid untuk **semua** subtes, sehingga sesi ujian
memakai soal nyata dari database — bukan soal sintetis yang dibuat diam-diam.

## Kondisi saat ini (bukti audit 5 Nov 2026)

| Temuan | Angka |
| --- | --- |
| Soal di DB | 14 |
| Soal `PUBLISHED` | **0** (semua `DRAFT`) |
| Bank soal di repo (belum di-seed) | 990 soal |
| Subtes `TPA` di seed | **tidak ada** (`SeedSubtestCode` tanpa `TPA`) |
| Soal `IMAGE_CHOICE` di bank | 0 |
| `MULTI_CHOICE` di bank | 0 |

**Akibat:** `QUESTION_POOL=db` tidak bisa dipakai. Bila dipaksa, muncul fallback
ke `buildFixture()` (`exam-question-source.ts`) — peserta bisa mengerjakan soal
karangan tanpa ada yang menyadarinya.

## Definition of Done fase

- [x] Semua subtes memenuhi kuota soal `PUBLISHED`.
      → KECERDASAN 147/100, KEPRIBADIAN 143/140, KECERMATAN 500/500,
      PASS_HAND 150/150, TPA 105/100, TPK 100/100 (`pnpm pool:coverage`).
- [x] `TPA` ada di bank soal dan terdaftar di seed.
- [x] Tidak ada fallback senyap ke `buildFixture()` pada jalur produksi.
      → `QUESTION_POOL=db` → 503 `EXAM_POOL_INSUFFICIENT`; `dev` → `logger.warn`.
- [x] `QUESTION_POOL=db` dipakai di `.env` dan sesi berjalan dari DB.
- [x] Seed idempoten (dijalankan 2× tidak menggandakan soal).

---

## Daftar tugas

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F4-01 | Jalankan `pnpm db:seed` ke DB dev | — | 990+ soal tersimpan | 30 m | F3-25 |
| F4-02 | Verifikasi status & kuota per subtes | — | Semua `PUBLISHED`, kuota terpenuhi | 30 m | F4-01 |
| F4-03 | Buat bank TPA 100 soal (verbal, numerik, penalaran) | `apps/api/prisma/seed/questions/tpa.ts` (baru) | 100 soal valid | 1,5 j | F4-01 |
| F4-04 | Daftarkan `TPA` pada tipe seed + kategori `tpa/*` | `seed/questions/index.ts`, `seed/questions/types.ts` | Seed membangun TPA | 45 m | F4-03 |
| F4-05 | Tambah `MULTI_CHOICE` (saat ini 0) | `seed/questions/kecerdasan.ts`, `tpa.ts` | ≥ 5 soal multi-choice | 1 j | F4-04 |
| F4-06 | Test `pair_group` Kepribadian berpasangan + ada item terbalik | `apps/api/test/question-seed.spec.ts` | Lulus | 45 m | F4-01 |
| F4-07 | Aktifkan `QUESTION_POOL=db` | `.env`, `.env.example` | Sesi berjalan dari DB | 2 j | F4-02 |
| F4-08 | Hilangkan/perjelas fallback senyap ke `buildFixture()` | `exam-question-source.ts` | Ada log/penolakan eksplisit | 1 j | F4-07 |
| F4-09 | Health check kuota dengan pesan spesifik | `PrismaQuestionPool.validate()` | Pesan menyebut subtes & kekurangan | 1 j | F4-07 |

> **Deviasi komposisi TPA (F4-03).** Target awal "100 soal TPA" terpenuhi dengan
> 87 `SINGLE_CHOICE` + 3 `MULTI_CHOICE` (TPA) + 15 figural (Fase 3) = **105
> PUBLISHED**. Tidak ada soal fiktif yang dipangkas: 15 figural sudah ada lebih
> dulu, dan 90 soal teks adalah komposisi yang disepakati (verbal 40, numerik 35,
> penalaran 12 + 3 multi-choice).

> **Deviasi `MULTI_CHOICE` (F4-05).** Baris `MULTI_CHOICE` menyimpan
> `scoringStrategy: 'MULTI_CORRECT_PARTIAL'` + `scoringConfig.wrongPenalty = 0.5`
> sebagai **metadata admin saja**. Scoring sesi nyata memakai strategi tingkat
> subtes (`KEYED_CORRECT`), yang menuntut kecocokan himpunan jawaban secara
> persis — tidak ada partial credit. Perilaku ini dikunci oleh test
> `ScoringService`.

> **Perbaikan kualitas soal numerik (ditemukan saat audit F4-03).** Pengecoh
> dulu selalu `answer ± {1,2,3,5,10}`, sehingga soal harga `Rp68.000` berpengecoh
> `68.001`, `67.998`, dst. — mustahil dipilih dan menandai kuncinya. Kini
> `numericOptions()` memakai kelipatan 1.000 untuk jawaban ≥ 1.000 yang bulat:
> kunci `68000` → `69000 / 67000 / 70000 / 66000`.

---

## Langkah detail

### F4-01 — Jalankan seed

```powershell
pnpm db:seed
```

Seed saat ini menandai soal `status = 'PUBLISHED'` (lihat
`questionFields()` di `seed/questions/index.ts`), jadi setelah seed selesai
seluruh soal bank akan berstatus PUBLISHED.

**Verifikasi:**

```sql
SELECT subtest_code, status, count(*)
FROM questions
GROUP BY subtest_code, status
ORDER BY subtest_code, status;
```

---

### F4-02 — Cek kuota

Target kuota (dari `exam_settings` / konfigurasi subtes):

| Subtes | Soal per sesi | Minimum `PUBLISHED` |
| --- | --- | --- |
| KECERDASAN | 100 | 100 |
| KEPRIBADIAN | 140 | 140 |
| KECERMATAN | 500 | 500 |
| PASS_HAND | 150 | 150 |
| TPA | 100 | 100 |
| TPK | 100 | 100 |

Bila salah satu kurang, **jangan** aktifkan `QUESTION_POOL=db` dulu.

Query cek cepat:

```sql
SELECT s.code, s.question_count, count(q.id) AS published
FROM subtests s
LEFT JOIN questions q
  ON q.subtest_code = s.code AND q.status = 'PUBLISHED' AND q.deleted_at IS NULL
GROUP BY s.code, s.question_count
HAVING count(q.id) < s.question_count;
```

Harus mengembalikan **0 baris**.

---

### F4-03 — Bank TPA

Struktur file mengikuti pola yang sudah ada
(`seed/questions/kecerdasan.ts`, `kecermatan.ts`, dst.):

```ts
// apps/api/prisma/seed/questions/tpa.ts
import type { SeedQuestion } from './types';

export function buildTpaQuestions(): SeedQuestion[] {
  return [
    // Verbal — sinonim, antonim, analogi, pemahaman bacaan
    // Numerik — deret, aritmetika, perbandingan, persentase
    // Penalaran — silogisme, analitis, figural (lihat F3-24)
  ];
}
```

Komposisi yang disarankan:

| Kelompok | Jenis soal | Jumlah |
| --- | --- | --- |
| Verbal | `SINGLE_CHOICE` | 40 |
| Numerik | `SINGLE_CHOICE` | 35 |
| Penalaran | `SINGLE_CHOICE` + `MULTI_CHOICE` | 25 |

Aturan validasi yang harus dipenuhi (sama seperti subtes lain):

- `publicCode` unik.
- Tepat satu opsi `isCorrect` untuk `SINGLE_CHOICE`.
- ≥ 1 opsi benar untuk `MULTI_CHOICE`.
- `dedupeHash` unik.
- `stemText` tidak kosong.

---

### F4-04 — Daftarkan TPA di seed

Tiga tempat yang harus diperbarui:

| Tempat | Perubahan |
| --- | --- |
| `SeedSubtestCode` | tambah `'TPA'` |
| `QUESTION_CATEGORIES` | tambah `tpa/verbal`, `tpa/numerik`, `tpa/penalaran` |
| `buildSeedQuestions()` | gabungkan `buildTpaQuestions()` |

Pastikan `subtests` di konfigurasi ujian juga punya `TPA` dengan
`orderIndex` yang benar di stage-nya. Konfigurasi DB saat ini sudah punya TPA
(`exam_settings`), jadi yang perlu disesuaikan hanya seed soal.

**Verifikasi:**

```powershell
pnpm --filter @webcat/api test question-seed
```

---

### F4-05 — Tambah `MULTI_CHOICE`

`MULTI_CHOICE` sudah didukung engine (lihat `answerPayloadSchema` — menerima
`optionIds` array), tetapi **tidak ada satu pun di bank soal**. Tambahkan:

- 3 soal TPA penalaran (pilih semua yang benar).
- 3 soal Kecerdasan (klasifikasi gambar/teks).

**Penting:** `MULTI_CHOICE` **tidak** memakai `isCorrect` tunggal untuk scoring
biner — periksa `scoringStrategy` yang sesuai (mis. `PARTIAL_CREDIT`). Jangan
menyalin `SINGLE_CHOICE` apa adanya.

---

### F4-06 — Test pasangan Kepribadian

Kepribadian memakai `pairGroup` + `columnIndex` untuk pasangan `A/B` dan
deteksi konsistensi. Test harus memastikan:

```ts
it('setiap pairGroup Kepribadian punya anggota genap', () => {
  const byPair = groupBy(kepribadian, (q) => q.pairGroup);
  for (const [pair, items] of Object.entries(byPair)) {
    expect(items.length % 2, `pair ${pair}`).toBe(0);
  }
});

it('setiap pairGroup punya minimal satu item terbalik', () => {
  // item terbalik = scoringConfig.reverse === true atau dimensionMap negatif
});
```

---

### F4-07 — Aktifkan `QUESTION_POOL=db`

**Hanya** setelah F4-02 hijau.

```env
QUESTION_POOL=db
```

Verifikasi:

1. Mulai sesi baru.
2. Buka subtes KECERDASAN.
3. Cek `exam_session_questions.snapshot` → `sourceId` harus berupa `publicCode`
   soal (mis. `PSI-KEC-...`), **bukan** `DEV-KECERDASAN-0001`.

```sql
SELECT snapshot->>'sourceId' AS source_id
FROM exam_session_questions
WHERE subtest_session_id = '<id>'
LIMIT 10;
```

Bila masih `DEV-*`, artinya masih memakai fixture.

**Bukti runtime (5 Nov 2026).** API dijalankan dari `dist` (bukan `--watch`, agar
recompile tidak memutus sesi), lalu `pnpm --filter @webcat/api smoke:cat`:

```
smoke:cat → http://localhost:3000/api/v1
  health                     status ok, database up
  start sesi                 0c986a62-… — 6 subtes, status IN_PROGRESS
  KECERDASAN open            100 soal
  KECERDASAN finish          status COMPLETED, nilai 100%, lulus true
  …
```

Sesi dibuat nyata lewat HTTP; query bukti (dijalankan saat sesi masih berjalan,
setelah 3 subtes selesai — 740 baris snapshot):

```sql
SELECT count(*) FILTER (WHERE snapshot->>'sourceId' LIKE 'DEV-%') AS fixture_rows,
       count(*) AS total
FROM exam_session_questions;
--  fixture_rows | total
--              0 |   740

SELECT split_part(snapshot->>'sourceId','-',1) AS prefix, count(*) ...
--  PSI | 740   (tidak ada satu pun DEV-*)
```

---

### F4-08 — Hilangkan fallback senyap

Saat ini `prepare()` jatuh ke `buildFixture()` tanpa suara bila soal DB kurang
dari `count`:

```ts
if (dbQuestions.length >= input.count) {
  /* pakai DB */
}
return buildFixture(...);   // ← senyap
```

Ubah menjadi eksplisit:

```ts
if (dbQuestions.length < input.count) {
  const missing = input.count - dbQuestions.length;
  const detail = `${input.subtestCode}: butuh ${input.count}, tersedia ${dbQuestions.length}`;

  if (this.config.questionPool === 'db') {
    throw new AppError({
      code: 'EXAM_QUESTION_POOL_INSUFFICIENT',
      status: 503,
      message: 'Bank soal belum memenuhi kuota subtes ini',
      details: { subtestCode: input.subtestCode, missing },
    });
  }

  this.logger.warn(`Fallback fixture dipakai — ${detail}`);
}
```

**Aturan:** fallback hanya boleh terjadi bila `QUESTION_POOL=dev` (lingkungan
pengembangan), dan **selalu** tercatat di log.

**Dampak ke test integrasi.** Setelah `.env` menjadi `db`, test integrasi
(`test/integration/*`) sempat gagal dengan `EXAM_POOL_INSUFFICIENT` — bukan
regresi produk, melainkan konsekuensi benar dari mode ketat: DB uji
(`webcat_test`) di-`TRUNCATE` dan memang tidak memuat bank soal. Factory test
kini menyatakan mode secara eksplisit:

```ts
const fixtureConfig = { value: { QUESTION_POOL: 'dev' } } as unknown as AppConfigService;
const questionSource = new ExamQuestionSource(prisma, fixtureConfig);
```

Jadi jalur bank-soal nyata diverifikasi oleh `pnpm smoke:cat` + `pnpm
pool:coverage` terhadap DB dev, sedangkan test integrasi fokus pada perilaku
mesin sesi. Tidak ada lagi pewarisan `.env` yang membuat hasil test bergantung
pada isi file env pengembang.

---

### F4-09 — Health check kuota

`PrismaQuestionPool.validate()` mengembalikan daftar kekurangan yang bisa dibaca
manusia:

```ts
{
  ready: false,
  available: 412,
  required: 500,
  missingSubtestCodes: ['KECERMATAN'],
  problems: [
    {
      subtestCode: 'KECERMATAN',
      required: 500,
      available: 412,
      missing: 88,
      message: 'Subtes Kecermatan: tersedia 412 soal, dibutuhkan 500 (kurang 88 soal).',
    },
  ],
}
```

Pemakaian:

- `GET /exams/eligibility` → `poolProblems[]` (rincian) di samping `reasons`.
  Halaman `/exam` menampilkannya sebagai sub-daftar di bawah alasan
  `EXAM_POOL_INSUFFICIENT`.
- `startSession()` → bila bank soal satu-satunya penghalang, error dikirim
  sebagai `EXAM_POOL_INSUFFICIENT` (409) dengan `message` dari pool dan
  `details.problems`; bukan lagi `EXAM_SESSION_LOCKED` generik.
- `ExamQuestionSource.prepare()` (`QUESTION_POOL=db`) → 503
  `EXAM_POOL_INSUFFICIENT` dengan `details { subtestCode, required, available, missing }`.

> Catatan penting: **jangan** memvalidasi kuota seluruh subtes saat start sesi
> bila itu memperlambat (6 count query). Cukup validasi subtes yang akan dibuka,
> atau cache hasilnya selama 5 menit.

**Status:** kuota divalidasi untuk subtes yang akan dibuka (loop `stages`), sesuai
catatan di atas. Tidak ada cache — 6 `COUNT` terindeks
(`questions(subtest_code, status, difficulty)`) selesai dalam hitungan milidetik
pada bank 1.159 soal, jadi cache hanya akan menambah risiko data basi.

---

## Verifikasi fase

```powershell
pnpm db:seed
pnpm --filter @webcat/api test
```

```sql
-- kuota
SELECT subtest_code, count(*) FILTER (WHERE status = 'PUBLISHED') AS published
FROM questions
GROUP BY subtest_code
ORDER BY subtest_code;

-- tidak ada ID fixture di sesi nyata
SELECT count(*) FROM exam_session_questions
WHERE snapshot->>'sourceId' LIKE 'DEV-%';
```

| Cek | Target | Hasil |
| --- | --- | --- |
| Semua 6 subtes `PUBLISHED` ≥ kuota | ya | ✅ 147/100, 143/140, 500/500, 150/150, 105/100, 100/100 |
| `OPEN` subtes dengan `QUESTION_POOL=db` | tidak ada `DEV-*` | ✅ 0 dari 740 snapshot |
| Seed dijalankan 2× | jumlah soal tidak bertambah | ✅ "baru 0, diperbarui 1052" |
| `pnpm test` | hijau | ✅ 34 berkas / 319 test |
| `pnpm test:integration` | hijau | ✅ 14 test |
| `pnpm pool:coverage` | semua subtes dari bank soal | ✅ 6/6 "bank soal" |
| `pnpm smoke:cat` | 6/6 subtes selesai | ✅ lihat F4-07 |
| `pnpm smoke:media` | semua URL media 200 | ✅ 115/115 |

---

## Risiko fase ini

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Seed dijalankan ke DB produksi | data uji masuk produksi | cek `DATABASE_URL` + `pnpm db:guard` |
| Seed tidak idempoten | soal ganda, `publicCode` bentrok | `dedupeHash` + `upsert`/`skipDuplicates` |
| `QUESTION_POOL=db` diaktifkan sebelum kuota penuh | peserta tidak bisa ujian | F4-08 membuat kegagalan eksplisit |
| Soal TPA bertabrakan dengan TPK | duplikasi konten | `dedupeHash` unik lintas subtes |
| `MULTI_CHOICE` tanpa strategi scoring | skor salah | tetapkan `scoringStrategy` per soal |

---

## Commit yang disarankan

1. `feat(seed): bank soal TPA 100 soal (F4-03, F4-04)`
2. `feat(seed): soal MULTI_CHOICE (F4-05)`
3. `test(seed): pasangan Kepribadian & kunci jawaban (F4-06)`
4. `feat(exam): fallback fixture eksplisit + health check pool (F4-08, F4-09)`
5. `chore(env): aktifkan QUESTION_POOL=db (F4-07)`
