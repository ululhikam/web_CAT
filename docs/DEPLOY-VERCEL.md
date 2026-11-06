# Deploy ke Vercel (`tes-cat`)

Dokumen ini mencatat cara platform TES CAT di-deploy ke Vercel: **dua project**
dari satu repo (web + API), sesuai ADR
[`0001-monolit-nestjs-satu-function.md`](adr/0001-monolit-nestjs-satu-function.md).

| Project | Root Directory | Framework | URL produksi |
| --- | --- | --- | --- |
| `tes-cat` | `apps/web` | `sveltekit` | https://tes-cat-mu.vercel.app |
| `tes-cat-api` | `apps/api` | Other (serverless function) | https://tes-cat-api.vercel.app |

Web mem-proxy `/api/*` ke project API lewat `rewrites` di
`apps/web/vercel.json`, sehingga **dari sisi browser semuanya same-origin**.
Itu penting: cookie `webcat_rt` dan `webcat_csrf` memakai `SameSite=Lax`, jadi
API di domain terpisah tanpa proxy akan membuat sesi tidak pernah terkirim.

```
Browser ──► tes-cat-mu.vercel.app            (SvelteKit)
              ├── /            → halaman
              └── /api/*       → rewrite ──► tes-cat-api.vercel.app/api/*
                                                (NestJS, satu function)
```

## 1. Prasyarat

- Node.js ≥ 22, `pnpm` 11.28.9 (lihat `packageManager`; Vercel menolak
  `pnpm@11.12.0` karena rilis itu cacat).
- Vercel CLI: `npm i -g vercel`, lalu `vercel login`.
- Database Supabase sudah dimigrasi (`pnpm db:deploy`) dan bucket storage ada.

## 2. Membuat / menautkan project

```powershell
vercel project add tes-cat
vercel project add tes-cat-api

# Tautkan dari ROOT repo, bukan dari apps/web atau apps/api:
# CLI menambahkan Root Directory project di atas CWD, jadi men-deploy dari
# subfolder menghasilkan path ganda (apps/api/apps/api).
vercel link --yes --project tes-cat-api
```

`.vercel/` sudah di-ignore git.

Root Directory kedua project **wajib** diset, karena `installCommand` dan
`buildCommand` di masing-masing `vercel.json` naik ke root repo (`cd ../..`)
agar bisa memakai lockfile dan workspace pnpm:

```powershell
# rootDirectory + framework diset lewat API (tidak ada flag CLI-nya)
$auth = Get-Content "$env:APPDATA\com.vercel.cli\Data\auth.json" -Raw | ConvertFrom-Json
$h = @{ Authorization = "Bearer $($auth.token)" }
$team = "team_eagY6z8dtwxMU3LixbCgyk4V"
Invoke-RestMethod -Method Patch -Headers $h -ContentType 'application/json' `
  -Uri "https://api.vercel.com/v9/projects/tes-cat?teamId=$team" `
  -Body (@{ rootDirectory = 'apps/web'; framework = 'sveltekit' } | ConvertTo-Json)
Invoke-RestMethod -Method Patch -Headers $h -ContentType 'application/json' `
  -Uri "https://api.vercel.com/v9/projects/tes-cat-api?teamId=$team" `
  -Body (@{ rootDirectory = 'apps/api' } | ConvertTo-Json)
```

### Region: samakan dengan database

Database Supabase berada di **`ap-southeast-1` (Singapura)** — lihat host pooler
`aws-0-ap-southeast-1.pooler.supabase.com` di `.env`. Region Vercel yang
setara adalah **`sin1`**, jadi semua fungsi harus jalan di sana agar setiap
query tidak menyeberangi benua.

Region diset di empat lapis supaya tidak mudah melenceng:

| Lapis | Berkas / tempat | Nilai |
| --- | --- | --- |
| Adapter web | `apps/web/svelte.config.js` → `vercel({ regions })` | `['sin1']` |
| Config web | `apps/web/vercel.json` → `regions` | `["sin1"]` |
| Config API | `apps/api/vercel.json` → `regions` + `functions['api/index.js'].regions` | `["sin1"]` |
| Default project | Vercel → Settings → Functions → Region | `sin1` |

Paket Hobby hanya boleh **satu** region. Menyetel dua (mis. `["iad1","sin1"]`)
membuat deploy gagal di tahap `Deploying outputs...` dengan
`errorCode: upgrade_required`, tanpa pesan yang jelas di log build.

Default project diset lewat API karena tidak ada flag CLI-nya (ulangi untuk
`tes-cat-api`):

```powershell
Invoke-RestMethod -Method Patch -Headers $h -ContentType 'application/json' `
  -Uri "https://api.vercel.com/v9/projects/tes-cat?teamId=$team" `
  -Body (@{ serverlessFunctionRegion = 'sin1' } | ConvertTo-Json)
```

Cek hasilnya: header `x-vercel-id` harus berawalan `sin1::`, dan
`GET /api/v1/health/ready` melaporkan `latencyMs` satu digit (round-trip
dalam region yang sama, bukan ratusan milidetik).

> Kalau database dipindah region, ubah keempat lapis di atas **dan** variabel
> `DATABASE_URL`/`DIRECT_URL` sekaligus. Fungsi yang tertinggal di region lain
> tetap berjalan, hanya jauh lebih lambat.

Catatan: baris `Running build in Washington, D.C., USA (East) – iad1` di log
build adalah **region build**, bukan region fungsi. Region build tidak bisa
dipilih (selalu `iad1`), dan itu tidak memengaruhi latensi aplikasi — yang
penting adalah region tempat fungsi dan database berjalan.

## 3. Environment variables

Hanya project **API** yang butuh secret. Web tidak membaca env apa pun saat
build (klien memakai basis relatif `/api/v1`).

```powershell
pwsh -File scripts/vercel-env-sync.ps1 -Project tes-cat-api -LinkDir apps/api
```

Skrip menyalin variabel dari `.env` di root repo, dengan penimpaan produksi:

| Variabel | Nilai produksi | Alasan |
| --- | --- | --- |
| `NODE_ENV` | `production` | cookie `secure`, log produksi |
| `APP_URL` | `https://tes-cat-mu.vercel.app` | origin CORS + tautan email |
| `API_URL` | `https://tes-cat-api.vercel.app` | tautan absolut di email |
| `MAIL_FROM` | isi `EMAIL_FROM` | nama variabel di skema env adalah `MAIL_FROM` |
| `COOKIE_DOMAIN` | *(dihapus)* | cookie harus host-only di domain web |

Variabel yang tidak ikut di-push: `PORT` (diisi platform), `TZ` (reserved),
variabel seed/bootstrap, `SHADOW_DATABASE_URL`, `DATABASE_URL_TEST`,
`ALLOW_REMOTE_DB`, `CONFIRM_DATABASE`, dan kunci Midtrans (pembayaran memakai
`PAYMENT=fake` di lingkungan ini).

## 4. Deploy

```powershell
# API dulu, supaya domain proxy di web sudah hidup
vercel deploy --prod   # di apps/api
vercel deploy --prod   # di apps/web
```

Urutan penting: kalau web di-deploy lebih dulu, `/api/*` akan 404 sampai
project API ada.

## 5. Verifikasi

```powershell
Invoke-RestMethod https://tes-cat-api.vercel.app/api/v1/health
Invoke-WebRequest https://tes-cat-mu.vercel.app -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest https://tes-cat-mu.vercel.app/og.png -UseBasicParsing | Select-Object StatusCode, @{n='Type';e={$_.Headers.'Content-Type'}}
Invoke-RestMethod https://tes-cat-mu.vercel.app/api/v1/health   # membuktikan rewrite
```

Login harus tetap berfungsi (cookie lewat proxy):

```powershell
$body = @{ email = 'user@example.com'; password = 'PesertaDemo123' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri https://tes-cat-mu.vercel.app/api/v1/auth/login `
  -ContentType 'application/json' -Body $body -SessionVariable s
Invoke-RestMethod -Uri https://tes-cat-mu.vercel.app/api/v1/auth/me -WebSession $s
```

## 6. Catatan operasional

- **Migrasi tidak dijalankan dari build Vercel.** Jalankan `pnpm db:deploy`
  dari mesin/CI sebelum deploy (menghindari race antar instance).
- **Cron** di `apps/api/vercel.json` hanya dua job harian
  (`expire-subscriptions`, `cleanup`) karena paket Hobby membatasi frekuensi
  cron ke sekali per hari. `finalize-subtests` dan `process-jobs` yang semula
  tiap menit dijalankan lewat *lazy reconcile* saat request, atau dipindahkan
  ke Supabase `pg_cron`.
- **Builder API.** `apps/api/api/index.js` sengaja JavaScript CommonJS dan
  memuat `dist/src/main.js` hasil `tsc`. Builder Vercel tidak meng-emit
  decorator metadata (`design:paramtypes`) yang dibutuhkan DI NestJS, jadi
  bootstrap Nest tidak boleh ditranspile oleh Vercel. Project API tidak memakai
  framework preset, sehingga `outputDirectory: "public"` + satu halaman
  `apps/api/public/index.html` dipakai sebagai placeholder statis.
- **`sharp`** dipakai modul import/media. Di serverless ia butuh binary linux;
  pnpm meng-install opsional dependency sesuai platform saat build Vercel.
- **Logo & favicon** dibuat dari `logo.png` di root repo:
  `python scripts/make-brand-assets.py`. Hasilnya masuk `apps/web/static/`:
  `favicon.ico`, `favicon.png`, `apple-touch-icon.png`, `icon-192.png`,
  `icon-512.png`, `logo-badge.png` (tile navy untuk header/sidebar putih),
  `logo-mark.png` (transparan, untuk footer gelap), dan `og.png` (1200×630).
