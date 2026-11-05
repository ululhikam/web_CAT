import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ClockState,
  ProctoringBatchInput,
  ProctoringBatchResponse,
  ProctoringWarning,
  SessionStatus,
  SubtestCode,
  ViolationAction,
} from '@webcat/contracts';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ExamFinalizerService } from '../exams/exam-finalizer.service';
import { buildClock } from '../exams/exam-clock';
import { asSessionStatus, parseSessionConfig } from '../exams/exam-snapshot';

export interface ProctoringActor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Proctoring: klien hanya mengirim sinyal; server yang memutuskan aksi.
 *
 * Idempotensi memakai `(session_id, client_event_id)`. Counter pelanggaran
 * memakai UPSERT atomik `(session_id, type)`. Aksi hanya dieksekusi sekali
 * saat counter tepat mencapai ambang, sehingga retry batch tidak
 * menggugurkan sesi berkali-kali.
 */
@Injectable()
export class ProctoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly finalizer: ExamFinalizerService,
    private readonly audit: AuditService,
  ) {}

  async recordEvents(
    userId: string,
    sessionId: string,
    input: ProctoringBatchInput,
    actor: ProctoringActor,
  ): Promise<ProctoringBatchResponse> {
    const now = new Date();
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        subtests: { orderBy: { orderIndex: 'asc' } },
        stages: { orderBy: { stageOrder: 'asc' } },
      },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException({
        code: 'EXAM_SESSION_NOT_FOUND',
        message: 'Sesi ujian tidak ditemukan',
      });
    }

    const config = parseSessionConfig(session.configSnapshot);
    // Dedupe di dalam batch juga: `clientEventId` yang sama dua kali dalam satu
    // kiriman tidak boleh menaikkan counter dua kali (createMany hanya
    // menyimpan satu baris, jadi loop aksi harus memakai daftar unik).
    const unique = new Map<string, (typeof input.events)[number]>();
    for (const event of input.events) {
      if (!unique.has(event.clientEventId)) unique.set(event.clientEventId, event);
    }
    const ids = [...unique.keys()];
    const existing = await this.prisma.proctoringEvent.findMany({
      where: { sessionId, clientEventId: { in: ids } },
      select: { clientEventId: true },
    });
    const existingIds = new Set(existing.map((row) => row.clientEventId));
    const fresh = [...unique.values()].filter((event) => !existingIds.has(event.clientEventId));

    let accepted = 0;
    if (fresh.length > 0) {
      const created = await this.prisma.proctoringEvent.createMany({
        data: fresh.map((event) => ({
          sessionId,
          clientEventId: event.clientEventId,
          type: event.type,
          severity: config.violationPolicy.events[event.type]?.severity ?? 'low',
          occurredAtClient: event.occurredAt ?? null,
          occurredAtServer: now,
          metadata: (event.metadata ?? null) as never,
        })),
        skipDuplicates: true,
      });
      accepted = created.count;
    }

    const warnings: ProctoringWarning[] = [];
    let actionTaken: ViolationAction | null = null;
    let terminal = ['COMPLETED', 'ELIMINATED', 'EXPIRED', 'ABANDONED', 'VOIDED'].includes(
      session.status,
    );

    for (const event of fresh) {
      const rule = config.violationPolicy.events[event.type];
      if (!rule) continue;

      const violation = await this.prisma.examViolation.upsert({
        where: { sessionId_type: { sessionId, type: event.type } },
        create: {
          sessionId,
          type: event.type,
          count: 1,
          lastAt: now,
          policySnapshot: rule as unknown as never,
        },
        update: {
          count: { increment: 1 },
          lastAt: now,
          policySnapshot: rule as unknown as never,
        },
      });

      const actionEntry = [...rule.actions]
        .sort((a, b) => a.at - b.at)
        .reverse()
        .find((entry) => violation.count >= entry.at);

      if (actionEntry) {
        await this.prisma.examViolation.update({
          where: { id: violation.id },
          data: { actionTaken: actionEntry.action },
        });
        actionTaken = actionEntry.action;
      }

      const warn = rule.actions.find((entry) => entry.action === 'WARN');
      const limit = warn?.at ?? Math.max(...rule.actions.map((entry) => entry.at));
      if (warn && violation.count >= warn.at) {
        warnings.push({
          type: event.type,
          count: violation.count,
          limit,
          severity: rule.severity,
          message: config.violationPolicy.warningTemplate
            .replaceAll('{type}', event.type)
            .replaceAll('{count}', String(violation.count))
            .replaceAll('{limit}', String(limit)),
        });
      }

      if (terminal || !actionEntry || violation.count !== actionEntry.at) continue;

      const current = session.subtests.find((subtest) => subtest.status === 'ACTIVE');
      if (actionEntry.action === 'LOCK_SUBTEST' && current) {
        await this.finalizer.lockSubtestForViolation(
          current.id,
          `Pelanggaran ${event.type} (${violation.count}x)`,
          now,
        );
        await this.audit.record({
          actorUserId: userId,
          action: 'exam.violation.lock_subtest',
          entityType: 'exam_session',
          entityId: sessionId,
          metadata: { type: event.type, count: violation.count, subtestCode: current.subtestCode },
          ip: actor.ip ?? null,
          userAgent: actor.userAgent ?? null,
        });
      }

      if (actionEntry.action === 'ELIMINATE' || actionEntry.action === 'LOCK_ACCOUNT') {
        await this.finalizer.eliminateSession(
          sessionId,
          `Pelanggaran ${event.type} (${violation.count}x)`,
          (current?.subtestCode as SubtestCode | undefined) ?? null,
          now,
        );
        // Event berikutnya dalam batch yang sama tidak boleh mengeksekusi aksi
        // lagi setelah sesi gugur.
        terminal = true;
        await this.audit.record({
          actorUserId: userId,
          action: 'exam.violation.eliminate',
          entityType: 'exam_session',
          entityId: sessionId,
          metadata: { type: event.type, count: violation.count, action: actionEntry.action },
          ip: actor.ip ?? null,
          userAgent: actor.userAgent ?? null,
        });
      }
    }

    const refreshed = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { subtests: { orderBy: { orderIndex: 'asc' } } },
    });
    const status = asSessionStatus(refreshed?.status ?? session.status);
    const active = refreshed?.subtests.find((subtest) => subtest.status === 'ACTIVE') ?? null;
    const clock: ClockState | null = active
      ? buildClock({ status: 'ACTIVE', startedAt: active.startedAt, endsAt: active.endsAt }, now)
      : null;

    return {
      accepted,
      duplicated: input.events.length - accepted,
      warnings,
      actionTaken,
      sessionStatus: status as SessionStatus,
      clock,
    };
  }
}
