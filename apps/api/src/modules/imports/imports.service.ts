import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import JSZip from 'jszip';
import { randomUUID } from 'node:crypto';
import {
  IMPORT_MAX_BYTES,
  IMPORT_MAX_ROWS,
  decodeCursor,
  encodeCursor,
  importQuestionPayloadSchema,
  type ImportCommitInput,
  type ImportCommitResult,
  type ImportItemStatus,
  type ImportItemView,
  type ImportJobListResponse,
  type ImportJobStats,
  type ImportJobView,
  type ImportListQuery,
  type ImportPreviewQuery,
  type ImportPreviewResponse,
  type ImportQuestionPayload,
  type ImportSourceKind,
  type Role,
  type StageCode,
  type SubtestCode,
} from '@webcat/contracts';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MediaService } from '../media/media.service';
import { QuestionsService } from '../questions/questions.service';
import { computeDedupeHash } from '../questions/dedupe';
import { buildPayload } from './draft';
import { extractDocx } from './docx-extractor';
import { parseDocBlocks, SUBTEST_OF_STAGE_HINT, type SourceLine } from './document-parser';
import type { ImportSettings, ParsedRow } from './imports.types';
import { extractPdf, pdfImagesForParser } from './pdf-extractor';
import { buildTemplateWorkbook, parseSpreadsheet } from './spreadsheet-parser';

interface Actor {
  id: string;
  role: Role;
  ip?: string | null;
  userAgent?: string | null;
}

const COMMIT_CHUNK = 500;

const SPREADSHEET_MIMES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ZIP_MIMES = ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'];

export interface CreateImportInput {
  file: Express.Multer.File;
  assets?: Express.Multer.File;
  settings: ImportSettings;
}

const EMPTY_STATS: ImportJobStats = {
  total: 0,
  valid: 0,
  invalid: 0,
  duplicate: 0,
  imported: 0,
  skipped: 0,
};

/**
 * Pipeline impor soal.
 *
 * Alur: unggah → deteksi format → ekstraksi/parse → simpan item (review) →
 * commit bertahap 500 baris. Tidak ada jalur yang langsung mempublikasikan
 * soal: status maksimum dari impor adalah `REVIEW`.
 */
@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly media: MediaService,
    private readonly questions: QuestionsService,
  ) {}

  // ------------------------------------------------------------------ create

  async create(input: CreateImportInput, actor: Actor): Promise<ImportJobView> {
    const file = input.file;
    if (!file || file.size === 0) {
      throw new UnprocessableEntityException({
        code: 'IMPORT_PARSE_FAILED',
        message: 'Berkas impor tidak ditemukan',
      });
    }
    if (file.size > IMPORT_MAX_BYTES) {
      throw new PayloadTooLargeException({
        code: 'IMPORT_FILE_TOO_LARGE',
        message: 'Ukuran berkas maksimal 10 MB',
      });
    }

    const mime = detectMime(file);
    const sourceKind = sourceKindFor(mime, file.originalname);
    if (!sourceKind) {
      const legacyWord = file.originalname.toLowerCase().endsWith('.doc');
      throw new UnsupportedMediaTypeException({
        code: 'IMPORT_UNSUPPORTED_FORMAT',
        message: legacyWord
          ? 'Format .doc lama tidak didukung. Simpan ulang sebagai .docx lalu unggah kembali.'
          : 'Format tidak didukung. Gunakan CSV, XLSX, PDF, atau DOCX.',
      });
    }

    const settings = await this.normalizeSettings(input.settings);
    if (settings.dedupeMode === 'OVERRIDE' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({
        code: 'IMPORT_OVERRIDE_FORBIDDEN',
        message: 'Hanya SUPER_ADMIN yang dapat mengizinkan impor duplikat',
      });
    }
    const storagePath = `imports/${actor.id}/${Date.now()}-${sanitize(file.originalname)}`;

    const job = await this.prisma.importJob.create({
      data: {
        adminId: actor.id,
        sourceKind,
        status: 'PARSING',
        originalName: file.originalname,
        storagePath,
        mime,
        sizeBytes: file.size,
        settings: settings as never,
      },
    });

    try {
      const { rows, warnings, pageCount } = await this.parseInput(
        file,
        sourceKind,
        mime,
        settings,
        input.assets,
        actor.id,
      );

      const categoryMap = await this.categoryMap();
      const seen = new Map<string, number>();
      const prepared: Prisma.ImportJobItemCreateManyInput[] = [];

      const limited = rows.slice(0, IMPORT_MAX_ROWS);

      // Kumpulkan hash lebih dulu supaya pengecekan duplikat cukup satu query
      // per 300 kunci, bukan satu query per baris (target 5.000 baris).
      const hashByRow = new Map<number, string>();
      for (const row of limited) {
        const payload = row.payload;
        if (payload?.stageCode && payload.subtestCode) {
          hashByRow.set(row.rowNumber, computeDedupeHash(payload.stemText, payload.options));
        }
      }
      const existingByKey = await this.existingDuplicates(hashByRow, limited);

      for (const row of limited) {
        const payload = row.payload;
        let status: ImportItemStatus = row.issues.length > 0 ? 'INVALID' : 'VALID';
        const issues = [...row.issues];

        if (payload) {
          const resolvedCategory = resolveCategory(payload.categoryPath, categoryMap);
          if (payload.categoryPath && !resolvedCategory) {
            issues.push(`Kategori "${payload.categoryPath}" tidak ditemukan`);
          }
          payload.categoryId = resolvedCategory?.id ?? settings.categoryId ?? null;

          if (issues.length > 0) status = 'INVALID';

          if (status === 'VALID' && payload.stageCode && payload.subtestCode) {
            const hash = hashByRow.get(row.rowNumber);
            const key = `${payload.stageCode}:${payload.subtestCode}:${hash ?? ''}`;
            const firstRow = seen.get(key);
            const existing = existingByKey.get(key);
            if (firstRow !== undefined) {
              status = 'DUPLICATE';
              issues.push(`Duplikat dengan baris ${firstRow} dalam berkas ini`);
            } else if (existing) {
              seen.set(key, row.rowNumber);
              if (settings.dedupeMode === 'SKIP') {
                status = 'DUPLICATE';
                issues.push(`Sudah ada di bank soal (${existing.publicCode})`);
              } else if (settings.dedupeMode === 'WARN') {
                // Mode WARN mengimpor duplikat tetapi memberi catatan.
                row.warnings.push(
                  `Duplikat database ${existing.publicCode} — tetap diimpor (mode peringatan)`,
                );
              } else {
                row.warnings.push(
                  `Duplikat database ${existing.publicCode} — diimpor sebagai soal baru (override)`,
                );
              }
            } else {
              seen.set(key, row.rowNumber);
            }
          }
        }

        prepared.push({
          jobId: job.id,
          rowNumber: row.rowNumber,
          status,
          confidence: row.confidence,
          payload: (payload ?? undefined) as never,
          rawText: row.rawText ?? null,
          issues: [...new Set([...issues, ...row.warnings])] as never,
          questionId: null,
        });
      }

      const stats = countStats(prepared.map((row) => row.status as ImportItemStatus));

      await this.prisma.$transaction([
        this.prisma.importJobItem.createMany({ data: prepared }),
        this.prisma.importJob.update({
          where: { id: job.id },
          data: {
            status: 'PARSED',
            totalRows: prepared.length,
            processedRows: prepared.length,
            stats: stats as never,
            warnings: [...new Set(warnings)] as never,
            finishedAt: null,
          },
        }),
      ]);

      await this.audit.record({
        actorUserId: actor.id,
        action: 'import.created',
        entityType: 'import_job',
        entityId: job.id,
        metadata: {
          sourceKind,
          originalName: file.originalname,
          sizeBytes: file.size,
          rows: prepared.length,
          pageCount,
        },
        ip: actor.ip ?? null,
        userAgent: actor.userAgent ?? null,
      });

      return this.getById(job.id, actor);
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          warnings: [
            error instanceof Error ? error.message : 'Parser gagal membaca berkas',
          ] as never,
        },
      });
      if (error instanceof UnprocessableEntityException) throw error;
      throw new UnprocessableEntityException({
        code: 'IMPORT_PARSE_FAILED',
        message:
          error instanceof Error
            ? `Berkas tidak dapat dibaca: ${error.message}`
            : 'Berkas tidak dapat dibaca',
      });
    }
  }

  // ------------------------------------------------------------------ reads

  async list(
    query: ImportListQuery,
    actor: { id: string; role: Role },
  ): Promise<ImportJobListResponse> {
    const cursor = query.cursor ? decodeCursor<{ t: string; i: string }>(query.cursor) : null;
    const rows = await this.prisma.importJob.findMany({
      where: {
        ...(actor.role === 'SUPER_ADMIN' ? {} : { adminId: actor.id }),
        ...(query.status ? { status: query.status } : {}),
        ...(query.sourceKind ? { sourceKind: query.sourceKind } : {}),
        ...(cursor
          ? {
              AND: [
                {
                  OR: [
                    { createdAt: { lt: new Date(cursor.t) } },
                    { createdAt: new Date(cursor.t), id: { lt: cursor.i } },
                  ],
                },
              ],
            }
          : {}),
      },
      include: { admin: { select: { email: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page[page.length - 1];

    return {
      rows: page.map((row) => this.mapJob(row)),
      nextCursor:
        hasMore && last ? encodeCursor({ t: last.createdAt.toISOString(), i: last.id }) : null,
      hasMore,
    };
  }

  async getById(id: string, actor?: { id: string; role?: Role }): Promise<ImportJobView> {
    const job = await this.prisma.importJob.findUnique({
      where: { id },
      include: { admin: { select: { email: true } } },
    });
    if (!job) throw this.notFound();
    if (actor?.role && actor.role !== 'SUPER_ADMIN' && job.adminId !== actor.id) {
      // Jangan bocorkan keberadaan job milik admin lain.
      throw this.notFound();
    }
    return this.mapJob(job);
  }

  async preview(
    id: string,
    query: ImportPreviewQuery,
    actor: { id: string; role: Role },
  ): Promise<ImportPreviewResponse> {
    const job = await this.requireJob(id, actor);
    if (job.status === 'CANCELLED') {
      throw new ConflictException({
        code: 'IMPORT_JOB_STATE_INVALID',
        message: 'Job impor sudah dibatalkan',
      });
    }

    const rows = await this.prisma.importJobItem.findMany({
      where: {
        jobId: id,
        ...(query.status ? { status: query.status } : {}),
        // Cursor adalah rowNumber baris berikutnya; memakai rowNumber (bukan
        // offset) menjaga paginasi tetap benar saat filter status aktif.
        ...(query.cursor ? { rowNumber: { gte: query.cursor } } : {}),
      },
      orderBy: { rowNumber: 'asc' },
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page[page.length - 1];

    return {
      job: this.mapJob(job),
      rows: page.map((row) => this.mapItem(row)),
      nextCursor: hasMore && last ? last.rowNumber + 1 : null,
      hasMore,
      summary: statsOf(job.stats),
    };
  }

  async listErrors(
    id: string,
    actor: { id: string; role: Role },
  ): Promise<Array<{ rowNumber: number | null; code: string; message: string }>> {
    await this.requireJob(id, actor);
    const rows = await this.prisma.importJobError.findMany({
      where: { jobId: id },
      orderBy: [{ rowNumber: 'asc' }, { id: 'asc' }],
      take: 5000,
    });
    return rows.map((row) => ({
      rowNumber: row.rowNumber,
      code: row.code,
      message: row.message,
    }));
  }

  /** CSV error per baris; siap diunduh admin. */
  async errorsCsv(id: string, actor: { id: string; role: Role }): Promise<string> {
    const job = await this.requireJob(id, actor);
    const items = await this.prisma.importJobItem.findMany({
      where: { jobId: id, status: { in: ['INVALID', 'DUPLICATE'] } },
      orderBy: { rowNumber: 'asc' },
      take: 5000,
    });

    const lines = ['row,status,issues,stem'];
    for (const item of items) {
      const issues = Array.isArray(item.issues) ? (item.issues as string[]) : [];
      const payload = item.payload as { stemText?: string } | null;
      lines.push(
        [
          item.rowNumber,
          item.status,
          csvCell(issues.join(' | ')),
          csvCell((payload?.stemText ?? item.rawText ?? '').slice(0, 300)),
        ].join(','),
      );
    }

    if (job.status === 'PARSED' || job.status === 'COMPLETED') {
      const errors = await this.prisma.importJobError.findMany({
        where: { jobId: id },
        orderBy: [{ rowNumber: 'asc' }, { id: 'asc' }],
      });
      for (const error of errors) {
        lines.push([error.rowNumber ?? '', error.code, csvCell(error.message), ''].join(','));
      }
    }

    return lines.join('\r\n');
  }

  async template(): Promise<Buffer> {
    return buildTemplateWorkbook();
  }

  // ------------------------------------------------------------------ review

  async updateItem(
    jobId: string,
    itemId: string,
    input: { payload?: ImportQuestionPayload; skip?: boolean },
    actor: Actor,
  ): Promise<ImportItemView> {
    const job = await this.requireJob(jobId, actor);
    if (!['PARSED', 'REVIEWING'].includes(job.status)) {
      throw new ConflictException({
        code: 'IMPORT_JOB_STATE_INVALID',
        message: 'Item hanya dapat diedit pada tahap review',
      });
    }

    const item = await this.prisma.importJobItem.findFirst({
      where: { id: itemId, jobId },
    });
    if (!item) {
      throw new NotFoundException({
        code: 'IMPORT_ITEM_NOT_FOUND',
        message: 'Baris impor tidak ditemukan',
      });
    }
    if (item.status === 'IMPORTED') {
      throw new ConflictException({
        code: 'IMPORT_JOB_STATE_INVALID',
        message: 'Baris sudah diimpor dan tidak dapat diubah',
      });
    }

    let payload = (input.payload ?? item.payload) as ImportQuestionPayload | null;
    let status: ImportItemStatus = 'VALID';
    const issues: string[] = [];

    if (input.skip) {
      status = 'SKIPPED';
    } else if (payload) {
      const parsed = importQuestionPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        status = 'INVALID';
        issues.push(
          ...parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        );
      } else {
        payload = parsed.data;
        const settings = (job.settings ?? {}) as unknown as ImportSettings;
        const rebuilt = buildPayload(
          {
            rowNumber: item.rowNumber,
            rawText: item.rawText,
            publicCode: payload.publicCode,
            stageCode: payload.stageCode,
            subtestCode: payload.subtestCode,
            type: payload.type,
            difficulty: payload.difficulty,
            stemText: payload.stemText,
            explanation: payload.explanation ?? null,
            pairGroup: payload.pairGroup ?? null,
            columnIndex: payload.columnIndex ?? null,
            weight: payload.weight,
            scoringStrategy: payload.scoringStrategy,
            likertDimension: payload.likertDimension,
            options: payload.options.map((option) => ({
              label: option.label,
              contentText: option.contentText,
              isCorrect: option.isCorrect,
            })),
            correctLabels: payload.correctLabels,
            tags: payload.tags,
            warnings: [],
            confidence: payload.confidence ?? Number(item.confidence ?? 0),
          },
          settings,
        );
        payload = { ...payload, warnings: rebuilt.warnings };
        issues.push(...rebuilt.issues);

        if (rebuilt.issues.length === 0 && payload.stageCode && payload.subtestCode) {
          const hash = computeDedupeHash(payload.stemText, payload.options);
          const duplicate = await this.findDuplicate(
            payload.stageCode,
            payload.subtestCode,
            hash,
            item.questionId ?? undefined,
          );
          if (duplicate) {
            if (settings.dedupeMode === 'SKIP') {
              status = 'DUPLICATE';
              issues.push(`Sudah ada di bank soal (${duplicate.publicCode})`);
            } else if (settings.dedupeMode === 'WARN') {
              payload.warnings = [
                ...payload.warnings,
                `Duplikat ${duplicate.publicCode} — tetap diimpor (mode peringatan)`,
              ];
            } else {
              payload.warnings = [
                ...payload.warnings,
                `Duplikat ${duplicate.publicCode} (override)`,
              ];
            }
          }
        }
        if (issues.length > 0) status = 'INVALID';
      }
    }

    const updated = await this.prisma.importJobItem.update({
      where: { id: itemId },
      data: {
        payload: (payload ?? undefined) as never,
        status,
        issues: [...new Set([...(payload?.warnings ?? []), ...issues])] as never,
        confidence: payload?.confidence ?? item.confidence,
      },
    });

    await this.refreshStats(jobId);
    await this.audit.record({
      actorUserId: actor.id,
      action: input.skip ? 'import.item_skipped' : 'import.item_updated',
      entityType: 'import_job',
      entityId: jobId,
      metadata: { itemId, rowNumber: item.rowNumber, status },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapItem(updated);
  }

  // ------------------------------------------------------------------ commit

  async commit(jobId: string, input: ImportCommitInput, actor: Actor): Promise<ImportCommitResult> {
    const job = await this.requireJob(jobId, actor);
    if (!['PARSED', 'REVIEWING', 'COMMITTING'].includes(job.status)) {
      throw new ConflictException({
        code: 'IMPORT_JOB_STATE_INVALID',
        message: 'Job impor tidak dalam tahap yang dapat di-commit',
      });
    }

    const settings = {
      ...((job.settings ?? {}) as unknown as ImportSettings),
      ...(input.dedupeMode ? { dedupeMode: input.dedupeMode } : {}),
    } as ImportSettings;

    if (settings.dedupeMode === 'OVERRIDE' && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({
        code: 'IMPORT_OVERRIDE_FORBIDDEN',
        message: 'Hanya SUPER_ADMIN yang dapat mengizinkan impor duplikat',
      });
    }

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'COMMITTING' },
    });

    const where: Prisma.ImportJobItemWhereInput = {
      jobId,
      status: { in: ['VALID', 'DUPLICATE'] },
      ...(input.itemIds?.length ? { id: { in: input.itemIds } } : {}),
    };

    const totalItems = await this.prisma.importJobItem.count({ where });
    const errors: ImportCommitResult['errors'] = [];
    let created = 0;
    let skipped = 0;
    let guard = 0;
    /** Kursor `rowNumber` agar baris yang sudah diproses tidak diulang. */
    let lastRowNumber = 0;

    while (true) {
      guard += 1;
      if (guard > Math.ceil(totalItems / COMMIT_CHUNK) + 20) break;

      const chunk = await this.prisma.importJobItem.findMany({
        where: { ...where, rowNumber: { gt: lastRowNumber } },
        orderBy: { rowNumber: 'asc' },
        take: COMMIT_CHUNK,
      });
      if (chunk.length === 0) break;
      lastRowNumber = chunk[chunk.length - 1]!.rowNumber;

      const eligible: Array<{
        item: (typeof chunk)[number];
        input: Parameters<QuestionsService['importQuestions']>[0][number]['input'];
        payload: ImportQuestionPayload;
      }> = [];

      for (const item of chunk) {
        const payload = item.payload as ImportQuestionPayload | null;
        if (!payload) {
          skipped += 1;
          await this.prisma.importJobItem.update({
            where: { id: item.id },
            data: { status: 'SKIPPED' },
          });
          continue;
        }
        if (item.status === 'DUPLICATE' && settings.dedupeMode === 'SKIP') {
          skipped += 1;
          await this.prisma.importJobItem.update({
            where: { id: item.id },
            data: { status: 'SKIPPED' },
          });
          continue;
        }

        eligible.push({
          item,
          payload,
          input: {
            publicCode: payload.publicCode,
            stageCode: payload.stageCode as StageCode,
            subtestCode: payload.subtestCode as SubtestCode,
            categoryId: input.categoryId ?? payload.categoryId ?? null,
            type: payload.type ?? settings.defaultType,
            status: input.targetStatus,
            difficulty: payload.difficulty ?? settings.defaultDifficulty,
            stemText: payload.stemText,
            stemFormat: payload.stemFormat ?? 'MARKDOWN',
            explanation: payload.explanation ?? null,
            scoringStrategy: payload.scoringStrategy,
            scoringConfig: null,
            weight: payload.weight,
            pairGroup: payload.pairGroup ?? null,
            columnIndex: payload.columnIndex ?? null,
            dedupeOverride: item.status === 'DUPLICATE' && settings.dedupeMode !== 'SKIP',
            options: payload.options.map((option) => ({
              label: option.label,
              contentText: option.contentText,
              isCorrect: option.isCorrect,
              scoreValue: option.scoreValue,
              dimensionMap: option.dimensionMap,
              sortOrder: option.sortOrder,
            })),
            media: payload.media ?? [],
            tags: payload.tags,
          },
        });
      }

      if (eligible.length === 0) continue;

      let batch: Awaited<ReturnType<QuestionsService['importQuestions']>>;
      try {
        batch = await this.questions.importQuestions(
          eligible.map((entry) => ({ itemId: entry.item.id, input: entry.input })),
          { status: input.targetStatus, sourceImportId: jobId },
        );
      } catch {
        // Satu baris rusak tidak boleh menggagalkan seluruh chunk: ulangi
        // per baris agar laporan error tetap per baris.
        batch = { created: [], failed: [] };
        for (const entry of eligible) {
          try {
            const questionId = await this.questions.createImported(entry.input, {
              status: input.targetStatus,
              sourceImportId: jobId,
              publicCode:
                entry.payload.publicCode ??
                `Q-${entry.payload.stageCode ?? 'X'}-${entry.payload.subtestCode ?? 'X'}-${randomUUID()
                  .replace(/-/g, '')
                  .slice(0, 10)
                  .toUpperCase()}`,
            });
            batch.created.push({ itemId: entry.item.id, questionId });
          } catch (error) {
            batch.failed.push({
              itemId: entry.item.id,
              code: errorCodeFor(error),
              message: errorMessageFor(error),
            });
          }
        }
      }

      const eligibleById = new Map(eligible.map((entry) => [entry.item.id, entry]));

      for (const createdRow of batch.created) {
        const entry = eligibleById.get(createdRow.itemId);
        if (!entry) continue;
        created += 1;
        await this.prisma.importJobItem.update({
          where: { id: createdRow.itemId },
          data: { status: 'IMPORTED', questionId: createdRow.questionId },
        });
      }

      for (const failure of batch.failed) {
        const entry = eligibleById.get(failure.itemId);
        if (!entry) continue;
        errors.push({
          rowNumber: entry.item.rowNumber,
          code: failure.code,
          message: failure.message,
        });
        await this.prisma.importJobItem.update({
          where: { id: failure.itemId },
          data: {
            status: failure.code === 'QUESTION_DUPLICATE' ? 'DUPLICATE' : 'INVALID',
            issues: [...((entry.item.issues as string[] | null) ?? []), failure.message] as never,
          },
        });
        await this.prisma.importJobError.create({
          data: {
            jobId,
            rowNumber: entry.item.rowNumber,
            code: failure.code,
            message: failure.message,
            rawPayload: entry.payload as never,
          },
        });
      }
    }

    const stats = await this.refreshStats(jobId);

    const updated = await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        processedRows: totalItems,
        finishedAt: new Date(),
        stats: stats as never,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'import.committed',
      entityType: 'import_job',
      entityId: jobId,
      metadata: {
        targetStatus: input.targetStatus,
        requested: totalItems,
        created,
        skipped,
        failed: errors.length,
      },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return {
      job: this.mapJob({ ...updated, admin: job.admin }),
      created,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 100),
    };
  }

  async cancel(jobId: string, actor: Actor): Promise<ImportJobView> {
    const job = await this.requireJob(jobId, actor);
    if (['COMPLETED', 'CANCELLED'].includes(job.status)) {
      throw new ConflictException({
        code: 'IMPORT_JOB_STATE_INVALID',
        message: 'Job impor sudah selesai atau dibatalkan',
      });
    }

    const updated = await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', finishedAt: new Date() },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'import.cancelled',
      entityType: 'import_job',
      entityId: jobId,
      metadata: { processedRows: job.processedRows },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.mapJob({ ...updated, admin: job.admin });
  }

  // ------------------------------------------------------------------ parsing

  private async parseInput(
    file: Express.Multer.File,
    sourceKind: ImportSourceKind,
    mime: string,
    settings: ImportSettings,
    assets: Express.Multer.File | undefined,
    actorId: string,
  ): Promise<{
    rows: ParsedRow[];
    warnings: string[];
    pageCount: number;
    imageAssets: Map<number, { mediaAssetId: string; altText?: string }>;
  }> {
    const imageAssets = new Map<number, { mediaAssetId: string }>();

    if (sourceKind === 'SPREADSHEET') {
      const budget = { remaining: 60 };
      const zipImages = assets ? await this.readZipImages(assets, budget, actorId) : new Map();

      const parsed = await parseSpreadsheet(file.buffer, mime, file.originalname, settings);

      // Lampirkan gambar ZIP berdasarkan nama file yang dirujuk kolom.
      for (const request of parsed.imageRequests) {
        const row = parsed.rows.find((entry) => entry.rowNumber === request.rowNumber);
        if (!row?.payload) continue;

        request.stemFiles.forEach((name, index) => {
          const asset = zipImages.get(name.toLowerCase());
          if (!asset) {
            row.warnings.push(`Gambar stem "${name}" tidak ada di ZIP`);
            return;
          }
          row.payload!.media.push({
            mediaAssetId: asset.mediaAssetId,
            role: 'STEM',
            sortOrder: index,
          });
        });

        for (const [label, name] of Object.entries(request.optionFiles)) {
          const asset = zipImages.get(name.toLowerCase());
          if (!asset) {
            row.warnings.push(`Gambar opsi ${label} "${name}" tidak ada di ZIP`);
            continue;
          }
          row.payload.media.push({
            mediaAssetId: asset.mediaAssetId,
            role: 'OPTION',
            optionLabel: label,
            sortOrder: 0,
          });
        }

        if (row.payload.media.length > 0) {
          row.issues = row.issues.filter((issue) => !issue.includes('gambar'));
        }
      }

      return {
        rows: parsed.rows,
        warnings: parsed.warnings,
        pageCount: parsed.pageCount,
        imageAssets,
      };
    }

    if (sourceKind === 'PDF') {
      const extraction = await extractPdf(new Uint8Array(file.buffer));
      const parsed = parseDocBlocks({
        sourceKind: 'PDF',
        lines: extraction.lines,
        images: pdfImagesForParser(extraction),
        settings,
        pageCount: extraction.pageCount,
        extractorWarnings: extraction.warnings,
      });

      const imageMap = new Map(extraction.images.map((image) => [image.index, image]));
      await this.storeDocumentImages(imageMap, parsed.rows, imageAssets, actorId);

      return {
        rows: parsed.rows,
        warnings: parsed.warnings,
        pageCount: parsed.pageCount ?? extraction.pageCount,
        imageAssets,
      };
    }

    const extraction = await extractDocx(file.buffer);
    const lines: SourceLine[] = extraction.lines;
    const parsed = parseDocBlocks({
      sourceKind: 'DOCX',
      lines,
      settings,
      pageCount: 0,
      extractorWarnings: extraction.warnings,
    });

    const imageMap = new Map(extraction.images.map((image) => [image.index, image]));
    await this.storeDocumentImages(imageMap, parsed.rows, imageAssets, actorId);

    return {
      rows: parsed.rows,
      warnings: parsed.warnings,
      pageCount: 0,
      imageAssets,
    };
  }

  /**
   * Simpan gambar hasil ekstraksi dokumen sebagai media dan pasang ke baris
   * yang merujuknya. Kegagalan satu gambar tidak menggagalkan seluruh impor.
   */
  private async storeDocumentImages(
    byIndex: Map<number, { index: number; data: Uint8Array; mime: string }>,
    rows: ParsedRow[],
    imageAssets: Map<number, { mediaAssetId: string }>,
    actorId: string,
  ): Promise<void> {
    for (const row of rows) {
      if (!row.payload || !row.imageRefs?.length) continue;

      for (const ref of row.imageRefs.slice(0, 10)) {
        const image = byIndex.get(ref.index);
        if (!image) continue;
        try {
          const stored = await this.media.storeBuffer(Buffer.from(image.data), image.mime, actorId);
          imageAssets.set(ref.index, { mediaAssetId: stored.id });
          row.payload.media.push({
            mediaAssetId: stored.id,
            role: ref.role,
            optionLabel: ref.optionLabel,
            sortOrder: row.payload.media.length,
          });
        } catch (error) {
          row.warnings.push(
            `Gambar ${ref.index + 1} tidak dapat disimpan: ${
              error instanceof Error ? error.message : 'format tidak didukung'
            }`,
          );
        }
      }
    }
  }

  private async readZipImages(
    assets: Express.Multer.File,
    budget: { remaining: number },
    actorId: string,
  ): Promise<Map<string, { mediaAssetId: string }>> {
    const result = new Map<string, { mediaAssetId: string }>();
    const zip = await JSZip.loadAsync(assets.buffer);

    const entries = Object.values(zip.files).filter(
      (entry) => !entry.dir && /\.(png|jpe?g|webp)$/i.test(entry.name),
    );

    for (const entry of entries) {
      if (budget.remaining <= 0) break;
      const name = entry.name.replace(/\\/g, '/').split('/').pop()?.toLowerCase();
      if (!name) continue;

      const data = await entry.async('nodebuffer');
      if (data.byteLength > 5 * 1024 * 1024) continue;

      try {
        const stored = await this.media.storeBuffer(data, mimeFromName(name), actorId);
        result.set(name, { mediaAssetId: stored.id });
        budget.remaining -= 1;
      } catch {
        // Gambar tidak valid dilewati; baris memberi peringatan saat resolusi.
      }
    }

    return result;
  }

  // ------------------------------------------------------------------ helpers

  private async normalizeSettings(input: ImportSettings): Promise<ImportSettings> {
    const stageCode = input.targetStageCode;
    let subtestCode = input.targetSubtestCode;

    if (
      stageCode &&
      subtestCode &&
      SUBTEST_OF_STAGE_HINT[stageCode] &&
      !SUBTEST_OF_STAGE_HINT[stageCode]!.includes(subtestCode)
    ) {
      throw new UnprocessableEntityException({
        code: 'COMMON_VALIDATION_FAILED',
        message: `Subtes ${subtestCode} tidak berada di stage ${stageCode}`,
      });
    }

    if (input.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) {
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Kategori tidak ditemukan',
        });
      }
    }

    if (!subtestCode && stageCode) {
      subtestCode = SUBTEST_OF_STAGE_HINT[stageCode]?.[0];
    }

    return { ...input, targetStageCode: stageCode, targetSubtestCode: subtestCode };
  }

  private async categoryMap(): Promise<Map<string, { id: string }>> {
    const rows = await this.prisma.category.findMany({
      select: { id: true, path: true, name: true },
    });
    const map = new Map<string, { id: string }>();
    for (const row of rows) {
      map.set(row.path.toLowerCase(), { id: row.id });
      map.set(row.name.toLowerCase(), { id: row.id });
    }
    return map;
  }

  private async existingDuplicates(
    hashByRow: Map<number, string>,
    rows: ParsedRow[],
  ): Promise<Map<string, { id: string; publicCode: string }>> {
    const keys = new Set<string>();
    for (const row of rows) {
      const payload = row.payload;
      const hash = hashByRow.get(row.rowNumber);
      if (payload?.stageCode && payload.subtestCode && hash) {
        keys.add(`${payload.stageCode}:${payload.subtestCode}:${hash}`);
      }
    }

    const result = new Map<string, { id: string; publicCode: string }>();
    const all = [...keys];
    for (let offset = 0; offset < all.length; offset += 300) {
      const slice = all.slice(offset, offset + 300);
      const found = await this.prisma.question.findMany({
        where: {
          deletedAt: null,
          OR: slice.map((key) => {
            const [stageCode, subtestCode, dedupeHash] = key.split(':');
            return {
              stageCode: stageCode as never,
              subtestCode: subtestCode as never,
              dedupeHash,
            };
          }),
        },
        select: {
          id: true,
          publicCode: true,
          stageCode: true,
          subtestCode: true,
          dedupeHash: true,
        },
      });
      for (const row of found) {
        result.set(`${row.stageCode}:${row.subtestCode}:${row.dedupeHash}`, {
          id: row.id,
          publicCode: row.publicCode,
        });
      }
    }
    return result;
  }

  private async findDuplicate(
    stageCode: string,
    subtestCode: string,
    hash: string,
    excludeQuestionId?: string,
  ): Promise<{ id: string; publicCode: string } | null> {
    const row = await this.prisma.question.findFirst({
      where: {
        stageCode: stageCode as never,
        subtestCode: subtestCode as never,
        dedupeHash: hash,
        deletedAt: null,
        ...(excludeQuestionId ? { id: { not: excludeQuestionId } } : {}),
      },
      select: { id: true, publicCode: true },
    });
    return row;
  }

  private async refreshStats(jobId: string): Promise<ImportJobStats> {
    const groups = await this.prisma.importJobItem.groupBy({
      by: ['status'],
      where: { jobId },
      _count: { _all: true },
    });
    const stats: ImportJobStats = {
      ...EMPTY_STATS,
      total: groups.reduce((sum, group) => sum + group._count._all, 0),
    };
    for (const group of groups) {
      switch (group.status) {
        case 'VALID':
          stats.valid = group._count._all;
          break;
        case 'INVALID':
          stats.invalid = group._count._all;
          break;
        case 'DUPLICATE':
          stats.duplicate = group._count._all;
          break;
        case 'IMPORTED':
          stats.imported = group._count._all;
          break;
        case 'SKIPPED':
          stats.skipped = group._count._all;
          break;
      }
    }
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { stats: stats as never, processedRows: stats.total },
    });
    return stats;
  }

  private async requireJob(id: string, actor?: { id: string; role?: Role }) {
    const job = await this.prisma.importJob.findFirst({
      where: {
        id,
        // ADMIN hanya boleh menyentuh job miliknya; SUPER_ADMIN melihat semua.
        ...(actor?.role && actor.role !== 'SUPER_ADMIN' ? { adminId: actor.id } : {}),
      },
      include: { admin: { select: { email: true } } },
    });
    if (!job) throw this.notFound();
    return job;
  }

  private mapJob(row: {
    id: string;
    adminId: string;
    admin?: { email: string } | null;
    sourceKind: string;
    status: string;
    originalName: string;
    mime: string;
    sizeBytes: number;
    totalRows: number;
    processedRows: number;
    stats: unknown;
    warnings: unknown;
    createdAt: Date;
    finishedAt: Date | null;
  }): ImportJobView {
    return {
      id: row.id,
      adminId: row.adminId,
      adminEmail: row.admin?.email ?? null,
      sourceKind: row.sourceKind as ImportSourceKind,
      status: row.status as ImportJobView['status'],
      originalName: row.originalName,
      mime: row.mime,
      sizeBytes: row.sizeBytes,
      totalRows: row.totalRows,
      processedRows: row.processedRows,
      stats: statsOf(row.stats),
      warnings: Array.isArray(row.warnings) ? (row.warnings as string[]) : [],
      createdAt: row.createdAt.toISOString(),
      finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
    };
  }

  private mapItem(row: {
    id: string;
    rowNumber: number;
    status: string;
    confidence: Prisma.Decimal | number | null;
    payload: unknown;
    rawText: string | null;
    issues: unknown;
    questionId: string | null;
  }): ImportItemView {
    return {
      id: row.id,
      rowNumber: row.rowNumber,
      status: row.status as ImportItemStatus,
      confidence: row.confidence === null ? null : Number(row.confidence),
      payload: (row.payload as ImportQuestionPayload | null) ?? null,
      rawText: row.rawText,
      issues: Array.isArray(row.issues) ? (row.issues as string[]) : [],
      questionId: row.questionId,
    };
  }

  private notFound() {
    return new NotFoundException({
      code: 'IMPORT_JOB_NOT_FOUND',
      message: 'Job impor tidak ditemukan',
    });
  }
}

/* ------------------------------------------------------------------ helpers */

function statsOf(value: unknown): ImportJobStats {
  const record = (value ?? {}) as Partial<ImportJobStats>;
  return {
    total: Number(record.total ?? 0),
    valid: Number(record.valid ?? 0),
    invalid: Number(record.invalid ?? 0),
    duplicate: Number(record.duplicate ?? 0),
    imported: Number(record.imported ?? 0),
    skipped: Number(record.skipped ?? 0),
  };
}

function countStats(statuses: ImportItemStatus[]): ImportJobStats {
  const stats: ImportJobStats = { ...EMPTY_STATS, total: statuses.length };
  for (const status of statuses) {
    switch (status) {
      case 'VALID':
        stats.valid += 1;
        break;
      case 'INVALID':
        stats.invalid += 1;
        break;
      case 'DUPLICATE':
        stats.duplicate += 1;
        break;
      case 'IMPORTED':
        stats.imported += 1;
        break;
      case 'SKIPPED':
        stats.skipped += 1;
        break;
    }
  }
  return stats;
}

function resolveCategory(
  path: string | undefined,
  map: Map<string, { id: string }>,
): { id: string } | null {
  if (!path) return null;
  const normalized = path
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');
  return map.get(normalized) ?? map.get(normalized.split('/').pop() ?? '') ?? null;
}

function detectMime(file: Express.Multer.File): string {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.csv')) return 'text/csv';
  if (name.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (name.endsWith('.zip')) return 'application/zip';
  return file.mimetype;
}

function sourceKindFor(mime: string, filename: string): ImportSourceKind | null {
  if (SPREADSHEET_MIMES.includes(mime)) return 'SPREADSHEET';
  const lower = filename.toLowerCase();
  // Deteksi lewat ekstensi juga: sebagian browser mengirim DOCX/PDF sebagai
  // `application/octet-stream`.
  if (mime === 'application/pdf' || lower.endsWith('.pdf')) return 'PDF';
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return 'DOCX';
  }
  if (lower.endsWith('.csv')) return 'SPREADSHEET';
  return null;
}

export function isZip(mime: string, filename: string): boolean {
  return ZIP_MIMES.includes(mime) || filename.toLowerCase().endsWith('.zip');
}

function mimeFromName(name: string): string {
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function sanitize(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 120);
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

function errorCodeFor(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { code?: string } }).response;
    if (response?.code) return response.code;
  }
  return 'IMPORT_ITEM_FAILED';
}

function errorMessageFor(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { message?: string } }).response;
    if (response?.message) return response.message;
    if ((error as Error).message) return (error as Error).message;
  }
  return 'Baris gagal diimpor';
}
