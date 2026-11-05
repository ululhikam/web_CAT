# TES CAT — Ujian Polri

Platform TES CAT ujian seleksi Polri: **Tes Psikologi** (Kecerdasan, Kepribadian,
Kecermatan, Pass Hand), **TKK** (Tes Kemampuan Komputer), dan **TPK** (Tes
Pengetahuan Kepolisian). Dibangun sebagai monorepo NestJS + SvelteKit dengan
Postgres (Supabase) dan deploy di Vercel.

> Status: **Fase 0 (fondasi) selesai.** Lihat [`docs/LAPORAN-PEKERJAAN.md`](docs/LAPORAN-PEKERJAAN.md)
> untuk rincian pekerjaan, tanggal, dan hasil verifikasi.

## Stack

| Lapisan     | Teknologi                                              |
| ----------- | ------------------------------------------------------ |
| Frontend    | SvelteKit 2, Svelte 5 (runes), Vite 6                  |
| Backend     | NestJS 10, satu Vercel Serverless Function             |
| Database    | Postgres 15 di Supabase + Prisma ORM                   |
| Storage     | Supabase Storage (aset soal & berkas impor)            |
| Pembayaran  | Midtrans Snap                                          |
| Monorepo    | pnpm workspace + Turborepo                             |
| Test        | Vitest (unit), MSW (mock API)                          |

Tanpa Docker. Tanpa Redis/BullMQ — pekerjaan terjadwal memakai **Vercel Cron**
dan tabel `job_queue` di Postgres (`FOR UPDATE SKIP LOCKED`).

## Struktur Repo

```
apps/
  api/                 NestJS API (satu serverless function)
    api/index.ts       entrypoint Vercel
    prisma/            schema multi-file, migrasi, seed
    scripts/           env-check, db-guard, cron-run
    src/core/          config, prisma, auth, security, jobs, ports
    src/modules/       auth, users, billing, audit, health
  web/                 SvelteKit frontend
    src/routes/        (site) publik, (app) peserta, (admin) admin
    src/lib/           api client, session store, format, komponen
packages/
  contracts/           tipe + Zod schema + RBAC bersama (CommonJS)
  ui/                  design token & komponen Svelte dasar
  mocks/               fixture deterministik 1090 soal + handler MSW
docs/                  laporan pekerjaan & ADR
```

## Prasyarat

- Node.js **>= 22**
- pnpm **11.12.0** (`corepack enable`)
- Database Postgres (lokal atau Supabase)

## Mulai Cepat

```bash
pnpm install
cp .env.example .env            # isi DATABASE_URL, DIRECT_URL, JWT_SECRET, dll.

pnpm env:check                  # validasi variabel environment
pnpm db:ping                    # cek koneksi ke Postgres/Supabase
pnpm db:generate                # prisma generate
pnpm db:validate                # validasi schema
pnpm db:deploy                  # jalankan migrasi
pnpm db:seed                    # role, permission, tahap, subtes, paket, SUPER_ADMIN

pnpm dev                        # api :3000 + web :5173
```

Panduan Supabase langkah demi langkah: [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md).

## Perintah Penting

| Perintah              | Fungsi                                              |
| --------------------- | --------------------------------------------------- |
| `pnpm verify`         | lint → typecheck → test → build (gerbang CI)         |
| `pnpm lint`           | ESLint seluruh paket                                 |
| `pnpm typecheck`      | tsc + svelte-check                                   |
| `pnpm test`           | Vitest seluruh paket                                 |
| `pnpm build`          | build produksi                                       |
| `pnpm env:check`      | validasi variabel environment                        |
| `pnpm db:ping`        | cek koneksi & jumlah tabel di database               |
| `pnpm db:validate`    | validasi schema Prisma                               |
| `pnpm db:guard`       | menolak operasi destruktif di lingkungan produksi    |
| `pnpm cron:run`       | menjalankan satu siklus worker job secara manual     |
| `pnpm fixtures:generate` | menulis ulang fixture soal deterministik         |

> Prisma selalu memerlukan `--schema prisma/schema` (schema multi-file). Script
> di `package.json` sudah menyertakannya.

## Peran Pengguna

Hierarki bersifat aditif: `USER` ⊂ `ADMIN` ⊂ `SUPER_ADMIN`.

- **USER** — mengerjakan ujian (`exam.take`).
- **ADMIN** — kelola peserta, langganan manual, bank soal, konfigurasi ujian.
- **SUPER_ADMIN** — seluruh izin, termasuk `roles.manage` dan force-unlock subtes.

Pendaftaran mandiri **tidak** dibuka. Akun dibuat admin lewat undangan
(token 7 hari) atau password sementara yang wajib diganti saat login pertama.

## Deployment

Dua proyek Vercel terpisah (lihat `apps/api/vercel.json` dan `apps/web/vercel.json`):

1. **web-cat-api** — root `apps/api`, build `pnpm --filter @webcat/api build`.
2. **web-cat-web** — root `apps/web`, build `pnpm --filter @webcat/web build`.

Adapter web dipilih otomatis: `adapter-vercel` bila env `VERCEL` terisi,
selain itu `adapter-node` (agar build lokal di Windows tidak gagal karena
keterbatasan symlink).

## Lisensi

Milik pribadi / proprietary. Lihat `CODEOWNERS`.
