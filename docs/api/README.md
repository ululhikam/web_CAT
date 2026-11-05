# Dokumentasi API Web CAT

Dokumentasi ini **dibangun dari kode**, bukan ditulis manual. Sumber
kebenarannya adalah controller Nest + skema Zod di `packages/contracts`.

| Berkas | Isi |
| --- | --- |
| [`openapi.json`](./openapi.json) | Spesifikasi OpenAPI 3.0 lengkap (103 path, 120 operasi) |
| `apps/api/src/core/http/openapi.ts` | Pembangun dokumen: memindai rute, membaca skema Zod, menambah envelope/error |
| `apps/api/scripts/openapi.ts` | Generator artefak + mode `--check` untuk CI |

## Melihat dokumentasi

Saat API berjalan, buka:

- `GET /api/docs` — Swagger UI (bisa langsung "Try it out")
- `GET /api/docs-json` — spesifikasi JSON mentah
- `GET /api/docs-yaml` — spesifikasi YAML

Dokumentasi aktif di **semua environment** (termasuk produksi). Untuk
mematikannya, set `API_DOCS_ENABLED=false` pada environment API.

> Halaman `/api/docs` memakai CSP tersendiri (`default-src 'self'`,
> `style-src 'unsafe-inline'`) karena Swagger UI memuat aset dan `<style>`
> bawaannya. Respons API biasa tetap memakai `default-src 'none'`.

## Autentikasi

| Kebutuhan | Detail |
| --- | --- |
| Access token | `Authorization: Bearer <token>` (JWT, TTL `ACCESS_TOKEN_TTL`, default 15 menit) |
| Refresh token | Cookie `webcat_rt` (httpOnly) — dipakai `POST /api/v1/auth/refresh` |
| CSRF | Cookie `webcat_csrf` (bisa dibaca JS) **dan** header `x-csrf-token` dengan nilai yang sama |
| Login | `POST /api/v1/auth/login` mengembalikan access token **dan** menulis kedua cookie |
| Logout | `POST /api/v1/auth/logout` menghapus kedua cookie |

Endpoint yang ditandai `x-public: true` tidak memerlukan token. Endpoint
privat punya `security: [{ bearer: [] }]`; `x-required-permissions` berisi
permission yang wajib dimiliki (semua harus terpenuhi / AND).

### Alur CSRF (double-submit cookie)

1. Login/refresh menulis `webcat_csrf` (non-httpOnly) dan `webcat_rt`.
2. Klien membaca `webcat_csrf` lalu mengirimnya sebagai header
   `x-csrf-token` pada request yang memakai cookie refresh.
3. `CsrfGuard` menolak bila header tidak ada atau tidak sama → `403`
   `COMMON_CSRF_FAILED` (kode ini diterbitkan `CsrfGuard`, bukan dari
   `ERROR_CODES`).

Request dengan `Authorization: Bearer` (tanpa cookie refresh), metode aman
(`GET`/`HEAD`/`OPTIONS`), dan request tanpa cookie refresh tidak terkena
aturan ini.

## Format respons

Semua respons memakai envelope yang sama:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-11-05T10:00:00.000Z"
  },
  "error": null,
  "requestId": "req_..."
}
```

Saat gagal:

```json
{
  "success": false,
  "data": null,
  "meta": { "requestId": "req_...", "timestamp": "..." },
  "error": {
    "code": "COMMON_VALIDATION_FAILED",
    "message": "Data yang dikirim tidak valid",
    "details": [{ "path": "email", "message": "Format email tidak valid" }]
  },
  "requestId": "req_..."
}
```

Klien **wajib** bercabang pada `error.code`, bukan pada `message` (pesan bisa
berubah sewaktu-waktu). Sebagian besar kode didefinisikan di
`packages/contracts/src/common/error-codes.ts`; satu kode khusus guard
(`COMMON_CSRF_FAILED`) diterbitkan langsung oleh `CsrfGuard`. Semua kode stabil
dan perubahan nama dianggap breaking change.

| Status | Kode umum | Kapan |
| --- | --- | --- |
| 400 | `COMMON_BAD_REQUEST` | Request tidak bisa diproses |
| 401 | `COMMON_UNAUTHORIZED`, `AUTH_*` | Token tidak ada/kedaluwarsa |
| 403 | `COMMON_FORBIDDEN`, `USER_SUSPENDED`, `COMMON_CSRF_FAILED` | Tidak punya izin / CSRF gagal |
| 404 | `COMMON_NOT_FOUND`, `USER_NOT_FOUND` | Resource tidak ada |
| 409 | `COMMON_CONFLICT`, `AUTH_EMAIL_ALREADY_REGISTERED` | Bentrok state |
| 422 | `COMMON_VALIDATION_FAILED` | Validasi Zod gagal (`details` berisi field) |
| 429 | `COMMON_RATE_LIMITED` | Rate limit terlampaui (ada header `Retry-After`) |
| 500 | `COMMON_INTERNAL_ERROR` | Galat tak terduga |

Setiap operasi di `openapi.json` memuat respons `429` dan `500`, plus `401`,
`403`, dan `422` bila relevan.

## Rate limit

- **Global**: `RATE_LIMIT_GLOBAL_PER_MINUTE` (default `600`/menit) untuk
  semua endpoint tanpa aturan khusus. Kunci per pengguna login bila ada,
  selain itu per IP.
- **Per rute**: `@RateLimit({ limit, windowSeconds, scope })` menggantikan
  aturan global. Contoh: login `10` percobaan / `900` detik.
- Respons `429` menyertakan header `Retry-After` (detik).
- Operasi dengan aturan eksplisit memuat ekstensi `x-rate-limit`:

```json
"x-rate-limit": { "limit": 10, "windowSeconds": 900, "scope": "ip" }
```

## Pagination

Endpoint daftar memakai cursor, bukan offset:

```json
{
  "data": { "items": [], "nextCursor": "abc", "hasMore": true },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

Kirim `cursor` dari respons sebelumnya untuk halaman berikutnya. `nextCursor:
null` / `hasMore: false` berarti sudah habis.

## Regenerasi artefak

```bash
# dari root repo
pnpm --filter @webcat/api docs:openapi

# cek artefak masih sinkron dengan kode (dipakai CI)
pnpm --filter @webcat/api docs:openapi:check
```

Generator harus dijalankan dari **hasil build** (`node
dist/scripts/openapi.js`). `tsx`/esbuild tidak meng-emit decorator metadata,
sehingga container Nest gagal dibuat. Skrip tidak menghubungi database:
`NestFactory.create()` tidak menjalankan `onModuleInit`.

Setiap perubahan rute, skema Zod, `@ApiTags`, `@ApiOperation`, `@Public`,
`@RequirePermissions`, atau `@RateLimit` **wajib** disertai regenerasi
`openapi.json`; CI gagal bila artefak berbeda dari kode.

## Menambah endpoint baru

1. Tambahkan `@ApiTags(...)` pada controller dan `@ApiOperation({ summary })`
   pada method.
2. Pakai `@Body(zodPipe(schema))` / `@Query(zodPipe(schema))` seperti biasa —
   request body dan parameter query otomatis masuk dokumentasi. Untuk unggahan
   berkas, tambahkan `@ApiConsumes('multipart/form-data')` dan
   `@ApiFileFields('file', ...)` agar nama field berkas ikut terdokumentasi
   (field pertama dianggap wajib).
3. Tandai `@Public()` bila boleh diakses tanpa token, dan
   `@RequirePermissions(...)` bila butuh izin khusus.
4. Jalankan `pnpm --filter @webcat/api docs:openapi` lalu commit
   `docs/api/openapi.json`.
