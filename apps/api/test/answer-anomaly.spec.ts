import { describe, expect, it } from 'vitest';
import {
  anomalyEventId,
  detectAnswerAnomalies,
  groupAnswerEvents,
} from '../src/modules/exams/answer-anomaly';
import type { AnswerAnomalyEvent, AnswerAnomalyQuestion } from '../src/modules/exams/answer-anomaly';

/**
 * F5-13 — agregasi anomali sisi server.
 *
 * Fokus test: aturan gambar memakai jawaban pertama, deret hanya untuk
 * KECERMATAN dan harus benar-benar berurutan, serta id event yang idempoten.
 */

function question(
  position: number,
  media: Array<{ role: string }> = [],
): AnswerAnomalyQuestion {
  return {
    id: `q-${position}`,
    position,
    snapshot: {
      media,
      options: [],
    },
  };
}

function event(
  position: number,
  timeSpentMs: number,
  clientSeq = 1,
): AnswerAnomalyEvent {
  return { sessionQuestionId: `q-${position}`, clientSeq, timeSpentMs };
}

describe('groupAnswerEvents', () => {
  it('mengelompokkan per soal dan mengurutkan menurut clientSeq', () => {
    const groups = groupAnswerEvents([
      event(1, 9_000, 3),
      event(1, 120, 1),
      event(1, 4_000, 2),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.first.clientSeq).toBe(1);
    expect(groups[0]!.first.timeSpentMs).toBe(120);
    expect(groups[0]!.last.clientSeq).toBe(3);
    expect(groups[0]!.count).toBe(3);
  });
});

describe('detectAnswerAnomalies — aturan gambar', () => {
  it('mencatat soal bergambar yang dijawab 299 ms', () => {
    const findings = detectAnswerAnomalies({
      subtestCode: 'KECERDASAN',
      questions: [question(1, [{ role: 'STEM' }])],
      events: [event(1, 299)],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      type: 'ANSWER_TOO_FAST_IMAGE',
      severity: 'low',
      sessionQuestionId: 'q-1',
      clientSeq: 1,
      metadata: { position: 1, timeSpentMs: 299, thresholdMs: 300, changes: 1 },
    });
  });

  it('tidak mencatat soal tanpa gambar walau sangat cepat', () => {
    expect(
      detectAnswerAnomalies({
        subtestCode: 'KECERDASAN',
        questions: [question(1)],
        events: [event(1, 100)],
      }),
    ).toEqual([]);
  });

  it('mengabaikan media pembahasan', () => {
    expect(
      detectAnswerAnomalies({
        subtestCode: 'KECERDASAN',
        questions: [question(1, [{ role: 'EXPLANATION' }])],
        events: [event(1, 100)],
      }),
    ).toEqual([]);
  });

  it('memakai jawaban pertama, bukan perubahan terakhir', () => {
    const findings = detectAnswerAnomalies({
      subtestCode: 'KECERDASAN',
      questions: [question(1, [{ role: 'STEM' }])],
      events: [event(1, 120, 1), event(1, 9_000, 2)],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]!.metadata).toMatchObject({ timeSpentMs: 120, changes: 2 });
  });

  it('menghargai waktu 0 sebagai tidak dilaporkan', () => {
    expect(
      detectAnswerAnomalies({
        subtestCode: 'KECERDASAN',
        questions: [question(1, [{ role: 'STEM' }])],
        events: [event(1, 0)],
      }),
    ).toEqual([]);
  });
});

describe('detectAnswerAnomalies — aturan deret', () => {
  const fastQuestions = [1, 2, 3, 4, 5].map((position) => question(position));
  const fastEvents = [1, 2, 3, 4, 5].map((position) => event(position, 50));

  it('mencatat deret lima soal cepat di KECERMATAN', () => {
    const findings = detectAnswerAnomalies({
      subtestCode: 'KECERMATAN',
      questions: fastQuestions,
      events: fastEvents,
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      type: 'ANSWER_TOO_FAST_STREAK',
      severity: 'medium',
      sessionQuestionId: 'q-5',
      metadata: { positions: [1, 2, 3, 4, 5], thresholdMs: 150, length: 5 },
    });
  });

  it('tidak mencatat deret pada subtes lain', () => {
    expect(
      detectAnswerAnomalies({
        subtestCode: 'KECERDASAN',
        questions: fastQuestions,
        events: fastEvents,
      }),
    ).toEqual([]);
  });

  it('tidak mencatat bila posisi melompat', () => {
    expect(
      detectAnswerAnomalies({
        subtestCode: 'KECERMATAN',
        questions: [1, 2, 3, 5, 6].map((position) => question(position)),
        events: [1, 2, 3, 5, 6].map((position) => event(position, 50)),
      }),
    ).toEqual([]);
  });

  it('tidak mencatat bila satu soal lambat', () => {
    expect(
      detectAnswerAnomalies({
        subtestCode: 'KECERMATAN',
        questions: fastQuestions,
        events: [1, 2, 3, 4].map((position) => event(position, 50)).concat(event(5, 900)),
      }),
    ).toEqual([]);
  });
});

describe('anomalyEventId', () => {
  it('deterministik dan berbeda per tipe', () => {
    expect(anomalyEventId('ANSWER_TOO_FAST_IMAGE', 'q-1')).toBe(
      'answer-anomaly:ANSWER_TOO_FAST_IMAGE:q-1',
    );
    expect(anomalyEventId('ANSWER_TOO_FAST_IMAGE', 'q-1')).not.toBe(
      anomalyEventId('ANSWER_TOO_FAST_STREAK', 'q-1'),
    );
  });
});
