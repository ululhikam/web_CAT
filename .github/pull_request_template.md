<!--
Terima kasih sudah berkontribusi. Isi bagian di bawah sebelum meminta review.
-->

## Ringkasan

<!-- Apa yang berubah dan mengapa. Sertakan tautan issue bila ada. -->

## Jenis Perubahan

- [ ] Fitur baru
- [ ] Perbaikan bug
- [ ] Refactor (tanpa perubahan perilaku)
- [ ] Dokumentasi
- [ ] Perubahan skema database
- [ ] Perubahan konfigurasi / CI

## Daftar Periksa

- [ ] `pnpm lint` lulus
- [ ] `pnpm typecheck` lulus
- [ ] `pnpm test` lulus (dan tes baru ditambahkan bila perlu)
- [ ] `pnpm build` lulus
- [ ] Tidak ada secret, kunci API, atau data pribadi yang ikut ter-commit
- [ ] Perubahan pesan/UI memakai Bahasa Indonesia yang konsisten

## Dampak Database

<!-- Wajib diisi bila ada perubahan skema. -->

- [ ] Tidak ada perubahan skema
- [ ] Ada migrasi baru di `apps/api/prisma/migrations/*`
- [ ] Seed diperbarui dan tetap idempoten
- [ ] Perubahan kompatibel mundur (deploy API sebelum web)

## Catatan untuk Reviewer

<!-- Bagian yang paling perlu diperhatikan, atau hal yang sengaja ditunda. -->
