/**
 * Factory test integrasi (F2-01).
 *
 * Merakit mesin ujian dengan **database sungguhan** (`DATABASE_URL_TEST`)
 * tanpa boot Nest DI container. Tujuannya: test integrasi memakai kelas
 * produksi yang sama, hanya klien DB dan port yang disuntikkan.
 *
 * Yang dipakai apa adanya:
 *   - `ExamSessionService`, `ExamConfigService`, `ExamFinalizerService`
 *   - `ExamQuestionSource` (materialisasi soal nyata ke tabel)
 *   - `ExamQuestionProjection`, `ScoringService`, `AuditService`, `ResultsService`
 *
 * Pengganti port (sama seperti `.env` dev):
 *   - `ACCESS_POLICY`  → `DevAccessPolicy`
 *   - `QUESTION_POOL`  → `MockQuestionPool`
 *   - `STORAGE`        → `DevStorage`
 */
import type { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/core/prisma/prisma.service';
import { DevAccessPolicy } from '../../src/core/ports/impl/dev-access-policy';
import { DevStorage } from '../../src/core/ports/impl/dev-storage';
import { MockQuestionPool } from '../../src/core/ports/impl/mock-question-pool';
import { PrismaAudit } from '../../src/core/ports/impl/prisma-audit';
import { AuditService } from '../../src/modules/audit/audit.service';
import { ExamConfigService } from '../../src/modules/exams/exam-config.service';
import { ExamFinalizerService } from '../../src/modules/exams/exam-finalizer.service';
import { ExamQuestionProjection } from '../../src/modules/exams/exam-question-projection';
import { ExamQuestionSource } from '../../src/modules/exams/exam-question-source';
import { ExamSessionService } from '../../src/modules/exams/exam-session.service';
import { ProctoringService } from '../../src/modules/proctoring/proctoring.service';
import { ResultsService } from '../../src/modules/results/results.service';
import { ScoringService } from '../../src/modules/scoring/scoring.service';
import { roleIdFor } from './setup';

/**
 * `PrismaClient` punya permukaan query yang sama dengan `PrismaService`
 * (yang hanya menambah hook lifecycle Nest). Cast ini menghindari pembuatan
 * client kedua yang menunjuk `DATABASE_URL` aplikasi.
 */
function asPrismaService(prisma: PrismaClient): PrismaService {
  return prisma as unknown as PrismaService;
}

export interface ExamEngine {
  prisma: PrismaService;
  config: ExamConfigService;
  finalizer: ExamFinalizerService;
  questionSource: ExamQuestionSource;
  projection: ExamQuestionProjection;
  sessions: ExamSessionService;
  results: ResultsService;
  proctoring: ProctoringService;
  scoring: ScoringService;
  audit: AuditService;
}

export function createExamEngine(prismaClient: PrismaClient): ExamEngine {
  const prisma = asPrismaService(prismaClient);
  const audit = new AuditService(new PrismaAudit(prisma), prisma);
  const scoring = new ScoringService();
  const config = new ExamConfigService(prisma, audit);
  const finalizer = new ExamFinalizerService(prisma, scoring, audit);
  const questionSource = new ExamQuestionSource(prisma);
  const projection = new ExamQuestionProjection(new DevStorage());
  const sessions = new ExamSessionService(
    prisma,
    config,
    finalizer,
    questionSource,
    projection,
    new DevAccessPolicy(),
    new MockQuestionPool(),
  );

  return {
    prisma,
    config,
    finalizer,
    questionSource,
    projection,
    sessions,
    results: new ResultsService(prisma, sessions, finalizer, audit),
    proctoring: new ProctoringService(prisma, finalizer, audit),
    scoring,
    audit,
  };
}

let counter = 0;

/**
 * Buat peserta uji: role USER, status ACTIVE, email terverifikasi.
 * Email unik agar tidak bentrok dengan unique index saat test diulang.
 */
export async function createExamUser(
  prisma: PrismaClient,
  options: { email?: string; fullName?: string; roleCode?: string } = {},
): Promise<{ id: string; email: string }> {
  counter += 1;
  const email =
    options.email ?? `peserta-${process.pid}-${Date.now()}-${counter}@example.test`;
  const roleId = await roleIdFor(prisma, options.roleCode ?? 'USER');

  return prisma.user.create({
    data: {
      email,
      fullName: options.fullName ?? `Peserta Uji ${counter}`,
      roleId,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      // Auth tidak diuji di sini; kolom hanya perlu terisi.
      passwordHash: 'integration-test',
    },
    select: { id: true, email: true },
  });
}

/** Semua subtes sesi, terurut sesuai urutan pengerjaan. */
export function flattenSubtests(session: {
  stages: Array<{
    id: string;
    stageCode: string;
    subtests: Array<{ id: string; subtestCode: string; status: string; orderIndex: number }>;
  }>;
}): Array<{
  stageId: string;
  stageCode: string;
  id: string;
  subtestCode: string;
  status: string;
  orderIndex: number;
}> {
  return session.stages.flatMap((stage) =>
    stage.subtests.map((subtest) => ({
      stageId: stage.id,
      stageCode: stage.stageCode,
      id: subtest.id,
      subtestCode: subtest.subtestCode,
      status: subtest.status,
      orderIndex: subtest.orderIndex,
    })),
  );
}

/** Cari subtes sesi berdasarkan kode (mis. `KECERDASAN`). */
export function findSubtest(
  session: Parameters<typeof flattenSubtests>[0],
  code: string,
): ReturnType<typeof flattenSubtests>[number] {
  const found = flattenSubtests(session).find((subtest) => subtest.subtestCode === code);
  if (!found) throw new Error(`subtes sesi "${code}" tidak ditemukan`);
  return found;
}
