import { describe, expect, it } from 'vitest';
import type { ExamHistoryItem, ExamStatsView } from '@webcat/contracts';
import {
  buildDashboardSummary,
  buildTrendPoints,
  formatExamDate,
  formatScore,
  sessionBadge,
} from './summary';

/**
 * F5-08 — dashboard peserta.
 *
 * Yang diuji adalah transformasi data API menjadi angka yang tampil di layar:
 * subtes terlemah, urutan progres, tren grafik, dan label status. Semua fungsi
 * di sini murni supaya perilakunya tidak bergantung pada render Svelte.
 */

function stats(overrides: Partial<ExamStatsView> = {}): ExamStatsView {
  return {
    totalPassingScore: 60,
    totalSessions: 0,
    completedSessions: 0,
    eliminatedSessions: 0,
    passRate: 0,
    averageScore: null,
    bestScore: null,
    lastScore: null,
    trend: [],
    perSubtest: [],
    ...overrides,
  };
}

function historyItem(overrides: Partial<ExamHistoryItem> = {}): ExamHistoryItem {
  return {
    sessionId: 'session-1',
    examDate: '2026-11-04',
    status: 'COMPLETED',
    totalScore: 78.5,
    passed: true,
    startedAt: null,
    finishedAt: null,
    eliminatedSubtestCode: null,
    ...overrides,
  };
}

describe('buildDashboardSummary', () => {
  it('mengosongkan semua angka bila belum ada sesi', () => {
    const result = buildDashboardSummary(null, []);
    expect(result.hasSessions).toBe(false);
    expect(result.totalSessions).toBe(0);
    expect(result.averageScore).toBeNull();
    expect(result.bestScore).toBeNull();
    expect(result.weakestSubtest).toBeNull();
    expect(result.perSubtest).toEqual([]);
    expect(result.sessions).toEqual([]);
  });

  it('meneruskan angka agregat dari API tanpa membulatkan ulang', () => {
    const result = buildDashboardSummary(
      stats({
        totalSessions: 7,
        completedSessions: 5,
        eliminatedSessions: 2,
        passRate: 60,
        averageScore: 71.25,
        bestScore: 88,
        lastScore: 65.5,
        totalPassingScore: 60,
      }),
      [],
    );
    expect(result.hasSessions).toBe(true);
    expect(result.totalSessions).toBe(7);
    expect(result.completedSessions).toBe(5);
    expect(result.eliminatedSessions).toBe(2);
    expect(result.passRate).toBe(60);
    expect(result.averageScore).toBe(71.25);
    expect(result.bestScore).toBe(88);
    expect(result.lastScore).toBe(65.5);
    expect(result.totalPassingScore).toBe(60);
  });

  it('mengurutkan subtes dari rata-rata terendah dan menandai yang terlemah', () => {
    const result = buildDashboardSummary(
      stats({
        perSubtest: [
          { subtestCode: 'TPK', attempts: 2, averagePercentage: 80, bestPercentage: 90 },
          { subtestCode: 'KECERDASAN', attempts: 3, averagePercentage: 55.5, bestPercentage: 70 },
          { subtestCode: 'TKK', attempts: 1, averagePercentage: 67.25, bestPercentage: 67.25 },
        ],
      }),
      [],
    );

    expect(result.perSubtest.map((row) => row.code)).toEqual(['KECERDASAN', 'TKK', 'TPK']);
    expect(result.weakestSubtest?.code).toBe('KECERDASAN');
    expect(result.weakestSubtest?.label).toBe('Kecerdasan');
    expect(result.weakestSubtest?.averagePercentage).toBe(55.5);
  });

  it('tidak menganggap subtes tanpa nilai sebagai terlemah', () => {
    const result = buildDashboardSummary(
      stats({
        perSubtest: [
          { subtestCode: 'KECERMATAN', attempts: 0, averagePercentage: null, bestPercentage: null },
          { subtestCode: 'PASS_HAND', attempts: 1, averagePercentage: 70, bestPercentage: 70 },
        ],
      }),
      [],
    );

    expect(result.weakestSubtest?.code).toBe('PASS_HAND');
    // Entri tanpa nilai tetap tampil di daftar, tapi di urutan paling akhir.
    expect(result.perSubtest.at(-1)?.code).toBe('KECERMATAN');
  });

  it('memetakan riwayat menjadi baris tabel', () => {
    const result = buildDashboardSummary(stats({ totalSessions: 1 }), [
      historyItem({ sessionId: 'abc', examDate: '2026-11-04', totalScore: 78.5, passed: true }),
      historyItem({
        sessionId: 'def',
        status: 'ELIMINATED',
        totalScore: null,
        passed: false,
        eliminatedSubtestCode: 'KECERMATAN',
      }),
    ]);

    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0]).toMatchObject({
      sessionId: 'abc',
      score: 78.5,
      passed: true,
    });
    expect(result.sessions[1]?.eliminatedSubtestCode).toBe('KECERMATAN');
    expect(result.sessions[1]?.score).toBeNull();
  });
});

describe('sessionBadge', () => {
  it('membedakan lulus dan belum lulus pada sesi selesai', () => {
    expect(sessionBadge('COMPLETED', true)).toEqual({ label: 'Lulus (MS)', tone: 'success' });
    expect(sessionBadge('COMPLETED', false)).toEqual({ label: 'Belum MS', tone: 'warning' });
  });

  it('memakai label sendiri untuk status non-selesai', () => {
    expect(sessionBadge('ELIMINATED', false)).toEqual({ label: 'Gugur (TMS)', tone: 'danger' });
    expect(sessionBadge('IN_PROGRESS', null)).toEqual({
      label: 'Sedang dikerjakan',
      tone: 'info',
    });
    expect(sessionBadge('CREATED', null)).toEqual({ label: 'Belum mulai', tone: 'neutral' });
    expect(sessionBadge('VOIDED', null).tone).toBe('danger');
  });

  it('meneruskan status tak dikenal apa adanya', () => {
    expect(sessionBadge('SOMETHING_NEW', null)).toEqual({
      label: 'SOMETHING_NEW',
      tone: 'neutral',
    });
  });
});

describe('buildTrendPoints', () => {
  it('mengembalikan array kosong bila tidak ada skor', () => {
    expect(buildTrendPoints([])).toEqual([]);
    expect(buildTrendPoints([{ examDate: '2026-11-01', totalScore: null, passed: null }])).toEqual(
      [],
    );
  });

  it('memetakan skor 0–100 ke sumbu Y dan meletakkan satu titik di tengah', () => {
    expect(buildTrendPoints([{ examDate: '2026-11-01', totalScore: 50, passed: true }])).toEqual([
      { x: 320, y: 145, score: 50, examDate: '2026-11-01' },
    ]);
  });

  it('menyebar beberapa titik dari kiri ke kanan dan menjaga batas 0–100', () => {
    const points = buildTrendPoints([
      { examDate: '2026-11-01', totalScore: 0, passed: false },
      { examDate: '2026-11-02', totalScore: 100, passed: true },
      { examDate: '2026-11-03', totalScore: 150, passed: true },
    ]);
    expect(points).toHaveLength(3);
    expect(points[0]?.x).toBe(60);
    expect(points[0]?.y).toBe(250);
    expect(points[1]?.y).toBe(40);
    expect(points[2]?.x).toBe(580);
    // Skor di atas 100 dijepit agar tidak keluar dari area grafik.
    expect(points[2]?.y).toBe(40);
  });
});

describe('formatScore', () => {
  it('membuang nol ekor tanpa kehilangan angka penting', () => {
    expect(formatScore(612.5)).toBe('612.5');
    expect(formatScore(78.5)).toBe('78.5');
    expect(formatScore(100)).toBe('100');
    expect(formatScore(0)).toBe('0');
    expect(formatScore(67.25)).toBe('67.25');
  });

  it('menampilkan strip untuk nilai kosong', () => {
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
    expect(formatScore(Number.NaN)).toBe('—');
  });
});

describe('formatExamDate', () => {
  it('memformat tanggal ISO pendek dengan locale Indonesia', () => {
    expect(formatExamDate('2026-11-04')).toBe('04 Nov 2026');
  });

  it('menampilkan strip untuk nilai kosong atau tidak valid', () => {
    expect(formatExamDate(null)).toBe('—');
    expect(formatExamDate('bukan-tanggal')).toBe('—');
  });
});
