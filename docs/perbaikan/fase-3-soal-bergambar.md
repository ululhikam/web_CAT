# FASE 3 — Soal Bergambar & Jawaban Bergambar (P1)

**Prioritas:** P1 (wajib untuk psikotes yang realistis)
**Estimasi:** 3,5 hari
**Prasyarat:** Fase 1 selesai (alur CAT sudah bisa dijalankan)

---

## Tujuan

Psikotes memiliki soal figural dengan **gambar pada stem** dan **opsi jawaban
bergambar**, tampil di runner ujian, tersimpan sebagai jawaban, dan dinilai benar.

Saat ini fitur ini hanya kerangka: enum `IMAGE_CHOICE`, tabel `question_media`,
upload WebP, dan komponen `ImageChoice.svelte` sudah ada, tetapi **rantainya
putus di 4 titik** sehingga tidak pernah bisa dipakai.

## Kondisi saat ini (bukti audit)

| Titik | Kondisi | Bukti |
| --- | --- | --- |
| Snapshot | `SnapshotOption` **tanpa** `media` | `apps/api/src/modules/scoring/scoring.types.ts` |
| Materialisasi | `optionId` dibuang | `exam-question-source.ts:378` — `media: row.media.map(m => ({role, path, alt}))` |
| Proyeksi | `media: []` hardcode | `exam-question-projection.ts:32` |
| Runner | hanya render `role === 'STEM'`; opsi teks saja | `exam/[sessionId]/+page.svelte:~520, ~585` |
| Renderer | `ImageChoice` hanya dipakai pratinjau admin | `QuestionForm.svelte:397` |
| Data | 0 media, 0 soal bergambar PUBLISHED | audit DB 5 Nov 2026 |
| URL | byte di DB tapi proyeksi pakai signed URL path → 404 | `media.service.ts:149-190` |

**Akibat:** soal `IMAGE_CHOICE` yang dibuat admin tampil sebagai tombol teks
tanpa gambar, meski gambarnya sudah diunggah.

## Definition of Done fase

- [x] ≥ 30 soal `IMAGE_CHOICE` PUBLISHED dengan media stem **dan** media tiap opsi.
      → 59 soal (44 Kecerdasan `PSI-KEC-FIG-*` + 15 TPA `PSI-TPA-FIG-*`), semua
      opsi bergambar; diverifikasi `pnpm smoke:media`.
- [x] Runner menampilkan gambar stem + tile gambar opsi.
- [x] Klik tile menyimpan `optionIds`; scoring menilai benar/salah.
- [x] Pratinjau admin dan runner menampilkan soal secara identik.
      → satu adapter (`lib/exams/render-adapter.ts`) + satu komponen
      `ImageChoiceTiles.svelte` dipakai kedua layar (F3-15).
- [x] Media hanya diakses lewat URL bertanda tangan.
- [x] Media `EXPLANATION` tidak muncul di DTO peserta.
- [x] Snapshot lama (tanpa media opsi) tetap bisa diparse.

---

## Daftar tugas

### 3A — Snapshot & materialisasi (backend)

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F3-01 | Tambah `optionId` + `assetId` pada `SnapshotMedia` | `scoring/scoring.types.ts` | Typecheck lulus | 20 m | F1-08 |
| F3-02 | Tambah `media: SnapshotMedia[]` pada `SnapshotOption` | idem | Typecheck lulus | 20 m | F3-01 |
| F3-03 | Parser membaca media per opsi, toleran snapshot lama | `exam-snapshot.ts:120-185` | Snapshot lama & baru ter-parse | 45 m | F3-02 |
| F3-04 | `QuestionRow.media` memuat `optionId` + `mediaAsset.id` | `exam-question-source.ts:305-345` | Field tersedia saat mapping | 30 m | F3-01 |
| F3-05 | `mapDbQuestion` mengelompokkan media `OPTION` ke opsi | `exam-question-source.ts:378` | Media opsi tidak hilang | 1 j | F3-03, F3-04 |
| F3-06 | Builder fixture menerima media opsional | `exam-question-source.ts:110-260` | Fixture bisa hasilkan soal bergambar | 45 m | F3-05 |
| F3-07 | Unit test materialisasi media opsi | `apps/api/test/exam-question-source.spec.ts` (baru) | Lulus | 45 m | F3-05 |

### 3B — Proyeksi (backend)

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F3-08 | `optionView(option, resolve)` mengirim media opsi | `exam-question-projection.ts:32` | Media opsi ada di DTO | 30 m | F3-05 |
| F3-09 | `mediaViews` hanya `role === 'STEM'` untuk DTO ujian | idem:41 | `EXPLANATION` tidak bocor | 15 m | F3-08 |
| F3-10 | `projectMany` cache URL media opsi | idem:103 | Tidak ada URL ganda | 30 m | F3-08 |
| F3-11 | Unit test proyeksi media | `apps/api/test/exam-question-projection.spec.ts` | Lulus | 45 m | F3-09 |

### 3C — Runner (frontend)

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F3-12 | Render media opsi pada SINGLE/MULTI/MISSING | `apps/web/src/routes/(app)/exam/[sessionId]/+page.svelte` | Gambar tampil di tiga tipe | 1 j | F3-08 |
| F3-13 | Cabang `IMAGE_CHOICE` → grid tile | idem | Tidak lagi tampil sebagai teks | 1 j | F3-12 |
| F3-14 | CSS media & tile responsif | idem `<style>` | Tidak rusak di 360 px | 45 m | F3-13 |
| F3-15 | (Opsional) Satukan renderer via adapter | `apps/web/src/lib/exams/render-adapter.ts` (baru) | Pratinjau = runner | 3 j | F3-13 |

> **F3-15 dikerjakan.** Adapter data (`render-adapter.ts`) menyatukan cara baca
> DTO peserta vs form admin, dan `ImageChoiceTiles.svelte` menyatukan markup
> tile. Bukti kesetaraan: `render-adapter.spec.ts` (7 test, termasuk
> `examQuestionTileView === renderQuestionTileView` untuk data setara) dan
> `image-choice-tiles.spec.ts` (5 test, termasuk HTML runner ≡ HTML pratinjau).
| F3-16 | Test komponen `ImageChoice` | `apps/web/src/lib/components/questions/*.spec.ts` | Lulus | 1 j | F3-13 |

### 3D — URL & penyajian berkas

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F3-17 | Proyeksi pakai `buildMediaUrl(assetId)` → `/media/:id/content` | `exam-question-projection.ts`, `media-signature.ts` | Gambar upload admin tampil (bukan 404) | 1 j | F3-08 |
| F3-18 | `DevStorage` menghasilkan URL yang dilayani | `core/ports/impl/dev-storage.ts` | `STORAGE=dev` → gambar 200 | 1 j | F3-17 |
| F3-19 | TTL URL ≥ durasi subtes (120 menit) | `exam-question-projection.ts` | Tidak ada gambar mati di tengah subtes | 30 m | F3-17 |
| F3-20 | Test akses media 200 + content-type | `apps/api/test/media-access.spec.ts` (baru) | Lulus | 45 m | F3-17 |

### 3E — Konten bergambar

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F3-21 | Aset gambar figural WebP (≥200×200, ≤5 MB) | `apps/api/prisma/seed/media/` | ≥ 20 berkas valid | 2 j | — |
| F3-22 | `seedMediaAssets` pakai `storeBuffer` (dedupe) | `apps/api/prisma/seed/media.seed.ts` (baru) | Idempoten dijalankan 2× | 1 j | F3-21 |
| F3-23 | 30–40 `IMAGE_CHOICE` + 10 stem gambar (Kecerdasan) | `apps/api/prisma/seed/questions/kecerdasan.ts` | Media STEM & OPTION lengkap | 3 j | F3-22 |
| F3-24 | 15 soal figural TPA | `apps/api/prisma/seed/questions/tpa.ts` | Terdaftar & tervalidasi | 1 j | F3-22 |
| F3-25 | Seed menulis `question_media` | `apps/api/prisma/seed/questions/index.ts` | Baris `question_media` tercipta | 1 j | F3-23 |
| F3-26 | Test kelengkapan media soal | `apps/api/test/question-seed.spec.ts` | IMAGE_CHOICE wajib punya media | 45 m | F3-25 |

### 3F — Validasi kontrak & UI admin

| ID | Pekerjaan | File utama | Kriteria selesai | Est | Dep |
| --- | --- | --- | --- | --- | --- |
| F3-27 | Validasi `IMAGE_CHOICE` wajib media STEM + OPTION tiap opsi | `packages/contracts/src/questions/index.ts:105-155` | Form menolak soal tanpa gambar | 1 j | F3-26 |
| F3-28 | Validasi dimensi minimum 200×200 saat upload | `apps/api/src/modules/media/media.service.ts` | Gambar kecil ditolak dengan pesan jelas | 30 m | — |
| F3-29 | Indikator "opsi belum bergambar" di form admin | `apps/web/src/lib/components/questions/QuestionForm.svelte` | Admin tahu opsi yang kurang | 1 j | F3-27 |
| F3-30 | Test kontrak + upload | `apps/api/test`, `packages/contracts` | Lulus | 45 m | F3-27 |
| F3-31 | Uji visual runner dengan soal figural | — | Bukti tangkapan layar/deskripsi | 30 m | F3-23 |

---

## Langkah detail

### F3-01 / F3-02 — Bentuk tipe

`apps/api/src/modules/scoring/scoring.types.ts`:

```ts
export interface SnapshotMedia {
  role: 'STEM' | 'OPTION' | 'EXPLANATION';
  /** media_assets.id — dasar URL /media/:id/content */
  assetId?: string;
  /** Diisi bila role === 'OPTION' */
  optionId?: string | null;
  /** Path storage; fallback bila assetId tidak ada (snapshot lama) */
  path: string;
  alt: string | null;
}

export interface SnapshotOption {
  id: string;
  label: string;
  text: string | null;
  isCorrect: boolean;
  scoreValue: number;
  dimensionMap: Record<string, number> | null;
  /** Media yang menempel pada opsi ini */
  media: SnapshotMedia[];
}
```

**Catatan:** semua field baru **opsional** agar snapshot lama tetap valid.

---

### F3-03 — Parser toleran

`apps/api/src/modules/exams/exam-snapshot.ts`:

```ts
function parseOptionMedia(value: unknown): SnapshotMedia[] {
  return asArray(value)
    .map(parseMedia)
    .filter((entry): entry is SnapshotMedia => entry !== null);
}

function parseOption(value: unknown): SnapshotOption | null {
  // ...field lama...
  return {
    // ...
    media: parseOptionMedia(raw.media),   // default [] untuk snapshot lama
  };
}
```

Perbarui juga `parseMedia` agar membaca `assetId` dan `optionId`:

```ts
function parseMedia(value: unknown): SnapshotMedia | null {
  const raw = asRecord(value);
  const path = asString(raw.path);
  if (!path) return null;
  const role = raw.role === 'OPTION' || raw.role === 'EXPLANATION' ? raw.role : 'STEM';
  return {
    role,
    assetId: asString(raw.assetId) || undefined,
    optionId: asNullableString(raw.optionId),
    path,
    alt: asNullableString(raw.alt),
  };
}
```

**Verifikasi (wajib):** tambahkan test bahwa snapshot lama (tanpa `options[].media`)
tetap menghasilkan `options[i].media = []` dan tidak throw.

---

### F3-04 — `QuestionRow` & query

`apps/api/src/modules/exams/exam-question-source.ts`:

```ts
media: Array<{
  role: 'STEM' | 'OPTION' | 'EXPLANATION';
  optionId: string | null;
  altText: string | null;
  mediaAsset: { id: string; storagePath: string };
}>;
```

Query `loadFromDatabase` sudah memakai `include`, jadi `optionId` dan
`mediaAsset.id` otomatis tersedia — cukup perbarui tipe.

---

### F3-05 — Pengelompokan media

```ts
const optionMedia = new Map<string, SnapshotMedia[]>();
const questionMedia: SnapshotMedia[] = [];

for (const media of row.media) {
  const entry: SnapshotMedia = {
    role: media.role,
    assetId: media.mediaAsset.id,
    optionId: media.optionId,
    path: media.mediaAsset.storagePath,
    alt: media.altText,
  };

  if (media.role === 'OPTION' && media.optionId) {
    const list = optionMedia.get(media.optionId) ?? [];
    list.push(entry);
    optionMedia.set(media.optionId, list);
  } else {
    questionMedia.push(entry);
  }
}

// saat membangun snapshot.options
options: row.options.map((option) => ({
  // ...field lama...
  media: optionMedia.get(option.id) ?? [],
})),
media: questionMedia,
```

**Aturan:** media `OPTION` tanpa `optionId` **jangan dibuang** — masukkan ke
`questionMedia` agar terlihat saat debugging.

---

### F3-08 — Proyeksi media opsi

`apps/api/src/modules/exams/exam-question-projection.ts`:

```ts
function mediaView(entry: SnapshotMedia, resolve: MediaUrlResolver): ExamMediaRef {
  return {
    role: entry.role,
    url: entry.assetId ? buildMediaUrl(entry.assetId, secret) : resolve(entry.path),
    alt: entry.alt,
  };
}

function optionView(
  option: SnapshotOption,
  resolve: MediaUrlResolver,
  secret: string,
): ExamQuestionOption {
  return {
    id: option.id,
    label: option.label,
    text: option.text,
    media: option.media.map((entry) => mediaView(entry, resolve, secret)),
  };
}

function mediaViews(
  snapshot: QuestionSnapshot,
  resolve: MediaUrlResolver,
  secret: string,
): ExamMediaRef[] {
  // Peserta hanya perlu media stem.
  return snapshot.media
    .filter((entry) => entry.role === 'STEM')
    .map((entry) => mediaView(entry, resolve, secret));
}
```

Karena `projectQuestion` adalah fungsi murni, teruskan `secret` sebagai parameter
ketiga dengan default `''` (unit test cukup memakai `resolve`).

---

### F3-12 / F3-13 — Runner

Lokasi: `apps/web/src/routes/(app)/exam/[sessionId]/+page.svelte`.

**a) Media opsi untuk pilihan teks** (setelah `<span class="option__text">`):

```svelte
{#if option.media.length > 0}
  <span class="option__media">
    {#each option.media as media (media.url)}
      <img src={media.url} alt={media.alt ?? `Opsi ${option.label}`} loading="lazy" />
    {/each}
  </span>
{/if}
```

**b) Cabang `IMAGE_CHOICE`** (letakkan sebelum cabang `{:else}` terakhir):

```svelte
{:else if question.type === 'IMAGE_CHOICE'}
  <div class="tiles" role="radiogroup" aria-label="Pilih satu gambar">
    {#each question.options as option (option.id)}
      <button
        type="button"
        class="tile"
        class:tile--active={isChosen(question, option.id)}
        aria-pressed={isChosen(question, option.id)}
        onclick={() => chooseOption(question, option)}
      >
        <span class="tile__label">{option.label}</span>
        {#if option.media[0]}
          <img
            class="tile__image"
            src={option.media[0].url}
            alt={option.media[0].alt ?? `Opsi ${option.label}`}
            loading="lazy"
          />
        {:else}
          <span class="tile__empty">Gambar belum tersedia</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}
```

**c) Keyboard:** pastikan handler `keydown` yang sudah ada
(`SINGLE_CHOICE | IMAGE_CHOICE | MULTI_CHOICE | MISSING_ELEMENT`) tetap bekerja —
tidak ada perubahan (memilih berdasarkan `option.label`).

---

### F3-14 — CSS

```css
.option__media {
  display: inline-flex;
  gap: var(--space-2);
}

.option__media img {
  max-height: 72px;
  object-fit: contain;
  border-radius: var(--radius-sm);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  position: relative;
}

.tile--active {
  border-color: var(--color-primary);
  box-shadow: inset 0 0 0 1px var(--color-primary);
}

.tile__label {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  font-weight: 700;
  font-size: var(--text-xs);
}

.tile__image {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.tile__empty {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 120px;
  background: var(--color-surface-muted);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
```

---

### F3-17 — URL media

**Masalah:** `MediaService.storeBuffer()` menyimpan byte ke kolom
`media_assets.data` **tanpa** mengunggah ke bucket. Proyeksi lama memanggil
`storage.createSignedUrl(path)` → Supabase mencari objek yang tidak ada → 404.

**Pilihan**

| Opsi | Perubahan | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| **(a) unggah ke bucket** | tambah `put` pada `StoragePort`, panggil di `storeBuffer` | jalur produksi standar | butuh perubahan port + impl |
| **(b) `/media/:id/content`** | proyeksi memakai `buildMediaUrl(assetId, secret)` | endpoint sudah ada, tidak butuh bucket | byte tetap di DB |

**Rekomendasi (b)** untuk sekarang; (a) dicatat sebagai pekerjaan lanjutan
(lihat F5-15 media variant).

```ts
const ttl = 7_200; // 120 menit — minimal sepanjang subtes terpanjang
const url = entry.assetId
  ? buildMediaUrl(entry.assetId, secret, ttl)
  : await resolve(entry.path);
```

> Catatan: `buildMediaUrl` mengembalikan path relatif `/api/v1/media/:id/content`.
> Bila web dan API berbeda origin, ubah menjadi absolut di klien atau
> tambahkan `PUBLIC_API_BASE`.

---

### F3-18 — `DevStorage`

`apps/api/src/core/ports/impl/dev-storage.ts` saat ini menghasilkan
`http://localhost:3000/dev-storage/...` **tanpa route** → 404.

Dua cara:

1. **Route dev** — tambah controller `@Controller('dev-storage')` dengan
   `@Get('*path')` yang menyajikan file dari `apps/api/.dev-storage/`.
   Hanya didaftarkan bila `STORAGE=dev`.
2. **Alihkan** — `DevStorage.createSignedUrl()` mengembalikan
   `/api/v1/media/:id/content` (perlu `assetId`, bukan `path`) → lebih rapi,
   tetapi mengubah signature port.

Pilih (2) bila memungkinkan: `createSignedUrl(path)` dapat mencari
`mediaAsset.storagePath = path` lalu memakai `buildMediaUrl`.

---

### F3-21 — Aset gambar

Kebutuhan minimal:

| Kelompok | Contoh |
| --- | --- |
| Pola berlanjut | deret bentuk berulang, 4–5 pilihan |
| Rotasi | bentuk yang diputar 90°/180° |
| Pencerminan | bentuk + bayangan cermin |
| Kubus | jaring-jaring, tampak atas/depan |
| Peta | rute, arah mata angin, jarak |

Ketentuan:

- Format WebP (konversi otomatis di `storeBuffer`, tetapi simpan sumber WebP/PNG).
- ≥ 200×200 px.
- ≤ 5 MB (batas `MEDIA_MAX_BYTES`).
- Nama file deskriptif: `fig-pola-01.webp`, `fig-rotasi-03.webp`.
- Alt text wajib (dipakai sebagai `alt` di render).

> Aset bisa dibuat manual dengan editor gambar, atau digenerate (SVG → WebP).
> Jangan memakai aset berhak cipta dari bank soal komersial.

**Implementasi aktual — generator, bukan berkas biner (deviasi yang disengaja).**

Aset figural **tidak** disimpan sebagai berkas `.webp` di repo. Berkas
`.svg`/`.webp` biner sulit di-review di diff, mudah rusak oleh alat teks, dan
membuat kunci jawaban tidak bisa diturunkan dari geometri. Yang disimpan adalah
*spesifikasi* gambar:

| Berkas | Isi |
| --- | --- |
| `apps/api/prisma/seed/media/figural.ts` | 7 keluarga soal (series, rotation, mirror, analogy, net, count, direction) + `renderFigure(spec, variant)` yang menghasilkan SVG deterministik |
| `apps/api/prisma/seed/questions/figural.ts` | 59 baris soal (44 Kecerdasan `IMAGE_CHOICE` + 15 TPA) beserta `figureAssets()`, `figureAssetCode()`, `layoutFor()` |

Alur seed: `renderFigure()` → SVG → `sharp().webp({quality: 82})` di dalam
`MediaService.storeBuffer()` → byte tersimpan di `media_assets.data` +
`storage_path`. Jadi yang tersimpan di database tetap WebP ≥256×256 px,
≤5 MB, dengan alt text — persis ketentuan di atas.

Konsekuensi yang perlu diketahui:

- Kunci jawaban **diturunkan dari geometri** (`correctOptionVariant()`), bukan
  ditulis tangan, sehingga tidak mungkin ada soal yang kuncinya tidak cocok
  dengan gambar.
- Posisi kunci diacak per soal oleh `layoutFor()`; kunci tidak selalu "A".
- 235 kode aset → 104 baris `media_assets` karena gambar identik berbagi
  checksum (dedupe `storeBuffer`). Ini perilaku yang diharapkan.
- Menambah soal figural = menambah entri di `figural.ts`, bukan mengunggah
  berkas. Bila nanti ingin aset dari desainer, jalur `POST admin/media/upload`
  tetap tersedia dan tidak bentrok dengan generator.

---

### F3-22 — `seedMediaAssets`

`apps/api/prisma/seed/media.seed.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import type { MediaService } from '../../src/modules/media/media.service';

export interface SeedMediaRef {
  code: string;
  file: string;
  alt: string;
}

export async function seedMediaAssets(
  prisma: PrismaClient,
  media: MediaService,
  refs: SeedMediaRef[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const ref of refs) {
    const buffer = await readFile(join(__dirname, 'media', ref.file));
    const asset = await media.storeBuffer(buffer, 'image/webp', null);
    map.set(ref.code, asset.id);
    map.set(ref.file, asset.id);
  }
  return map;
}
```

Idempotensi: `storeBuffer` sudah dedupe berdasarkan `checksum`, jadi menjalankan
seed dua kali tidak menggandakan aset.

**Verifikasi:**

```sql
SELECT count(*) FROM media_assets;
SELECT checksum, count(*) FROM media_assets GROUP BY checksum HAVING count(*) > 1;
```

Baris kedua harus 0.

---

### F3-23 — Soal figural Kecerdasan

Komposisi yang disarankan (total ±40):

| Topik | Tipe | Jumlah | Media |
| --- | --- | --- | --- |
| Pola berlanjut | `IMAGE_CHOICE` | 10 | STEM + 4 opsi |
| Rotasi/pencerminan | `IMAGE_CHOICE` | 8 | STEM + 4 opsi |
| Kubus/jaring-jaring | `IMAGE_CHOICE` | 6 | STEM + 4 opsi |
| Analogi figural | `IMAGE_CHOICE` | 6 | STEM + 4 opsi |
| Peta/denah | `SINGLE_CHOICE` | 6 | STEM saja |
| Campuran | `SINGLE_CHOICE` | 4 | STEM saja |

Bentuk deklarasi di seed (perluas `WrittenQuestion` dengan `media`):

```ts
{
  code: 'PSI-KEC-FIG-001',
  topic: 'logis',
  type: 'IMAGE_CHOICE',
  stem: 'Pilih gambar yang melanjutkan pola berikut.',
  media: [
    { role: 'STEM', assetCode: 'FIG-POLA-01-ST' },
    { role: 'OPTION', optionLabel: 'A', assetCode: 'FIG-POLA-01-A' },
    { role: 'OPTION', optionLabel: 'B', assetCode: 'FIG-POLA-01-B' },
    { role: 'OPTION', optionLabel: 'C', assetCode: 'FIG-POLA-01-C' },
    { role: 'OPTION', optionLabel: 'D', assetCode: 'FIG-POLA-01-D' },
  ],
  options: [
    { label: 'A', contentText: null, isCorrect: false },
    { label: 'B', contentText: null, isCorrect: true },
    // ...
  ],
}
```

**Penting:** `contentText` boleh `null` untuk opsi bergambar; label tetap wajib.

---

### F3-25 — Seed menulis `question_media`

Di `apps/api/prisma/seed/questions/index.ts`, setelah opsi dibuat:

```ts
const mediaRows = question.media.map((entry) => ({
  questionId: row.id,
  optionId:
    entry.role === 'OPTION'
      ? (optionIdByLabel.get(entry.optionLabel!) ?? null)
      : null,
  mediaAssetId: mediaMap.get(entry.assetCode)!,
  role: entry.role,
  altText: entry.altText ?? null,
  sortOrder: entry.sortOrder ?? 0,
}));

if (mediaRows.length > 0) {
  await prisma.questionMedia.createMany({ data: mediaRows, skipDuplicates: true });
}
```

Karena `QuestionMedia` punya `@@unique([questionId, optionId, mediaAssetId, role])`,
`skipDuplicates` membuat seed idempoten.

---

### F3-27 — Validasi kontrak

`packages/contracts/src/questions/index.ts`, dalam `questionShapeIssues`:

```ts
if (input.type === 'IMAGE_CHOICE') {
  const stemMedia = input.media.filter((m) => m.role === 'STEM');
  if (stemMedia.length === 0) {
    issues.push('Soal pilihan gambar wajib memiliki gambar pada stem');
  }

  for (const option of input.options) {
    const hasOptionMedia = input.media.some(
      (m) => m.role === 'OPTION' && m.optionLabel === option.label,
    );
    if (!hasOptionMedia) {
      issues.push(`Opsi ${option.label} belum memiliki gambar`);
    }
  }
}
```

Pesan ini dipakai form admin (klien) dan validasi server (sumber kebenaran).

---

### F3-28 — Validasi dimensi

`apps/api/src/modules/media/media.service.ts`, di `storeBuffer` setelah
membaca metadata:

```ts
const MIN_DIMENSION = 200;
if ((metadata.width ?? 0) < MIN_DIMENSION || (metadata.height ?? 0) < MIN_DIMENSION) {
  throw new ConflictException({
    code: 'COMMON_VALIDATION_FAILED',
    message: `Gambar minimal ${MIN_DIMENSION}×${MIN_DIMENSION} piksel`,
  });
}
```

> Terapkan hanya pada upload admin agar seed lama tidak rusak.

---

## Verifikasi fase

```powershell
pnpm --filter @webcat/api test
pnpm --filter @webcat/web test
pnpm prisma:seed
pnpm --filter @webcat/api pool:coverage   # cakupan pool + soal figural ikut terpilih
pnpm smoke:cat                            # alur CAT 6 subtes tetap lulus
pnpm smoke:media                          # end-to-end: soal bergambar lewat API peserta
```

`smoke:media` menempuh jalur peserta sungguhan (login → mulai sesi → buka
KECERDASAN → ambil soal), lalu mengunduh **setiap** URL media dan memastikan
byte-nya gambar. Skrip ini juga menulis artefak bukti ke
`docs/perbaikan/fase-3-bukti/`:

- `f3-31-contoh-soal.png` — montase stem + empat tile opsi satu soal figural;
- `f3-31-semua-soal.html` — semua soal `IMAGE_CHOICE` pada sesi itu, gambar
  disematkan sebagai `data:` URI sehingga dokumen tetap utuh setelah TTL URL
  (2 jam) habis.

Keluaran yang diharapkan (5 Nov 2026, DB dev):

```
sumber soal                100/100 dari bank soal
soal figural               30 soal PSI-KEC-FIG-* terpilih
tipe IMAGE_CHOICE          23 soal
kelengkapan media          stem + media untuk setiap opsi terisi
unduh media                115 URL → 200, 146682 byte gambar
kontrol negatif            sig dirusak → HTTP 404
```

Cek DB:

```sql
-- jumlah soal bergambar
SELECT count(*) FROM questions WHERE type = 'IMAGE_CHOICE' AND status = 'PUBLISHED';

-- setiap soal bergambar punya media stem
SELECT q.public_code
FROM questions q
LEFT JOIN question_media m ON m.question_id = q.id AND m.role = 'STEM'
WHERE q.type = 'IMAGE_CHOICE' AND m.id IS NULL;   -- harus 0 baris

-- setiap opsi punya media
SELECT q.public_code, o.label
FROM questions q
JOIN question_options o ON o.question_id = q.id
LEFT JOIN question_media m
  ON m.question_id = q.id AND m.option_id = o.id AND m.role = 'OPTION'
WHERE q.type = 'IMAGE_CHOICE' AND m.id IS NULL;   -- harus 0 baris
```

Uji UI:

1. Login sebagai peserta, mulai sesi.
2. Buka KECERDASAN.
3. Cari soal yang menampilkan gambar.
4. Pastikan stem tampil dan opsi tampil sebagai tile gambar.
5. Klik satu tile → jawaban tersimpan (`network` → `PATCH answers`).
6. Selesaikan → skor bertambah bila jawaban benar.

---

## Risiko fase ini

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Snapshot lama tidak punya `options[].media` | 500 saat parse | field opsional + default `[]` (F3-03) |
| Soal `IMAGE_CHOICE` lama tanpa gambar | form menolak saat edit | tetap boleh tampil; tandai di UI admin |
| Signed URL kedaluwarsa saat subtes 120 menit | gambar hilang | TTL 120 menit atau refresh per batch |
| Byte media di DB membengkak | DB besar | batas 5 MB, WebP, rencanakan pindah bucket |
| Gambar besar memperlambat halaman | UX buruk | `loading="lazy"`, `object-fit: contain`, batas `max-height` |
| Renderer admin ≠ runner | peserta melihat hal berbeda | satu adapter (`lib/exams/render-adapter.ts`) + satu komponen `ImageChoiceTiles.svelte` untuk dua layar (F3-15) |

---

## Commit yang disarankan

1. `feat(exam): media per opsi pada snapshot (F3-01..F3-03)`
2. `feat(exam): materialisasi media opsi (F3-04, F3-05)`
3. `feat(exam): proyeksi media opsi ke peserta (F3-08..F3-11)`
4. `feat(web): runner merender gambar stem dan opsi (F3-12..F3-14)`
5. `fix(media): URL media jalur ujian memakai endpoint konten (F3-17)`
6. `feat(seed): aset + soal figural (F3-21..F3-25)`
7. `feat(contracts): validasi IMAGE_CHOICE wajib bergambar (F3-27)`
