import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  decodeCursor,
  encodeCursor,
  questionShapeIssues,
  type BulkQuestionActionInput,
  type BulkQuestionActionResult,
  type QuestionCreateInput,
  type QuestionListQuery,
  type QuestionListResponse,
  type QuestionListItem,
  type QuestionMediaView,
  type QuestionPreviewResult,
  type QuestionShapeInput,
  type QuestionStatsItem,
  type QuestionStatsResponse,
  type QuestionUpdateInput,
  type QuestionView,
  type StageCode,
  type SubtestCode,
} from '@webcat/contracts';
import { AppConfigService } from '../../core/config/config.service';
import { STORAGE } from '../../core/ports/ports.module';
import type { StoragePort } from '@webcat/contracts';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { buildMediaUrl } from '../media/media-signature';
import { computeDedupeHash } from './dedupe';

interface Actor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

interface CreateInternal {
  sourceImportId?: string;
  status?: 'DRAFT' | 'REVIEW';
  skipAudit?: boolean;
}

export interface ImportBatchItem {
  itemId: string;
  input: QuestionCreateInput;
}

export interface ImportBatchResult {
  created: Array<{ itemId: string; questionId: string }>;
  failed: Array<{ itemId: string; code: string; message: string }>;
}

const IMPORT_BULK_CHUNK = 200;

const QUESTION_INCLUDE = {
  category: true,
  options: {
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    include: {
      media: { include: { mediaAsset: true, option: true }, orderBy: { sortOrder: 'asc' } },
    },
  },
  media: {
    include: { mediaAsset: true, option: true },
    orderBy: { sortOrder: 'asc' },
  },
  tags: { include: { tag: true } },
} satisfies Prisma.QuestionInclude;

type QuestionRow = Prisma.QuestionGetPayload<{ include: typeof QUESTION_INCLUDE }>;

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    @Inject(STORAGE) private readonly storage: StoragePort,
  ) {}

  // ------------------------------------------------------------------ reads

  async list(query: QuestionListQuery): Promise<QuestionListResponse> {
    const where: Prisma.QuestionWhereInput = { deletedAt: null };

    if (query.stageCode) where.stageCode = query.stageCode;
    if (query.subtestCode) where.subtestCode = query.subtestCode;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.tag) where.tags = { some: { tag: { name: query.tag } } };
    if (query.hasMedia !== undefined) {
      where.media = query.hasMedia ? { some: {} } : { none: {} };
    }
    if (query.q) {
      where.OR = [
        { stemText: { contains: query.q, mode: 'insensitive' } },
        { publicCode: { contains: query.q, mode: 'insensitive' } },
        { explanation: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.cursor) {
      const cursor = decodeCursor<{ t: string; i: string }>(query.cursor);
      const updatedAt = new Date(cursor.t);
      where.AND = [
        {
          OR: [{ updatedAt: { lt: updatedAt } }, { updatedAt, id: { lt: cursor.i } }],
        },
      ];
    }

    const rows = await this.prisma.question.findMany({
      where,
      include: {
        category: { select: { name: true } },
        _count: { select: { options: true, media: true } },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const last = page[page.length - 1];

    const items: QuestionListItem[] = page.map((row) => ({
      id: row.id,
      publicCode: row.publicCode,
      stageCode: row.stageCode,
      subtestCode: row.subtestCode,
      type: row.type,
      status: row.status,
      difficulty: row.difficulty,
      stemPreview: row.stemText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180),
      categoryName: row.category?.name ?? null,
      optionsCount: row._count.options,
      mediaCount: row._count.media,
      updatedAt: row.updatedAt.toISOString(),
    }));

    return {
      rows: items,
      nextCursor:
        hasMore && last
          ? encodeCursor({ t: last.updatedAt.toISOString(), i: last.id })
          : null,
      hasMore,
    };
  }

  async getById(id: string): Promise<QuestionView> {
    const row = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: QUESTION_INCLUDE,
    });
    if (!row) throw this.notFound();
    return this.mapQuestion(row);
  }

  async preview(input: QuestionCreateInput): Promise<QuestionPreviewResult> {
    const issues = questionShapeIssues(input);
    const dedupeHash = computeDedupeHash(input.stemText, input.options);
    const duplicate = await this.prisma.question.findFirst({
      where: {
        stageCode: input.stageCode,
        subtestCode: input.subtestCode,
        dedupeHash,
        deletedAt: null,
      },
      select: { id: true },
    });

    return {
      valid: issues.length === 0,
      issues,
      dedupeHash,
      duplicate: Boolean(duplicate),
      duplicateQuestionId: duplicate?.id ?? null,
    };
  }

  private statsCache: { data: QuestionStatsResponse; expiresAt: number } | null = null;

  async stats(): Promise<QuestionStatsResponse> {
    if (this.statsCache && this.statsCache.expiresAt > Date.now()) {
      return this.statsCache.data;
    }
    const [subtests, groups] = await Promise.all([
      this.prisma.subtest.findMany({ include: { stage: true } }),
      this.prisma.question.groupBy({
        by: ['subtestCode', 'status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const counts = new Map<string, number>();
    for (const group of groups) {
      counts.set(`${group.subtestCode}:${group.status}`, group._count._all);
    }

    const items: QuestionStatsItem[] = subtests
      .slice()
      .sort(
        (a, b) =>
          a.stage.orderIndex - b.stage.orderIndex ||
          a.orderIndex - b.orderIndex ||
          a.code.localeCompare(b.code),
      )
      .map((subtest) => {
        const published = counts.get(`${subtest.code}:PUBLISHED`) ?? 0;
        const draft = counts.get(`${subtest.code}:DRAFT`) ?? 0;
        const review = counts.get(`${subtest.code}:REVIEW`) ?? 0;
        const archived = counts.get(`${subtest.code}:ARCHIVED`) ?? 0;
        return {
          stageCode: subtest.stage.code as StageCode,
          subtestCode: subtest.code as SubtestCode,
          subtestName: subtest.name,
          required: subtest.questionCount,
          published,
          draft,
          review,
          archived,
          ready: published >= subtest.questionCount,
          shortage: Math.max(0, subtest.questionCount - published),
        };
      });

    return {
      generatedAt: new Date().toISOString(),
      items,
      totals: {
        required: items.reduce((sum, item) => sum + item.required, 0),
        published: items.reduce((sum, item) => sum + item.published, 0),
        readySubtests: items.filter((item) => item.ready).length,
        totalSubtests: items.length,
      },
    };
  }

  // ------------------------------------------------------------------ writes

  async create(
    input: QuestionCreateInput,
    actor: Actor,
    internal: CreateInternal = {},
  ): Promise<QuestionView> {
    const normalized = this.normalize(input);
    const issues = questionShapeIssues(normalized);
    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Bentuk soal tidak valid',
        details: issues,
      });
    }

    await this.assertCategory(normalized.categoryId);
    await this.assertMediaAssets(normalized.media.map((media) => media.mediaAssetId));

    const dedupeHash = computeDedupeHash(normalized.stemText, normalized.options);
    const duplicate = await this.prisma.question.findFirst({
      where: {
        stageCode: normalized.stageCode,
        subtestCode: normalized.subtestCode,
        dedupeHash,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (duplicate && !normalized.dedupeOverride) {
      throw new ConflictException({
        code: 'QUESTION_DUPLICATE',
        message: 'Soal dengan isi yang sama sudah ada di subtes ini',
        details: { questionId: duplicate.id },
      });
    }

    const publicCode =
      normalized.publicCode ?? (await this.uniquePublicCode(normalized.stageCode, normalized.subtestCode));

    const questionId = await this.prisma.$transaction(async (tx) => {
      const tagRows = await this.upsertTags(tx, normalized.tags);
      const question = await tx.question.create({
        data: {
          publicCode,
          stageCode: normalized.stageCode,
          subtestCode: normalized.subtestCode,
          categoryId: normalized.categoryId ?? null,
          type: normalized.type,
          status: internal.status ?? normalized.status,
          difficulty: normalized.difficulty,
          stemText: normalized.stemText,
          stemFormat: normalized.stemFormat,
          explanation: normalized.explanation ?? null,
          scoringStrategy:
            normalized.scoringStrategy ?? defaultScoringStrategy(normalized.type),
          scoringConfig: (normalized.scoringConfig ?? undefined) as never,
          weight: normalized.weight,
          pairGroup: normalized.pairGroup ?? null,
          columnIndex: normalized.columnIndex ?? null,
          dedupeHash,
          dedupeOverride: normalized.dedupeOverride,
          sourceImportId: internal.sourceImportId ?? null,
          options: {
            create: normalized.options.map((option, index) => ({
              label: option.label,
              contentText: option.contentText ?? null,
              isCorrect: option.isCorrect,
              scoreValue: option.scoreValue,
              dimensionMap: (option.dimensionMap ?? undefined) as never,
              sortOrder: option.sortOrder || index,
            })),
          },
          tags: { create: tagRows.map((tag) => ({ tagId: tag.id })) },
        },
      });

      await this.createMediaRows(tx, question.id, normalized);
      return question.id;
    });

    if (!internal.skipAudit) {
      await this.audit.record({
        actorUserId: actor.id,
        action: 'question.created',
        entityType: 'question',
        entityId: questionId,
        metadata: {
          publicCode,
          stageCode: normalized.stageCode,
          subtestCode: normalized.subtestCode,
          type: normalized.type,
          sourceImportId: internal.sourceImportId ?? null,
        },
        ip: actor.ip ?? null,
        userAgent: actor.userAgent ?? null,
      });
    }

    return this.getById(questionId);
  }

  /**
   * Commit impor massal.
   *
   * Berbeda dari `create` per baris, semua validasi target (kategori, media,
   * duplikat) dilakukan sekali untuk satu batch, lalu insert memakai
   * `createMany` berchunk. Ini menjaga target 5.000 baris < 2 menit tanpa
   * mengorbankan aturan bentuk soal.
   */
  async importQuestions(
    rows: Array<{ itemId: string; input: QuestionCreateInput }>,
    options: { status: 'DRAFT' | 'REVIEW'; sourceImportId?: string },
  ): Promise<ImportQuestionResult> {
    const created: ImportQuestionResult['created'] = [];
    const failed: ImportQuestionResult['failed'] = [];
    if (rows.length === 0) return { created, failed };

    // Impor tidak pernah boleh mempublikasikan soal.
    const status = options.status === 'REVIEW' ? 'REVIEW' : 'DRAFT';

    interface Prepared {
      itemId: string;
      id: string;
      normalized: QuestionShapeInput;
      hash: string;
      publicCode: string;
    }

    const prepared: Prepared[] = [];
    const usedCodes = new Set<string>();

    for (const row of rows) {
      const normalized = this.normalize({ ...row.input, status });
      const issues = questionShapeIssues(normalized);
      if (issues.length > 0) {
        failed.push({
          itemId: row.itemId,
          code: 'COMMON_VALIDATION_FAILED',
          message: issues.join('; '),
        });
        continue;
      }

      let publicCode = normalized.publicCode;
      if (!publicCode || usedCodes.has(publicCode)) {
        publicCode = this.generatedPublicCode(normalized.stageCode, normalized.subtestCode);
      }
      usedCodes.add(publicCode);

      prepared.push({
        itemId: row.itemId,
        id: randomUUID(),
        normalized,
        hash: computeDedupeHash(normalized.stemText, normalized.options),
        publicCode,
      });
    }

    if (prepared.length === 0) return { created, failed };

    // ---- validasi kategori & media sekali per batch
    const categoryIds = [
      ...new Set(
        prepared
          .map((row) => row.normalized.categoryId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (categoryIds.length > 0) {
      const found = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      });
      const valid = new Set(found.map((row) => row.id));
      const missing = new Set(categoryIds.filter((id) => !valid.has(id)));
      for (let index = prepared.length - 1; index >= 0; index -= 1) {
        const row = prepared[index]!;
        if (row.normalized.categoryId && missing.has(row.normalized.categoryId)) {
          failed.push({
            itemId: row.itemId,
            code: 'CATEGORY_NOT_FOUND',
            message: 'Kategori tidak ditemukan',
          });
          prepared.splice(index, 1);
        }
      }
    }

    const mediaIds = [
      ...new Set(prepared.flatMap((row) => row.normalized.media.map((m) => m.mediaAssetId))),
    ];
    if (mediaIds.length > 0) {
      const found = await this.prisma.mediaAsset.findMany({
        where: { id: { in: mediaIds } },
        select: { id: true },
      });
      const valid = new Set(found.map((row) => row.id));
      for (let index = prepared.length - 1; index >= 0; index -= 1) {
        const row = prepared[index]!;
        if (row.normalized.media.some((media) => !valid.has(media.mediaAssetId))) {
          failed.push({
            itemId: row.itemId,
            code: 'MEDIA_NOT_FOUND',
            message: 'Salah satu media tidak ditemukan',
          });
          prepared.splice(index, 1);
        }
      }
    }

    // ---- duplikat: satu query untuk seluruh batch
    const keys = [
      ...new Set(
        prepared.map((row) => `${row.normalized.stageCode}:${row.normalized.subtestCode}:${row.hash}`),
      ),
    ];
    const existing = new Map<string, { id: string; publicCode: string }>();
    for (const chunk of chunked(keys, 300)) {
      const found = await this.prisma.question.findMany({
        where: {
          deletedAt: null,
          OR: chunk.map((key) => {
            const [stageCode, subtestCode, dedupeHash] = key.split(':');
            return {
              stageCode: stageCode as StageCode,
              subtestCode: subtestCode as SubtestCode,
              dedupeHash,
            };
          }),
        },
        select: { id: true, publicCode: true, stageCode: true, subtestCode: true, dedupeHash: true },
      });
      for (const row of found) {
        existing.set(`${row.stageCode}:${row.subtestCode}:${row.dedupeHash}`, {
          id: row.id,
          publicCode: row.publicCode,
        });
      }
    }

    const seenInBatch = new Map<string, string>();
    for (let index = prepared.length - 1; index >= 0; index -= 1) {
      const row = prepared[index]!;
      const key = `${row.normalized.stageCode}:${row.normalized.subtestCode}:${row.hash}`;
      if (seenInBatch.has(key) && !row.normalized.dedupeOverride) {
        failed.push({
          itemId: row.itemId,
          code: 'QUESTION_DUPLICATE',
          message: `Duplikat dalam berkas impor`,
        });
        prepared.splice(index, 1);
        continue;
      }
      const duplicate = existing.get(key);
      if (duplicate && !row.normalized.dedupeOverride) {
        failed.push({
          itemId: row.itemId,
          code: 'QUESTION_DUPLICATE',
          message: `Sudah ada di bank soal (${duplicate.publicCode})`,
        });
        prepared.splice(index, 1);
        continue;
      }
      seenInBatch.set(key, row.itemId);
    }

    if (prepared.length === 0) return { created, failed };

    // ---- public code: hindari bentrok dengan kode yang sudah ada di DB
    const codes = [...new Set(prepared.map((row) => row.publicCode))];
    const takenCodes = new Set<string>();
    for (const chunk of chunked(codes, 300)) {
      const found = await this.prisma.question.findMany({
        where: { publicCode: { in: chunk } },
        select: { publicCode: true },
      });
      found.forEach((row) => takenCodes.add(row.publicCode));
    }
    if (takenCodes.size > 0) {
      for (const row of prepared) {
        if (takenCodes.has(row.publicCode)) {
          row.publicCode = this.generatedPublicCode(
            row.normalized.stageCode,
            row.normalized.subtestCode,
          );
        }
      }
    }

    // ---- tag: pastikan semua ada, lalu petakan id
    const tagNames = [...new Set(prepared.flatMap((row) => row.normalized.tags))];

    for (const chunk of chunked(prepared, IMPORT_BULK_CHUNK)) {
      await this.prisma.$transaction(async (tx) => {
        if (tagNames.length > 0) {
          await tx.tag.createMany({
            data: tagNames.map((name) => ({ name })),
            skipDuplicates: true,
          });
        }
        const tagRows =
          tagNames.length > 0
            ? await tx.tag.findMany({ where: { name: { in: tagNames } }, select: { id: true, name: true } })
            : [];
        const tagIdByName = new Map(tagRows.map((tag) => [tag.name, tag.id]));

        const optionData: Prisma.QuestionOptionCreateManyInput[] = [];
        const mediaData: Prisma.QuestionMediaCreateManyInput[] = [];
        const tagData: Prisma.QuestionTagCreateManyInput[] = [];

        for (const row of chunk) {
          const optionIdByLabel = new Map<string, string>();
          row.normalized.options.forEach((option, index) => {
            const id = randomUUID();
            optionIdByLabel.set(option.label, id);
            optionData.push({
              id,
              questionId: row.id,
              label: option.label,
              contentText: option.contentText ?? null,
              isCorrect: option.isCorrect,
              scoreValue: option.scoreValue,
              dimensionMap: (option.dimensionMap ?? undefined) as never,
              sortOrder: option.sortOrder || index,
            });
          });

          for (const media of row.normalized.media) {
            mediaData.push({
              questionId: row.id,
              optionId:
                media.role === 'OPTION'
                  ? optionIdByLabel.get(media.optionLabel ?? '') ?? null
                  : null,
              mediaAssetId: media.mediaAssetId,
              role: media.role,
              altText: media.altText ?? null,
              sortOrder: media.sortOrder,
            });
          }

          for (const name of row.normalized.tags) {
            const tagId = tagIdByName.get(name);
            if (tagId) tagData.push({ questionId: row.id, tagId });
          }
        }

        await tx.question.createMany({
          data: chunk.map((row) => ({
            id: row.id,
            publicCode: row.publicCode,
            stageCode: row.normalized.stageCode,
            subtestCode: row.normalized.subtestCode,
            categoryId: row.normalized.categoryId ?? null,
            type: row.normalized.type,
            status,
            difficulty: row.normalized.difficulty,
            stemText: row.normalized.stemText,
            stemFormat: row.normalized.stemFormat,
            explanation: row.normalized.explanation ?? null,
            scoringStrategy:
              row.normalized.scoringStrategy ?? defaultScoringStrategy(row.normalized.type),
            scoringConfig: (row.normalized.scoringConfig ?? undefined) as never,
            weight: row.normalized.weight,
            pairGroup: row.normalized.pairGroup ?? null,
            columnIndex: row.normalized.columnIndex ?? null,
            dedupeHash: row.hash,
            dedupeOverride: row.normalized.dedupeOverride,
            sourceImportId: options.sourceImportId ?? null,
          })),
        });
        if (optionData.length > 0) {
          await tx.questionOption.createMany({ data: optionData });
        }
        if (mediaData.length > 0) {
          await tx.questionMedia.createMany({ data: mediaData, skipDuplicates: true });
        }
        if (tagData.length > 0) {
          await tx.questionTag.createMany({ data: tagData, skipDuplicates: true });
        }
      });

      for (const row of chunk) {
        created.push({ itemId: row.itemId, questionId: row.id });
      }
    }

    return { created, failed };
  }

  /**
   * Jalur cepat untuk commit impor: validasi bentuk tetap dijalankan, tetapi
   * pengecekan duplikat/kategori/media dilakukan sekali di tingkat batch oleh
   * `ImportsService` (sudah divalidasi saat preview). Tidak menulis audit per
   * soal dan tidak membaca kembali seluruh relasi — 5.000 baris tetap di bawah
   * dua menit.
   */
  async createImported(
    input: QuestionCreateInput,
    options: {
      status: 'DRAFT' | 'REVIEW';
      sourceImportId?: string;
      publicCode: string;
    },
  ): Promise<string> {
    const normalized = this.normalize({
      ...input,
      status: options.status,
    });
    const issues = questionShapeIssues(normalized);
    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Bentuk soal tidak valid',
        details: issues,
      });
    }

    const dedupeHash = computeDedupeHash(normalized.stemText, normalized.options);

    return this.prisma.$transaction(async (tx) => {
      const tagRows = await this.upsertTags(tx, normalized.tags);
      const question = await tx.question.create({
        data: {
          publicCode: options.publicCode,
          stageCode: normalized.stageCode,
          subtestCode: normalized.subtestCode,
          categoryId: normalized.categoryId ?? null,
          type: normalized.type,
          status: options.status,
          difficulty: normalized.difficulty,
          stemText: normalized.stemText,
          stemFormat: normalized.stemFormat,
          explanation: normalized.explanation ?? null,
          scoringStrategy:
            normalized.scoringStrategy ?? defaultScoringStrategy(normalized.type),
          scoringConfig: (normalized.scoringConfig ?? undefined) as never,
          weight: normalized.weight,
          pairGroup: normalized.pairGroup ?? null,
          columnIndex: normalized.columnIndex ?? null,
          dedupeHash,
          dedupeOverride: normalized.dedupeOverride,
          sourceImportId: options.sourceImportId ?? null,
          options: {
            create: normalized.options.map((option, index) => ({
              label: option.label,
              contentText: option.contentText ?? null,
              isCorrect: option.isCorrect,
              scoreValue: option.scoreValue,
              dimensionMap: (option.dimensionMap ?? undefined) as never,
              sortOrder: option.sortOrder || index,
            })),
          },
          tags: { create: tagRows.map((tag) => ({ tagId: tag.id })) },
        },
      });

      await this.createMediaRows(tx, question.id, normalized);
      return question.id;
    });
  }

  /** Validasi batch untuk komit impor: kategori & media dicek sekali. */
  async assertImportTargets(
    categoryIds: Array<string | null | undefined>,
    mediaIds: string[],
  ): Promise<void> {
    const uniqueCategories = [...new Set(categoryIds.filter((id): id is string => Boolean(id)))];
    if (uniqueCategories.length > 0) {
      const count = await this.prisma.category.count({ where: { id: { in: uniqueCategories } } });
      if (count !== uniqueCategories.length) {
        throw new NotFoundException({
          code: 'CATEGORY_NOT_FOUND',
          message: 'Salah satu kategori tidak ditemukan',
        });
      }
    }
    await this.assertMediaAssets(mediaIds);
  }

  async update(id: string, input: QuestionUpdateInput, actor: Actor): Promise<QuestionView> {
    const existing = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: QUESTION_INCLUDE,
    });
    if (!existing) throw this.notFound();

    const merged: QuestionShapeInput = {
      publicCode: input.publicCode ?? existing.publicCode,
      stageCode: input.stageCode ?? existing.stageCode,
      subtestCode: input.subtestCode ?? existing.subtestCode,
      categoryId: input.categoryId === undefined ? existing.categoryId : input.categoryId,
      type: input.type ?? existing.type,
      status: input.status ?? existing.status,
      difficulty: input.difficulty ?? existing.difficulty,
      stemText: input.stemText ?? existing.stemText,
      stemFormat: input.stemFormat ?? existing.stemFormat,
      explanation: input.explanation === undefined ? existing.explanation : input.explanation,
      scoringStrategy: input.scoringStrategy ?? existing.scoringStrategy,
      scoringConfig:
        input.scoringConfig === undefined
          ? ((existing.scoringConfig ?? null) as Record<string, unknown> | null)
          : input.scoringConfig,
      weight: input.weight ?? Number(existing.weight),
      pairGroup: input.pairGroup === undefined ? existing.pairGroup : input.pairGroup,
      columnIndex: input.columnIndex === undefined ? existing.columnIndex : input.columnIndex,
      dedupeOverride: input.dedupeOverride ?? existing.dedupeOverride,
      options:
        input.options ??
        existing.options.map((option) => ({
          label: option.label,
          contentText: option.contentText ?? undefined,
          isCorrect: option.isCorrect,
          scoreValue: Number(option.scoreValue),
          dimensionMap:
            (option.dimensionMap as Record<string, number> | null) ?? undefined,
          sortOrder: option.sortOrder,
        })),
      media:
        input.media ??
        existing.media.map((media) => ({
          mediaAssetId: media.mediaAssetId,
          role: media.role,
          optionLabel: media.option?.label ?? undefined,
          altText: media.altText ?? undefined,
          sortOrder: media.sortOrder,
        })),
      tags: input.tags ?? existing.tags.map((tag) => tag.tag.name),
    };

    const normalized = this.normalize(merged);
    const issues = questionShapeIssues(normalized);
    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Bentuk soal tidak valid',
        details: issues,
      });
    }

    await this.assertCategory(normalized.categoryId);
    await this.assertMediaAssets(normalized.media.map((media) => media.mediaAssetId));

    const dedupeHash = computeDedupeHash(normalized.stemText, normalized.options);
    const duplicate = await this.prisma.question.findFirst({
      where: {
        id: { not: id },
        stageCode: normalized.stageCode,
        subtestCode: normalized.subtestCode,
        dedupeHash,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (duplicate && !normalized.dedupeOverride) {
      throw new ConflictException({
        code: 'QUESTION_DUPLICATE',
        message: 'Soal dengan isi yang sama sudah ada di subtes ini',
        details: { questionId: duplicate.id },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          publicCode: normalized.publicCode,
          stageCode: normalized.stageCode,
          subtestCode: normalized.subtestCode,
          categoryId: normalized.categoryId ?? null,
          type: normalized.type,
          status: normalized.status,
          difficulty: normalized.difficulty,
          stemText: normalized.stemText,
          stemFormat: normalized.stemFormat,
          explanation: normalized.explanation ?? null,
          scoringStrategy:
            normalized.scoringStrategy ?? defaultScoringStrategy(normalized.type),
          scoringConfig: (normalized.scoringConfig ?? undefined) as never,
          weight: normalized.weight,
          pairGroup: normalized.pairGroup ?? null,
          columnIndex: normalized.columnIndex ?? null,
          dedupeHash,
          dedupeOverride: normalized.dedupeOverride,
        },
      });

      if (input.options !== undefined) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: normalized.options.map((option, index) => ({
            questionId: id,
            label: option.label,
            contentText: option.contentText ?? null,
            isCorrect: option.isCorrect,
            scoreValue: option.scoreValue,
            dimensionMap: (option.dimensionMap ?? undefined) as never,
            sortOrder: option.sortOrder || index,
          })),
        });
      }

      if (input.options !== undefined || input.media !== undefined) {
        await tx.questionMedia.deleteMany({ where: { questionId: id } });
        await this.createMediaRows(tx, id, normalized);
      }

      if (input.tags !== undefined) {
        await tx.questionTag.deleteMany({ where: { questionId: id } });
        const tagRows = await this.upsertTags(tx, normalized.tags);
        if (tagRows.length > 0) {
          await tx.questionTag.createMany({
            data: tagRows.map((tag) => ({ questionId: id, tagId: tag.id })),
          });
        }
      }
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'question.updated',
      entityType: 'question',
      entityId: id,
      metadata: { publicCode: normalized.publicCode, fields: Object.keys(input) },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.getById(id);
  }

  async publish(id: string, actor: Actor): Promise<QuestionView> {
    const existing = await this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: QUESTION_INCLUDE,
    });
    if (!existing) throw this.notFound();

    const shape = this.toShape(existing);
    const issues = questionShapeIssues(shape);
    if (issues.length > 0) {
      throw new UnprocessableEntityException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Soal belum memenuhi syarat publikasi',
        details: issues,
      });
    }

    await this.prisma.question.update({ where: { id }, data: { status: 'PUBLISHED' } });
    await this.audit.record({
      actorUserId: actor.id,
      action: 'question.published',
      entityType: 'question',
      entityId: id,
      metadata: { publicCode: existing.publicCode },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.getById(id);
  }

  async bulkAction(
    input: BulkQuestionActionInput,
    actor: Actor,
  ): Promise<BulkQuestionActionResult> {
    const rows = await this.prisma.question.findMany({
      where: { id: { in: input.ids } },
      include: QUESTION_INCLUDE,
    });

    let affected = 0;

    switch (input.action) {
      case 'PUBLISH': {
        const publishable = rows.filter(
          (row) =>
            row.deletedAt === null &&
            (row.status === 'DRAFT' || row.status === 'REVIEW') &&
            questionShapeIssues(this.toShape(row)).length === 0,
        );
        if (publishable.length > 0) {
          const result = await this.prisma.question.updateMany({
            where: { id: { in: publishable.map((row) => row.id) } },
            data: { status: 'PUBLISHED' },
          });
          affected = result.count;
        }
        break;
      }
      case 'ARCHIVE': {
        const result = await this.prisma.question.updateMany({
          where: { id: { in: input.ids }, deletedAt: null },
          data: { status: 'ARCHIVED' },
        });
        affected = result.count;
        break;
      }
      case 'DELETE': {
        const result = await this.prisma.question.updateMany({
          where: { id: { in: input.ids }, deletedAt: null },
          data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
        affected = result.count;
        break;
      }
      case 'RESTORE': {
        const result = await this.prisma.question.updateMany({
          where: { id: { in: input.ids } },
          data: { deletedAt: null, status: 'DRAFT' },
        });
        affected = result.count;
        break;
      }
    }

    await this.audit.record({
      actorUserId: actor.id,
      action: `question.bulk_${input.action.toLowerCase()}`,
      entityType: 'question',
      entityId: input.ids[0] ?? 'batch',
      metadata: { requested: input.ids.length, affected, reason: input.reason ?? null },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { affected, action: input.action };
  }

  async remove(id: string, actor: Actor): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.question.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw this.notFound();

    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'question.deleted',
      entityType: 'question',
      entityId: id,
      metadata: { publicCode: existing.publicCode },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { deleted: true };
  }

  async attachMedia(
    questionId: string,
    input: { mediaAssetId: string; role: 'STEM' | 'OPTION' | 'EXPLANATION'; optionLabel?: string; altText?: string; sortOrder: number },
    actor: Actor,
  ): Promise<QuestionView> {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, deletedAt: null },
      include: { options: true },
    });
    if (!question) throw this.notFound();
    await this.assertMediaAssets([input.mediaAssetId]);

    let optionId: string | null = null;
    if (input.role === 'OPTION') {
      if (!input.optionLabel) {
        throw new ConflictException({
          code: 'COMMON_VALIDATION_FAILED',
          message: 'Media opsi wajib menyebut label opsi',
        });
      }
      const option = question.options.find((row) => row.label === input.optionLabel);
      if (!option) {
        throw new NotFoundException({
          code: 'COMMON_NOT_FOUND',
          message: `Opsi ${input.optionLabel} tidak ditemukan`,
        });
      }
      optionId = option.id;
    }

    await this.prisma.questionMedia.create({
      data: {
        questionId,
        optionId,
        mediaAssetId: input.mediaAssetId,
        role: input.role,
        altText: input.altText ?? null,
        sortOrder: input.sortOrder,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'question.media_attached',
      entityType: 'question',
      entityId: questionId,
      metadata: { mediaAssetId: input.mediaAssetId, role: input.role },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.getById(questionId);
  }

  async detachMedia(questionId: string, mediaId: string, actor: Actor): Promise<QuestionView> {
    const media = await this.prisma.questionMedia.findFirst({
      where: { id: mediaId, questionId },
    });
    if (!media) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Media tidak terpasang pada soal ini',
      });
    }

    await this.prisma.questionMedia.delete({ where: { id: mediaId } });
    await this.audit.record({
      actorUserId: actor.id,
      action: 'question.media_detached',
      entityType: 'question',
      entityId: questionId,
      metadata: { mediaId },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.getById(questionId);
  }

  // ------------------------------------------------------------------ helpers

  private normalize(input: QuestionShapeInput): QuestionShapeInput {
    return {
      ...input,
      options: [...input.options]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
        .map((option, index) => ({ ...option, sortOrder: option.sortOrder || index })),
      media: [...input.media].sort((a, b) => a.sortOrder - b.sortOrder),
      tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))],
    };
  }

  private toShape(row: QuestionRow): QuestionShapeInput {
    return {
      publicCode: row.publicCode,
      stageCode: row.stageCode,
      subtestCode: row.subtestCode,
      categoryId: row.categoryId,
      type: row.type,
      status: row.status,
      difficulty: row.difficulty,
      stemText: row.stemText,
      stemFormat: row.stemFormat,
      explanation: row.explanation,
      scoringStrategy: row.scoringStrategy,
      scoringConfig: (row.scoringConfig ?? null) as Record<string, unknown> | null,
      weight: Number(row.weight),
      pairGroup: row.pairGroup,
      columnIndex: row.columnIndex,
      dedupeOverride: row.dedupeOverride,
      options: row.options.map((option) => ({
        label: option.label,
        contentText: option.contentText ?? undefined,
        isCorrect: option.isCorrect,
        scoreValue: Number(option.scoreValue),
        dimensionMap: (option.dimensionMap as Record<string, number> | null) ?? undefined,
        sortOrder: option.sortOrder,
      })),
      media: row.media.map((media) => ({
        mediaAssetId: media.mediaAssetId,
        role: media.role,
        optionLabel: media.option?.label ?? undefined,
        altText: media.altText ?? undefined,
        sortOrder: media.sortOrder,
      })),
      tags: row.tags.map((tag) => tag.tag.name),
    };
  }

  private async mapQuestion(row: QuestionRow): Promise<QuestionView> {
    const urlCache = new Map<string, string>();
    const mediaUrl = async (media: QuestionRow['media'][number]): Promise<string> => {
      const cached = urlCache.get(media.mediaAsset.id);
      if (cached) return cached;
      const url = media.mediaAsset.data
        ? buildMediaUrl(media.mediaAsset.id, this.config.value.JWT_ACCESS_SECRET)
        : await this.storage.createSignedUrl(media.mediaAsset.storagePath, 1800);
      urlCache.set(media.mediaAsset.id, url);
      return url;
    };

    const mapMedia = async (
      media: QuestionRow['media'][number],
    ): Promise<QuestionMediaView> => ({
      id: media.id,
      mediaAssetId: media.mediaAssetId,
      role: media.role,
      optionLabel: media.option?.label ?? null,
      altText: media.altText,
      sortOrder: media.sortOrder,
      url: await mediaUrl(media),
      mime: media.mediaAsset.mime,
      width: media.mediaAsset.width,
      height: media.mediaAsset.height,
    });

    const options = await Promise.all(
      row.options.map(async (option) => ({
        id: option.id,
        label: option.label,
        contentText: option.contentText,
        isCorrect: option.isCorrect,
        scoreValue: Number(option.scoreValue),
        dimensionMap: (option.dimensionMap ?? null) as Record<string, number> | null,
        sortOrder: option.sortOrder,
        media: await Promise.all(option.media.map((media) => mapMedia(media))),
      })),
    );

    return {
      id: row.id,
      publicCode: row.publicCode,
      stageCode: row.stageCode,
      subtestCode: row.subtestCode,
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
      type: row.type,
      status: row.status,
      difficulty: row.difficulty,
      stemText: row.stemText,
      stemFormat: row.stemFormat,
      explanation: row.explanation,
      scoringStrategy: row.scoringStrategy,
      scoringConfig: (row.scoringConfig ?? null) as Record<string, unknown> | null,
      weight: Number(row.weight),
      pairGroup: row.pairGroup,
      columnIndex: row.columnIndex,
      dedupeHash: row.dedupeHash,
      dedupeOverride: row.dedupeOverride,
      sourceImportId: (row as { sourceImportId?: string | null }).sourceImportId ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      options,
      media: await Promise.all(row.media.filter((media) => media.optionId === null).map(mapMedia)),
      tags: row.tags.map((tag) => tag.tag.name),
    };
  }

  private async createMediaRows(
    tx: Prisma.TransactionClient,
    questionId: string,
    input: QuestionShapeInput,
  ): Promise<void> {
    if (input.media.length === 0) return;

    const options = await tx.questionOption.findMany({
      where: { questionId },
      select: { id: true, label: true },
    });
    const byLabel = new Map(options.map((option) => [option.label, option.id]));

    const rows = input.media.map((media) => {
      const optionId = media.role === 'OPTION' ? byLabel.get(media.optionLabel ?? '') : undefined;
      return {
        questionId,
        optionId: optionId ?? null,
        mediaAssetId: media.mediaAssetId,
        role: media.role,
        altText: media.altText ?? null,
        sortOrder: media.sortOrder,
      };
    });

    await tx.questionMedia.createMany({ data: rows, skipDuplicates: true });
  }

  private async upsertTags(
    tx: Prisma.TransactionClient,
    names: string[],
  ): Promise<Array<{ id: string }>> {
    const rows: Array<{ id: string }> = [];
    for (const name of names) {
      const tag = await tx.tag.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true },
      });
      rows.push(tag);
    }
    return rows;
  }

  private async assertCategory(categoryId: string | null | undefined): Promise<void> {
    if (!categoryId) return;
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori tidak ditemukan',
      });
    }
  }

  private async assertMediaAssets(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const unique = [...new Set(ids)];
    const count = await this.prisma.mediaAsset.count({ where: { id: { in: unique } } });
    if (count !== unique.length) {
      throw new NotFoundException({
        code: 'MEDIA_NOT_FOUND',
        message: 'Salah satu media tidak ditemukan',
      });
    }
  }

  private async uniquePublicCode(
    stageCode: StageCode,
    subtestCode: SubtestCode,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.generatedPublicCode(stageCode, subtestCode);
      const exists = await this.prisma.question.findUnique({
        where: { publicCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    return `Q-${Date.now().toString(36).toUpperCase()}`;
  }

  private generatedPublicCode(stageCode: StageCode, subtestCode: SubtestCode): string {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
    return `Q-${stageCode}-${subtestCode}-${suffix}`.slice(0, 60);
  }
  private notFound() {
    return new NotFoundException({
      code: 'QUESTION_NOT_FOUND',
      message: 'Soal tidak ditemukan',
    });
  }
}

export interface ImportQuestionResult {
  created: Array<{ itemId: string; questionId: string }>;
  failed: Array<{ itemId: string; code: string; message: string }>;
}

function chunked<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function defaultScoringStrategy(type: QuestionShapeInput['type']): string {
  switch (type) {
    case 'MULTI_CHOICE':
      return 'MULTI_CORRECT_PARTIAL';
    case 'LIKERT_STATEMENT':
      return 'DIMENSION_PROFILE';
    case 'MISSING_ELEMENT':
      return 'CORRECT_MINUS_PENALTY';
    case 'PASS_HAND_COLUMN':
      return 'PASS_HAND_METRIC';
    default:
      return 'KEYED_CORRECT';
  }
}
