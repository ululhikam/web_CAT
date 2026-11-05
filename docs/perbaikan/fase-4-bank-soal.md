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

- [ ] Semua subtes memenuhi kuota soal `PUBLISHED`.
- [ ] `TPA` ada di bank soal dan terdaftar di seed.
- [ ] Tidak ada fallback senyap ke `buildFixture()` pada jalur produksi.
- [ ] `QUESTION_POOL=db` dipakai di `.env` dan sesi berjalan dari DB.
- [ ] Seed idempoten (dijalankan 2× tidak menggandakan soal).

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
| F4-08 | Hilangkan/perjelas fallback senyap ke `buildFixture()` | `exam-question-source.ts:405-420` | Ada log/penolakan eksplisit | 1 j | F4-07 |
| F4-09 | Health check kuota dengan pesan spesifik | `PrismaQuestionPool.validate()` | Pesan menyebut subtes & kekurangan | 1 j | F4-07 |

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
3. Cek `exam_session_questions.snapshot` → `externalId` harus berupa
   `publicCode` soal (mis. `PSI-KEC-...`), **bukan** `DEV-KECERDASAN-0001`.

```sql
SELECT jsonb_extract_path_text(snapshot, 'externalId') AS external_id
FROM exam_session_questions
WHERE subtest_session_id = '<id>'
LIMIT 10;
```

Bila masih `DEV-*`, artinya masih memakai fixture.

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

---

### F4-09 — Health check kuota

`PrismaQuestionPool.validate()` sebaiknya mengembalikan daftar kekurangan yang
bisa dibaca manusia, mis.:

```ts
{
  ok: false,
  problems: [
    { subtestCode: 'KECERMATAN', required: 500, available: 412, missing: 88 },
  ],
}
```

Lalu `startSession` (atau endpoint `GET /exams/eligibility`) menampilkan alasan
yang jelas alih-alih gagal generik di tengah ujian.

> Catatan penting: **jangan** memvalidasi kuota seluruh subtes saat start sesi
> bila itu memperlambat (6 count query). Cukup validasi subtes yang akan dibuka,
> atau cache hasilnya selama 5 menit.

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
WHERE snapshot->>'externalId' LIKE 'DEV-%';
```

| Cek | Target |
| --- | --- |
| Semua 6 subtes `PUBLISHED` ≥ kuota | ya |
| `OPEN` subtes dengan `QUESTION_POOL=db` | tidak ada `DEV-*` |
| Seed dijalankan 2× | jumlah soal tidak bertambah |
| `pnpm test` | hijau |

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
