import { RequestMethod, type INestApplication, type Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type {
  OperationObject,
  ParameterObject,
  ResponseObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';
import { PERMISSIONS_KEY } from '../auth/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { RATE_LIMIT_KEY, type RateLimitRule } from '../ratelimit/rate-limit.guard';
import { FILE_FIELDS_KEY } from './api-file-fields.decorator';
import { ZodValidationPipe } from './validation.pipe';

/**
 * Dokumentasi OpenAPI yang benar-benar mengikuti implementasi.
 *
 * Masalah yang diselesaikan: controller memakai `@Body(zodPipe(schema))` /
 * `@Query(zodPipe(schema))`, sedangkan `@nestjs/swagger` hanya mengenali DTO
 * berbasis class. Akibatnya Swagger lama menampilkan 120 operasi **tanpa satu
 * pun request body** — dokumentasi ada, tetapi tidak bisa dipakai.
 *
 * Di sini skema Zod dibaca langsung dari metadata argumen rute
 * (`ROUTE_ARGS_METADATA`) lalu diterjemahkan ke JSON Schema. Satu sumber
 * kebenaran: kalau validasi berubah, dokumentasi ikut berubah tanpa ada
 * dekorator tambahan yang bisa lupa diperbarui.
 */

/** Pemetaan tag → deskripsi. Tag baru wajib didaftarkan (dijaga test). */
export const TAG_DESCRIPTIONS: Record<string, string> = {
  Auth: 'Registrasi, verifikasi email, login/logout, sesi, dan reset password.',
  'Plans (public)': 'Katalog paket langganan yang tampil di halaman publik.',
  'Subscriptions (saya)': 'Status dan riwayat langganan milik pengguna yang login.',
  'Profil (saya)': 'Profil, avatar, dan password milik pengguna yang login.',
  Exams: 'Alur ujian peserta: mulai sesi, soal, autosave, heartbeat, selesai.',
  'Exams: Results': 'Hasil, statistik, dan riwayat ujian peserta.',
  'Exams: Proctoring': 'Sinyal pelanggaran selama ujian.',
  'Checkout & Transactions': 'Checkout dan riwayat transaksi milik peserta.',
  Payments: 'Webhook penyedia pembayaran dan return URL.',
  'Admin — Analytics': 'KPI revenue, konversi, dan seri harian.',
  'Admin — Audit': 'Jejak audit aksi kritis.',
  'Admin — Categories': 'Taksonomi kategori/subtes bank soal.',
  'Admin — Imports': 'Impor bank soal dari XLSX/CSV/ZIP/PDF/DOCX.',
  'Admin — Media': 'Aset media soal (gambar) dan signed URL.',
  'Admin — Plans': 'CRUD paket langganan.',
  'Admin — Questions': 'CRUD soal, publish, dan lampiran media.',
  'Admin — Settings': 'Pengaturan platform.',
  'Admin — Subscriptions': 'Grant/revoke langganan manual.',
  'Admin — Transactions': 'Transaksi pembayaran dan refund.',
  'Admin — Users': 'Manajemen akun peserta.',
  'Admin: Exams': 'Konfigurasi ujian dan pemantauan sesi.',
  'Admin: Exam Monitoring': 'Pemantauan sesi ujian berjalan.',
  Health: 'Liveness dan readiness.',
  Media: 'Akses berkas media soal.',
  'Dev — Storage': 'Pelayan berkas untuk `STORAGE=dev` (tidak aktif di produksi).',
};

/** Prefix global API. Harus sama dengan `app.setGlobalPrefix()` di `main.ts`. */
const GLOBAL_PREFIX = 'api/v1';

const VERB_BY_METHOD: Record<number, string> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.DELETE]: 'delete',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.OPTIONS]: 'options',
  [RequestMethod.HEAD]: 'head',
};

/** Nilai `RouteParamtypes` yang relevan untuk dokumentasi request. */
const PARAM_BODY = 3;
const PARAM_QUERY = 4;
const PARAM_FILE = 8;
const PARAM_FILES = 9;

interface RouteArgEntry {
  pipes?: unknown[];
}

/** Satu operasi (method + path) beserta metadata yang dibutuhkan dokumentasi. */
export interface RouteDoc {
  path: string;
  method: string;
  controller: string;
  handler: string;
  tags: string[];
  summary?: string;
  description?: string;
  public: boolean;
  permissions: string[];
  rateLimit?: RateLimitRule;
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  consumes: string[];
  hasFile: boolean;
  fileFields: string[];
}

/** Gabungkan segmen rute Nest (`:id`) menjadi path OpenAPI (`{id}`). */
export function toOpenApiPath(segments: Array<string | undefined>): string {
  const joined = segments
    .filter((segment): segment is string => typeof segment === 'string' && segment.length > 0)
    .join('/');
  const prefixed = `/${joined}`.replace(/\/{2,}/g, '/');
  const withoutTrailingSlash = prefixed.length > 1 ? prefixed.replace(/\/$/, '') : prefixed;
  return withoutTrailingSlash.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function findZodSchema(entry: RouteArgEntry | undefined): ZodTypeAny | undefined {
  for (const pipe of entry?.pipes ?? []) {
    if (pipe instanceof ZodValidationPipe) return pipe.schema;
  }
  return undefined;
}

/** Ambil semua kelas controller yang terdaftar di container Nest. */
export function collectControllers(app: INestApplication): Type<unknown>[] {
  const modules = app.get(ModulesContainer, { strict: false });
  const seen = new Set<Type<unknown>>();
  for (const moduleRef of modules.values()) {
    for (const wrapper of moduleRef.controllers.values()) {
      const metatype = wrapper.metatype as Type<unknown> | undefined;
      if (metatype) seen.add(metatype);
    }
  }
  return [...seen];
}

/**
 * Kumpulkan seluruh rute beserta skema Zod yang dipakai memvalidasi
 * body/query, plus metadata otorisasi dan rate limit.
 */
export function collectRoutes(controllers: Type<unknown>[]): RouteDoc[] {
  const routes: RouteDoc[] = [];

  for (const metatype of controllers) {
    if (Reflect.getMetadata(DECORATORS.API_EXCLUDE_CONTROLLER, metatype)) continue;

    const controllerPath = Reflect.getMetadata(PATH_METADATA, metatype) as string | undefined;
    const classTags =
      (Reflect.getMetadata(DECORATORS.API_TAGS, metatype) as string[] | undefined) ?? [];
    const classPublic = Reflect.getMetadata(IS_PUBLIC_KEY, metatype) as boolean | undefined;
    const classPermissions =
      (Reflect.getMetadata(PERMISSIONS_KEY, metatype) as string[] | undefined) ?? [];
    const classRateLimit = Reflect.getMetadata(RATE_LIMIT_KEY, metatype) as
      | RateLimitRule
      | undefined;
    const classConsumes =
      (Reflect.getMetadata(DECORATORS.API_CONSUMES, metatype) as string[] | undefined) ?? [];

    for (const name of Object.getOwnPropertyNames(metatype.prototype)) {
      const handler = (metatype.prototype as Record<string, unknown>)[name];
      if (typeof handler !== 'function') continue;

      const methodPath = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
        | RequestMethod
        | undefined;
      if (methodPath === undefined || requestMethod === undefined) continue;
      if (Reflect.getMetadata(DECORATORS.API_EXCLUDE_ENDPOINT, handler)) continue;

      const verb = VERB_BY_METHOD[requestMethod];
      if (!verb) continue;

      const operation =
        (Reflect.getMetadata(DECORATORS.API_OPERATION, handler) as
          | { summary?: string; description?: string }
          | undefined) ?? {};
      const args = (Reflect.getMetadata(ROUTE_ARGS_METADATA, metatype, name) ?? {}) as Record<
        string,
        RouteArgEntry
      >;

      const route: RouteDoc = {
        path: toOpenApiPath([GLOBAL_PREFIX, controllerPath, methodPath]),
        method: verb,
        controller: metatype.name,
        handler: name,
        tags:
          (Reflect.getMetadata(DECORATORS.API_TAGS, handler) as string[] | undefined) ?? classTags,
        summary: operation.summary,
        description: operation.description,
        public: (Reflect.getMetadata(IS_PUBLIC_KEY, handler) as boolean) ?? Boolean(classPublic),
        permissions:
          (Reflect.getMetadata(PERMISSIONS_KEY, handler) as string[] | undefined) ??
          classPermissions,
        rateLimit:
          (Reflect.getMetadata(RATE_LIMIT_KEY, handler) as RateLimitRule | undefined) ??
          classRateLimit,
        consumes:
          (Reflect.getMetadata(DECORATORS.API_CONSUMES, handler) as string[] | undefined) ??
          classConsumes,
        hasFile: false,
        fileFields:
          (Reflect.getMetadata(FILE_FIELDS_KEY, handler) as string[] | undefined) ?? [],
      };

      for (const [key, entry] of Object.entries(args)) {
        const paramType = Number(key.split(':')[0]);
        if (paramType === PARAM_FILE || paramType === PARAM_FILES) route.hasFile = true;
        const schema = findZodSchema(entry);
        if (!schema) continue;
        if (paramType === PARAM_BODY) route.body = schema;
        else if (paramType === PARAM_QUERY) route.query = schema;
      }

      routes.push(route);
    }
  }

  return routes;
}

/** Zod → JSON Schema (OpenAPI 3.0), tanpa `$ref` agar tidak ada referensi menggantung. */
export function zodToOpenApiSchema(schema: ZodTypeAny): SchemaObject {
  // Tipe generik `zodToJsonSchema` sangat dalam; cast ke signature sederhana
  // agar `tsc` tidak kehabisan stack (TS2589).
  const convert = zodToJsonSchema as unknown as (
    input: unknown,
    options: Record<string, unknown>,
  ) => Record<string, unknown>;
  const json = convert(schema, {
    target: 'openApi3',
    $refStrategy: 'none',
    effectStrategy: 'input',
  });
  delete json.$schema;
  return json as SchemaObject;
}

/** Pecah skema objek Zod menjadi parameter query individual. */
export function queryParameters(schema: ZodTypeAny): ParameterObject[] {
  const json = zodToOpenApiSchema(schema) as {
    type?: string;
    properties?: Record<string, SchemaObject>;
    required?: string[];
  };
  if (json.type !== 'object' || !json.properties) return [];

  const required = new Set(json.required ?? []);
  return Object.entries(json.properties).map(([name, property]) => ({
    name,
    in: 'query' as const,
    required: required.has(name),
    schema: property,
  }));
}

const META_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['requestId', 'timestamp'],
  properties: {
    requestId: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    nextCursor: { type: 'string', nullable: true },
    hasMore: { type: 'boolean' },
    total: { type: 'integer' },
  },
  additionalProperties: true,
};

const ERROR_BODY_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['code', 'message'],
  properties: {
    code: {
      type: 'string',
      description: 'Kode stabil dari `ERROR_CODES` di `packages/contracts`.',
    },
    message: { type: 'string' },
    details: {
      description: 'Detail tambahan, mis. daftar field yang gagal validasi (`path`, `message`).',
    },
  },
};

const SUCCESS_ENVELOPE: SchemaObject = {
  type: 'object',
  required: ['success', 'data', 'meta', 'error', 'requestId'],
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      description:
        'Payload sukses. Bentuknya mengikuti tipe domain di `packages/contracts` (sumber kebenaran).',
    },
    meta: { $ref: '#/components/schemas/ResponseMeta' },
    error: { nullable: true, description: 'Selalu `null` pada respons sukses.' },
    requestId: { type: 'string' },
  },
};

const ERROR_ENVELOPE: SchemaObject = {
  type: 'object',
  required: ['success', 'data', 'meta', 'error', 'requestId'],
  properties: {
    success: { type: 'boolean', enum: [false] },
    data: { nullable: true, description: 'Selalu `null` pada respons gagal.' },
    meta: { $ref: '#/components/schemas/ResponseMeta' },
    error: { $ref: '#/components/schemas/ErrorBody' },
    requestId: { type: 'string' },
  },
};

function jsonResponse(description: string, schemaRef: string): ResponseObject {
  return {
    description,
    content: {
      'application/json': { schema: { $ref: `#/components/schemas/${schemaRef}` } },
    },
  };
}

function getOperation(
  document: OpenAPIObject,
  path: string,
  method: string,
): OperationObject | undefined {
  const item = document.paths?.[path] as Record<string, unknown> | undefined;
  const operation = item?.[method];
  return operation && typeof operation === 'object' ? (operation as OperationObject) : undefined;
}

/**
 * Terapkan skema request, respons standar, dan metadata otorisasi ke dokumen
 * hasil `SwaggerModule.createDocument()`.
 */
export function enrichDocument(document: OpenAPIObject, routes: RouteDoc[]): OpenAPIObject {
  document.components = document.components ?? {};
  document.components.schemas = {
    ...(document.components.schemas ?? {}),
    SuccessEnvelope: SUCCESS_ENVELOPE,
    ErrorEnvelope: ERROR_ENVELOPE,
    ErrorBody: ERROR_BODY_SCHEMA,
    ResponseMeta: META_SCHEMA,
  };

  // Tag yang benar-benar dipakai, lengkap dengan deskripsinya.
  const usedTags = [...new Set(routes.flatMap((route) => route.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
  document.tags = usedTags.map((name) => ({ name, description: TAG_DESCRIPTIONS[name] }));

  for (const route of routes) {
    const operation = getOperation(document, route.path, route.method);
    if (!operation) continue;

    // Request body: JSON dari skema Zod, atau multipart bila ada unggahan file.
    const isMultipart = route.consumes.includes('multipart/form-data');
    if (route.body && !isMultipart) {
      operation.requestBody = {
        required: true,
        content: { 'application/json': { schema: zodToOpenApiSchema(route.body) } },
      };
    } else if (isMultipart) {
      // Multipart: gabungkan field dari skema Zod (mis. opsi impor) dengan
      // berkas biner. Nama field berkas dibaca dari `@ApiFileFields(...)`.
      const bodySchema = route.body ? (zodToOpenApiSchema(route.body) as SchemaObject) : undefined;
      const bodyProperties =
        bodySchema?.type === 'object' ? (bodySchema.properties ?? {}) : undefined;
      const fileFields =
        route.fileFields.length > 0 ? route.fileFields : route.hasFile ? ['file'] : [];
      const properties: Record<string, SchemaObject> = {};
      for (const [name, schema] of Object.entries(bodyProperties ?? {})) {
        properties[name] = schema as SchemaObject;
      }
      for (const field of fileFields) {
        properties[field] = { type: 'string', format: 'binary' };
      }
      if (Object.keys(properties).length === 0) properties.field = { type: 'string' };
      // Field berkas pertama wajib (berkas utama); sisanya opsional, sama
      // seperti `FileFieldsInterceptor` di controller.
      const requiredFiles = fileFields.length > 0 ? [fileFields[0]] : [];
      operation.requestBody = {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties,
              required: [...(bodySchema?.required ?? []), ...requiredFiles],
            },
          },
        },
      };
    }

    // Parameter query dari skema Zod; parameter path sudah dibuat Swagger.
    if (route.query) {
      const existing = operation.parameters ?? [];
      const known = new Set(
        existing
          .filter((parameter): parameter is ParameterObject => 'in' in parameter)
          .map((parameter) => `${parameter.in}:${parameter.name}`),
      );
      operation.parameters = [
        ...existing,
        ...queryParameters(route.query).filter(
          (parameter) => !known.has(`${parameter.in}:${parameter.name}`),
        ),
      ];
    }

    // Respons sukses selalu memakai envelope standar. Bila controller tidak
    // mendeklarasikan status sukses sama sekali, tambahkan 200 agar kontrak
    // respons tidak kosong.
    const successCodes = Object.keys(operation.responses ?? {}).filter((code) =>
      code.startsWith('2'),
    );
    if (successCodes.length === 0) {
      operation.responses = {
        ...operation.responses,
        '200': jsonResponse('Sukses.', 'SuccessEnvelope'),
      };
    }
    for (const code of Object.keys(operation.responses ?? {})) {
      if (!code.startsWith('2')) continue;
      if (code === '204') {
        operation.responses[code] = { description: 'Berhasil, tanpa isi.' };
        continue;
      }
      const current = operation.responses[code] as { description?: string };
      operation.responses[code] = jsonResponse(current.description || 'Sukses.', 'SuccessEnvelope');
    }

    // Respons galat yang selalu mungkin terjadi.
    const errors: Record<string, ResponseObject> = {
      '429': jsonResponse('Rate limit terlampaui (`COMMON_RATE_LIMITED`).', 'ErrorEnvelope'),
      '500': jsonResponse('Galat internal (`COMMON_INTERNAL_ERROR`).', 'ErrorEnvelope'),
    };
    if (!route.public) {
      errors['401'] = jsonResponse('Token tidak ada atau tidak valid.', 'ErrorEnvelope');
      errors['403'] = jsonResponse(
        'Tidak punya izin, email belum terverifikasi, atau role tidak sesuai.',
        'ErrorEnvelope',
      );
    }
    if (route.body || route.query) {
      errors['422'] = jsonResponse('Validasi gagal (`COMMON_VALIDATION_FAILED`).', 'ErrorEnvelope');
    }
    operation.responses = { ...operation.responses, ...errors };

    // Metadata tambahan agar klien tahu aturan main tanpa membaca kode.
    const extensions = operation as OperationObject & Record<string, unknown>;
    extensions['x-public'] = route.public;
    if (route.permissions.length > 0) extensions['x-required-permissions'] = route.permissions;
    if (route.rateLimit) {
      extensions['x-rate-limit'] = {
        limit: route.rateLimit.limit,
        windowSeconds: route.rateLimit.windowSeconds,
        scope: route.rateLimit.scope ?? 'ip',
      };
    }
  }

  return document;
}

/** Bangun dokumen OpenAPI lengkap dari aplikasi Nest yang sudah dibuat. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('TES CAT API')
    .setDescription(
      [
        'TES CAT ujian Polri — Tes Psikologi (Kecerdasan, Kepribadian, Kecermatan, Pass Hand), TKK, TPK.',
        '',
        '**Format respons**: semua endpoint mengembalikan envelope',
        '`{ success, data, meta, error, requestId }`. Lihat `docs/api/README.md`.',
        '',
        '**Autentikasi**: `Authorization: Bearer <access token>` untuk endpoint non-publik.',
        'Endpoint yang memakai cookie refresh juga mewajibkan header `x-csrf-token`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addServer(process.env.API_URL ?? 'http://localhost:3000')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  return enrichDocument(document, collectRoutes(collectControllers(app)));
}
