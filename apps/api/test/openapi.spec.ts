import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { historyQuerySchema, loginSchema } from '@webcat/contracts';
import {
  TAG_DESCRIPTIONS,
  queryParameters,
  toOpenApiPath,
  zodToOpenApiSchema,
} from '../src/core/http/openapi';

interface SpecOperation {
  tags?: string[];
  summary?: string;
  operationId?: string;
  parameters?: Array<{ name: string; in: string; required?: boolean }>;
  requestBody?: { required?: boolean; content?: Record<string, unknown> };
  responses?: Record<string, { content?: Record<string, { schema?: { $ref?: string } }> }>;
  security?: Array<Record<string, string[]>>;
  'x-public'?: boolean;
  'x-required-permissions'?: string[];
}

interface SpecDocument {
  openapi: string;
  paths: Record<string, Record<string, SpecOperation | undefined>>;
  components: { schemas: Record<string, unknown> };
  tags: Array<{ name: string; description?: string }>;
}

const SPEC_PATH = resolve(__dirname, '../../../docs/api/openapi.json');
const spec = JSON.parse(readFileSync(SPEC_PATH, 'utf8')) as SpecDocument;

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function operations(): Array<{ path: string; method: string; operation: SpecOperation }> {
  const out: Array<{ path: string; method: string; operation: SpecOperation }> = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method) || !operation) continue;
      out.push({ path, method, operation });
    }
  }
  return out;
}

describe('openapi: konversi skema', () => {
  it('menerjemahkan skema body login ke JSON Schema objek', () => {
    const schema = zodToOpenApiSchema(loginSchema) as {
      type?: string;
      properties?: Record<string, unknown>;
      required?: string[];
    };

    expect(schema.type).toBe('object');
    expect(Object.keys(schema.properties ?? {})).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
    expect(schema.required).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('memecah skema query menjadi parameter individual', () => {
    const parameters = queryParameters(historyQuerySchema);
    const names = parameters.map((parameter) => parameter.name);

    expect(names).toEqual(expect.arrayContaining(['limit']));
    expect(parameters.every((parameter) => parameter.in === 'query')).toBe(true);
  });

  it('mengubah parameter path Nest menjadi format OpenAPI', () => {
    expect(toOpenApiPath(['api/v1', 'admin/users', ':id/overview'])).toBe(
      '/api/v1/admin/users/{id}/overview',
    );
    expect(toOpenApiPath(['api/v1', 'auth', '/'])).toBe('/api/v1/auth');
  });
});

describe('openapi: artefak docs/api/openapi.json', () => {
  const all = operations();

  it('memuat seluruh operasi yang dipakai klien', () => {
    expect(all.length).toBeGreaterThanOrEqual(100);
    expect(spec.openapi).toMatch(/^3\./);
  });

  it('setiap operasi punya summary, tag, operationId, dan respons 2xx', () => {
    for (const { path, method, operation } of all) {
      const id = `${method.toUpperCase()} ${path}`;
      expect(operation.summary, `${id} tanpa summary`).toBeTruthy();
      expect(operation.tags?.length, `${id} tanpa tag`).toBeGreaterThan(0);
      expect(operation.operationId, `${id} tanpa operationId`).toBeTruthy();

      const success = Object.keys(operation.responses ?? {}).filter((code) =>
        code.startsWith('2'),
      );
      expect(success.length, `${id} tanpa respons 2xx`).toBeGreaterThan(0);
      expect(operation.responses?.['429'], `${id} tanpa 429`).toBeTruthy();
      expect(operation.responses?.['500'], `${id} tanpa 500`).toBeTruthy();
    }
  });

  it('menandai endpoint publik dan mewajibkan security pada endpoint privat', () => {
    for (const { path, method, operation } of all) {
      const id = `${method.toUpperCase()} ${path}`;
      expect(typeof operation['x-public'], `${id} tanpa x-public`).toBe('boolean');
      if (operation['x-public'] === false) {
        expect(operation.security?.length, `${id} privat tanpa security`).toBeGreaterThan(0);
      }
    }
  });

  it('semua $ref menunjuk schema yang ada', () => {
    const refs = new Set<string>();
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (key === '$ref' && typeof value === 'string') refs.add(value);
        else walk(value);
      }
    };
    walk(spec);

    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs) {
      const name = ref.replace('#/components/schemas/', '');
      expect(spec.components.schemas[name], `$ref menggantung: ${ref}`).toBeDefined();
    }
  });

  it('setiap tag yang dipakai terdaftar beserta deskripsinya', () => {
    const used = new Set(all.flatMap(({ operation }) => operation.tags ?? []));
    const declared = new Map(spec.tags.map((tag) => [tag.name, tag.description]));

    for (const tag of used) {
      expect(declared.has(tag), `tag tidak dideklarasikan: ${tag}`).toBe(true);
      expect(declared.get(tag), `tag tanpa deskripsi: ${tag}`).toBeTruthy();
      expect(TAG_DESCRIPTIONS[tag], `TAG_DESCRIPTIONS tidak memuat: ${tag}`).toBeTruthy();
    }
  });

  it('setiap respons sukses memakai envelope standar', () => {
    for (const { path, method, operation } of all) {
      const success = Object.keys(operation.responses ?? {}).find((code) =>
        code.startsWith('2'),
      );
      if (!success || success === '204') continue;
      const schema = operation.responses?.[success]?.content?.['application/json']?.schema;
      expect(schema?.$ref, `${method.toUpperCase()} ${path} tidak memakai SuccessEnvelope`).toBe(
        '#/components/schemas/SuccessEnvelope',
      );
    }
  });

  it('endpoint dengan body memakai skema hasil konversi Zod', () => {
    const login = spec.paths['/api/v1/auth/login']?.post;
    const schema = login?.requestBody?.content?.['application/json'] as
      | { schema?: { properties?: Record<string, unknown> } }
      | undefined;

    expect(Object.keys(schema?.schema?.properties ?? {})).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('endpoint multipart memuat field berkas dan field skema Zod', () => {
    const upload = spec.paths['/api/v1/admin/media/upload']?.post;
    const uploadSchema = upload?.requestBody?.content?.['multipart/form-data'] as
      | { schema?: { properties?: Record<string, unknown>; required?: string[] } }
      | undefined;

    expect(uploadSchema?.schema?.properties?.file).toMatchObject({
      type: 'string',
      format: 'binary',
    });
    expect(uploadSchema?.schema?.required).toEqual(['file']);

    const impor = spec.paths['/api/v1/admin/imports']?.post;
    const imporSchema = impor?.requestBody?.content?.['multipart/form-data'] as
      | { schema?: { properties?: Record<string, unknown>; required?: string[] } }
      | undefined;

    // Dua berkas (file + assets) dan opsi impor dari skema Zod harus ada.
    expect(Object.keys(imporSchema?.schema?.properties ?? {})).toEqual(
      expect.arrayContaining(['file', 'assets', 'targetStageCode', 'dedupeMode']),
    );
    // Hanya berkas utama yang wajib.
    expect(imporSchema?.schema?.required).toEqual(['file']);
  });
});
