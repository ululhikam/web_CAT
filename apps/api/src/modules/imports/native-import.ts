/**
 * `unpdf` hanya tersedia sebagai ESM. Berkas ini dikompilasi ke CommonJS,
 * jadi `await import()` biasa akan ditransformasi TypeScript menjadi
 * `require()` dan gagal. `new Function` mempertahankan dynamic import asli
 * sekaligus menjaga modul berat tetap di luar cold start jalur ujian.
 */
export type NativeImporter = <T>(specifier: string) => Promise<T>;

export const nativeImport: NativeImporter = new Function(
  'specifier',
  'return import(specifier)',
) as NativeImporter;