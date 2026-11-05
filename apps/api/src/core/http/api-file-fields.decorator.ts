import { SetMetadata } from '@nestjs/common';

/**
 * Metadata nama field berkas untuk endpoint `multipart/form-data`.
 *
 * `FileInterceptor('file')` / `FileFieldsInterceptor([...])` menyimpan daftar
 * field di dalam kelas interceptor hasil `mixin`, sehingga nama field tidak
 * terbaca lewat metadata rute. Dekorator ini membuatnya eksplisit agar
 * generator dokumentasi (`core/http/openapi.ts`) bisa menuliskan field yang
 * benar — termasuk endpoint yang punya beberapa berkas sekaligus.
 *
 * Tidak memengaruhi runtime: hanya metadata untuk dokumentasi.
 */
export const FILE_FIELDS_KEY = 'webcat:openapiFileFields';

/**
 * Deklarasikan nama field berkas pada endpoint multipart.
 *
 * Field **pertama** dianggap wajib (berkas utama), sisanya opsional — sama
 * dengan `FileFieldsInterceptor([{ name: 'file' }, { name: 'assets' }])` di
 * `imports.controller.ts`.
 */
export function ApiFileFields(...fields: string[]): MethodDecorator {
  return SetMetadata(FILE_FIELDS_KEY, fields);
}
