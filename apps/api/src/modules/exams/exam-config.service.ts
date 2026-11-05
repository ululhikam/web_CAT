import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateSubtestInput,
  ExamSettingsView,
  StagePlan,
  SubtestPlan,
  UpdateExamSettingsInput,
  UpdateExamStageInput,
  UpdateSubtestInput,
  ViolationPolicy,
} from '@webcat/contracts';
import { AppError } from '../../core/http/app-error';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  DEFAULT_GRACE_LONG_MS,
  DEFAULT_GRACE_SHORT_MS,
  DEFAULT_MAX_SESSIONS_PER_DAY,
  DEFAULT_STAGES,
  DEFAULT_SUBTEST_TRANSITION,
  DEFAULT_TIMEZONE,
  DEFAULT_TOTAL_PASSING_SCORE,
  DEFAULT_VIOLATION_POLICY,
} from './exam-defaults';
import type { SessionConfigSnapshot, StageConfigSnapshot, SubtestConfigSnapshot } from './types';
import { decimalToNumber, parseViolationPolicy } from './exam-snapshot';

export interface ActorContext {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

interface StageRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  orderIndex: number;
  weight: unknown;
  passingScore: unknown;
  eliminationEnabled: boolean;
  isActive: boolean;
  subtests: SubtestRow[];
}

interface SubtestRow {
  id: string;
  stageId: string;
  code: string;
  name: string;
  orderIndex: number;
  questionCount: number;
  durationMinutes: number;
  weight: unknown;
  passingScore: unknown;
  eliminationEnabled: boolean;
  scoringStrategy: string;
  scoringConfig: unknown;
  isActive: boolean;
}

const STAGE_INCLUDE = {
  subtests: { orderBy: { orderIndex: 'asc' as const } },
};

@Injectable()
export class ExamConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /* ------------------------------------------------------------------ baca */

  private async loadSettingRow() {
    try {
      return await this.prisma.examSetting.findUnique({ where: { id: 'singleton' } });
    } catch {
      return null;
    }
  }

  private async loadStageRows(includeInactive: boolean): Promise<StageRow[]> {
    try {
      return (await this.prisma.examStage.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { orderIndex: 'asc' },
        include: {
          subtests: {
            where: includeInactive ? {} : { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      })) as unknown as StageRow[];
    } catch {
      return [];
    }
  }

  /** Pengaturan efektif (DB bila ada, fallback default seed). */
  async getSettings(): Promise<ExamSettingsView> {
    const row = await this.loadSettingRow();
    if (!row) {
      return {
        timezone: DEFAULT_TIMEZONE,
        totalPassingScore: DEFAULT_TOTAL_PASSING_SCORE,
        maxSessionsPerDay: DEFAULT_MAX_SESSIONS_PER_DAY,
        gracePeriodShortMs: DEFAULT_GRACE_SHORT_MS,
        gracePeriodLongMs: DEFAULT_GRACE_LONG_MS,
        subtestTransition: DEFAULT_SUBTEST_TRANSITION,
        violationPolicy: DEFAULT_VIOLATION_POLICY,
        updatedAt: new Date(0).toISOString(),
      };
    }

    return {
      timezone: row.timezone,
      totalPassingScore: decimalToNumber(row.totalPassingScore) ?? DEFAULT_TOTAL_PASSING_SCORE,
      maxSessionsPerDay: row.maxSessionsPerDay,
      gracePeriodShortMs: row.gracePeriodShortMs,
      gracePeriodLongMs: row.gracePeriodLongMs,
      subtestTransition: row.subtestTransition === 'immediate' ? 'immediate' : 'on_open',
      violationPolicy: parseViolationPolicy(row.violationPolicy),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Stage aktif untuk sesi baru. */
  async getSessionStages(): Promise<StageConfigSnapshot[]> {
    const rows = await this.loadStageRows(false);
    return rows.length > 0 ? rows.map((row) => this.toStageSnapshot(row)) : DEFAULT_STAGES;
  }

  /** Konfigurasi admin: termasuk stage/subtes nonaktif. */
  async getAdminStages(): Promise<StagePlan[]> {
    const rows = await this.loadStageRows(true);
    return rows.length > 0 ? rows.map((row) => this.toStagePlan(row)) : defaultStagePlans();
  }

  async getAdminSubtests(): Promise<SubtestPlan[]> {
    const stages = await this.getAdminStages();
    return stages.flatMap((stage) => stage.subtests);
  }

  /**
   * Snapshot konfigurasi sesi. Dipakai `startSession`; memakai baris DB yang
   * sudah pasti ada (bila kosong, sesi tidak dapat dimulai).
   */
  async requireSessionSnapshot(now = new Date()): Promise<SessionConfigSnapshot> {
    const rows = await this.loadStageRows(false);
    if (rows.length === 0) {
      throw new AppError({
        code: 'COMMON_CONFLICT',
        status: 409,
        message: 'Konfigurasi ujian belum tersedia. Jalankan seed terlebih dahulu.',
      });
    }

    const stages = rows.map((row) => this.toStageSnapshot(row));
    const activeStages = stages.filter((stage) => stage.subtests.length > 0);
    if (activeStages.length === 0) {
      throw new AppError({
        code: 'COMMON_CONFLICT',
        status: 409,
        message: 'Belum ada subtes aktif pada konfigurasi ujian.',
      });
    }

    const settings = await this.getSettings();
    return {
      capturedAt: now.toISOString(),
      timezone: settings.timezone,
      totalPassingScore: settings.totalPassingScore,
      maxSessionsPerDay: settings.maxSessionsPerDay,
      gracePeriodShortMs: settings.gracePeriodShortMs,
      gracePeriodLongMs: settings.gracePeriodLongMs,
      subtestTransition: settings.subtestTransition,
      violationPolicy: settings.violationPolicy,
      stages: activeStages,
    };
  }

  /* ------------------------------------------------------------------ admin: stage */

  async updateStage(
    stageId: string,
    input: UpdateExamStageInput,
    actor: ActorContext,
  ): Promise<StagePlan> {
    const existing = await this.prisma.examStage.findUnique({ where: { id: stageId } });
    if (!existing) {
      throw new NotFoundException({
        code: 'COMMON_NOT_FOUND',
        message: 'Stage ujian tidak ditemukan',
      });
    }

    await this.prisma.examStage.update({
      where: { id: stageId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.orderIndex === undefined ? {} : { orderIndex: input.orderIndex }),
        ...(input.weight === undefined ? {} : { weight: input.weight }),
        ...(input.passingScore === undefined ? {} : { passingScore: input.passingScore }),
        ...(input.eliminationEnabled === undefined
          ? {}
          : { eliminationEnabled: input.eliminationEnabled }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.stage.updated',
      entityType: 'exam_stage',
      entityId: stageId,
      metadata: { changes: input },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    const row = await this.prisma.examStage.findUnique({
      where: { id: stageId },
      include: STAGE_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException({
        code: 'COMMON_NOT_FOUND',
        message: 'Stage ujian tidak ditemukan',
      });
    }
    return this.toStagePlan(row as unknown as StageRow);
  }

  /* ------------------------------------------------------------------ admin: subtes */

  async createSubtest(input: CreateSubtestInput, actor: ActorContext): Promise<SubtestPlan> {
    const stage = await this.prisma.examStage.findUnique({ where: { code: input.stageCode } });
    if (!stage) {
      throw new NotFoundException({
        code: 'COMMON_NOT_FOUND',
        message: 'Stage ujian tidak ditemukan',
      });
    }

    const duplicate = await this.prisma.subtest.findUnique({ where: { code: input.code } });
    if (duplicate) {
      throw new ConflictException({
        code: 'COMMON_CONFLICT',
        message: `Subtes ${input.code} sudah ada`,
      });
    }

    const created = await this.prisma.subtest.create({
      data: {
        stageId: stage.id,
        code: input.code,
        name: input.name,
        orderIndex: input.orderIndex,
        questionCount: input.questionCount,
        durationMinutes: input.durationMinutes,
        weight: input.weight,
        passingScore: input.passingScore,
        eliminationEnabled: input.eliminationEnabled,
        scoringStrategy: input.scoringStrategy,
        scoringConfig: (input.scoringConfig ?? null) as never,
        isActive: input.isActive,
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.subtest.created',
      entityType: 'subtest',
      entityId: created.id,
      metadata: { code: created.code, stageCode: input.stageCode },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSubtestPlan(created as unknown as SubtestRow);
  }

  async updateSubtest(
    subtestId: string,
    input: UpdateSubtestInput,
    actor: ActorContext,
  ): Promise<SubtestPlan> {
    const existing = await this.prisma.subtest.findUnique({ where: { id: subtestId } });
    if (!existing) {
      throw new NotFoundException({
        code: 'COMMON_NOT_FOUND',
        message: 'Subtes tidak ditemukan',
      });
    }

    const updated = await this.prisma.subtest.update({
      where: { id: subtestId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.orderIndex === undefined ? {} : { orderIndex: input.orderIndex }),
        ...(input.questionCount === undefined ? {} : { questionCount: input.questionCount }),
        ...(input.durationMinutes === undefined ? {} : { durationMinutes: input.durationMinutes }),
        ...(input.weight === undefined ? {} : { weight: input.weight }),
        ...(input.passingScore === undefined ? {} : { passingScore: input.passingScore }),
        ...(input.eliminationEnabled === undefined
          ? {}
          : { eliminationEnabled: input.eliminationEnabled }),
        ...(input.scoringStrategy === undefined ? {} : { scoringStrategy: input.scoringStrategy }),
        ...(input.scoringConfig === undefined
          ? {}
          : { scoringConfig: (input.scoringConfig ?? null) as never }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.subtest.updated',
      entityType: 'subtest',
      entityId: subtestId,
      metadata: { changes: input },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.toSubtestPlan(updated as unknown as SubtestRow);
  }

  /* ------------------------------------------------------------------ admin: settings */

  async updateSettings(
    input: UpdateExamSettingsInput,
    actor: ActorContext,
  ): Promise<ExamSettingsView> {
    const existing = await this.loadSettingRow();
    const current = await this.getSettings();
    const violationPolicy: ViolationPolicy =
      input.violationPolicy === undefined
        ? current.violationPolicy
        : parseViolationPolicy(input.violationPolicy);

    const data = {
      timezone: input.timezone ?? current.timezone,
      totalPassingScore: input.totalPassingScore ?? current.totalPassingScore,
      maxSessionsPerDay: input.maxSessionsPerDay ?? current.maxSessionsPerDay,
      gracePeriodShortMs: input.gracePeriodShortMs ?? current.gracePeriodShortMs,
      gracePeriodLongMs: input.gracePeriodLongMs ?? current.gracePeriodLongMs,
      subtestTransition: input.subtestTransition ?? current.subtestTransition,
      violationPolicy: violationPolicy as never,
    };

    if (existing) {
      await this.prisma.examSetting.update({ where: { id: 'singleton' }, data });
    } else {
      await this.prisma.examSetting.create({ data: { id: 'singleton', ...data } });
    }

    await this.audit.record({
      actorUserId: actor.id,
      action: 'exam.settings.updated',
      entityType: 'exam_settings',
      entityId: 'singleton',
      metadata: { changes: input },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return this.getSettings();
  }

  /* ------------------------------------------------------------------ mapping */

  private toSubtestSnapshot(row: SubtestRow): SubtestConfigSnapshot {
    const config =
      row.scoringConfig !== null &&
      typeof row.scoringConfig === 'object' &&
      !Array.isArray(row.scoringConfig)
        ? (row.scoringConfig as Record<string, unknown>)
        : null;

    return {
      subtestId: row.id,
      code: row.code,
      name: row.name,
      orderIndex: row.orderIndex,
      questionCount: row.questionCount,
      durationMinutes: row.durationMinutes,
      weight: decimalToNumber(row.weight) ?? 0,
      passingScore: decimalToNumber(row.passingScore) ?? 60,
      eliminationEnabled: row.eliminationEnabled,
      scoringStrategy: row.scoringStrategy,
      scoringConfig: config,
    };
  }

  private toStageSnapshot(row: StageRow): StageConfigSnapshot {
    return {
      stageId: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      orderIndex: row.orderIndex,
      weight: decimalToNumber(row.weight) ?? 0,
      passingScore: decimalToNumber(row.passingScore) ?? 60,
      eliminationEnabled: row.eliminationEnabled,
      subtests: row.subtests.map((subtest) => this.toSubtestSnapshot(subtest)),
    };
  }

  private toSubtestPlan(row: SubtestRow): SubtestPlan {
    const snapshot = this.toSubtestSnapshot(row);
    return {
      id: row.id,
      code: snapshot.code as SubtestPlan['code'],
      name: snapshot.name,
      orderIndex: snapshot.orderIndex,
      questionCount: snapshot.questionCount,
      durationMinutes: snapshot.durationMinutes,
      weight: snapshot.weight,
      passingScore: snapshot.passingScore,
      eliminationEnabled: snapshot.eliminationEnabled,
      scoringStrategy: snapshot.scoringStrategy,
      scoringConfig: snapshot.scoringConfig,
      isActive: row.isActive,
    };
  }

  private toStagePlan(row: StageRow): StagePlan {
    return {
      id: row.id,
      code: row.code as StagePlan['code'],
      name: row.name,
      description: row.description,
      orderIndex: row.orderIndex,
      weight: decimalToNumber(row.weight) ?? 0,
      passingScore: decimalToNumber(row.passingScore) ?? 60,
      eliminationEnabled: row.eliminationEnabled,
      isActive: row.isActive,
      subtests: row.subtests.map((subtest) => this.toSubtestPlan(subtest)),
    };
  }
}

/* ------------------------------------------------------------------ helper ekspor */

/** Fallback admin: konversi snapshot default ke bentuk `StagePlan`. */
function defaultStagePlans(): StagePlan[] {
  return DEFAULT_STAGES.map((stage) => ({
    id: stage.stageId,
    code: stage.code as StagePlan['code'],
    name: stage.name,
    description: stage.description,
    orderIndex: stage.orderIndex,
    weight: stage.weight,
    passingScore: stage.passingScore,
    eliminationEnabled: stage.eliminationEnabled,
    isActive: true,
    subtests: stage.subtests.map((subtest) => ({
      id: subtest.subtestId,
      code: subtest.code as SubtestPlan['code'],
      name: subtest.name,
      orderIndex: subtest.orderIndex,
      questionCount: subtest.questionCount,
      durationMinutes: subtest.durationMinutes,
      weight: subtest.weight,
      passingScore: subtest.passingScore,
      eliminationEnabled: subtest.eliminationEnabled,
      scoringStrategy: subtest.scoringStrategy,
      scoringConfig: subtest.scoringConfig,
      isActive: true,
    })),
  }));
}

export function subtestSnapshotOf(
  snapshot: SessionConfigSnapshot,
  code: string,
): SubtestConfigSnapshot | null {
  for (const stage of snapshot.stages) {
    const found = stage.subtests.find((subtest) => subtest.code === code);
    if (found) return found;
  }
  return null;
}

export function stageSnapshotOf(
  snapshot: SessionConfigSnapshot,
  code: string,
): StageConfigSnapshot | null {
  return snapshot.stages.find((stage) => stage.code === code) ?? null;
}
