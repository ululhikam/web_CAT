import { describe, expect, it } from 'vitest';
import type { AdminUserOverview } from '@webcat/contracts';
import {
  examSummaryLine,
  formatScore,
  paymentSummaryLine,
  remainingDaysLabel,
  sessionStatus,
  subscriptionStatus,
  transactionStatus,
  userStatus,
} from './user-detail';

/**
 * F5-03 — detail peserta admin.
 *
 * Yang diuji adalah kalimat yang dipakai admin untuk menjawab pertanyaan tanpa
 * query manual: berapa sesi, skornya berapa, dan berapa yang sudah dibayar.
 */

function examStats(
  overrides: Partial<AdminUserOverview['exams']> = {},
): AdminUserOverview['exams'] {
  return {
    total: 0,
    completed: 0,
    passed: 0,
    averageScore: null,
    bestScore: null,
    lastExamAt: null,
    recent: [],
    ...overrides,
  };
}

function paymentStats(
  overrides: Partial<AdminUserOverview['payments']> = {},
): AdminUserOverview['payments'] {
  return {
    totalTransactions: 0,
    paidTransactions: 0,
    totalPaidIdr: 0,
    lastPaidAt: null,
    recent: [],
    ...overrides,
  };
}

const rupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

describe('user-detail — status', () => {
  it('memetakan status sesi ujian ke label Indonesia', () => {
    expect(sessionStatus('COMPLETED')).toEqual({ label: 'Selesai', tone: 'success' });
    expect(sessionStatus('ELIMINATED')).toEqual({ label: 'Gugur', tone: 'danger' });
    expect(sessionStatus('IN_PROGRESS').tone).toBe('info');
  });

  it('memetakan status langganan, transaksi, dan akun', () => {
    expect(subscriptionStatus('ACTIVE').tone).toBe('success');
    expect(subscriptionStatus('REVOKED').label).toBe('Dicabut');
    expect(transactionStatus('SUCCESS').label).toBe('Berhasil');
    expect(transactionStatus('REFUNDED').tone).toBe('info');
    expect(userStatus('PENDING_INVITE').label).toBe('Menunggu undangan');
  });

  it('menampilkan nilai tak dikenal apa adanya, bukan menelannya jadi "—"', () => {
    expect(sessionStatus('SESUATU_BARU')).toEqual({ label: 'SESUATU_BARU', tone: 'neutral' });
    expect(sessionStatus(null).label).toBe('—');
  });
});

describe('user-detail — formatScore', () => {
  it('membuang nol ekor tapi mempertahankan angka penting', () => {
    expect(formatScore(612.5)).toBe('612.5');
    expect(formatScore(745)).toBe('745');
    expect(formatScore(700.25)).toBe('700.25');
    expect(formatScore(0)).toBe('0');
  });

  it('null jadi tanda hubung', () => {
    expect(formatScore(null)).toBe('—');
  });
});

describe('user-detail — examSummaryLine', () => {
  it('menyatakan dengan jelas bila belum pernah ujian', () => {
    expect(examSummaryLine(examStats())).toBe('Belum pernah mengikuti ujian.');
  });

  it('merangkum jumlah sesi, kelulusan, dan skor', () => {
    const line = examSummaryLine(
      examStats({ total: 3, completed: 2, passed: 1, averageScore: 612.5, bestScore: 745 }),
    );
    expect(line).toBe('3 sesi · 2 selesai · 1 lulus · rata-rata 612.5 · terbaik 745');
  });

  it('tidak menyebut "lulus" bila belum ada yang lulus', () => {
    const line = examSummaryLine(examStats({ total: 1, completed: 1, bestScore: 430 }));
    expect(line).not.toContain('lulus');
    expect(line).toContain('terbaik 430');
  });

  it('tidak menyebut rata-rata bila belum ada sesi berskor', () => {
    const line = examSummaryLine(examStats({ total: 2 }));
    expect(line).toBe('2 sesi');
  });
});

describe('user-detail — paymentSummaryLine', () => {
  it('menyatakan belum ada transaksi', () => {
    expect(paymentSummaryLine(paymentStats(), rupiah)).toBe('Belum ada transaksi.');
  });

  it('membedakan transaksi ada tapi belum berhasil', () => {
    expect(paymentSummaryLine(paymentStats({ totalTransactions: 2 }), rupiah)).toBe(
      '2 transaksi, belum ada yang berhasil.',
    );
  });

  it('menjumlahkan nominal pembayaran berhasil', () => {
    const line = paymentSummaryLine(
      paymentStats({ totalTransactions: 3, paidTransactions: 2, totalPaidIdr: 298000 }),
      rupiah,
    );
    expect(line).toBe('2 pembayaran berhasil · total Rp 298.000');
  });
});

describe('user-detail — remainingDaysLabel', () => {
  it('memakai kata yang benar untuk 0, 1, dan banyak hari', () => {
    expect(remainingDaysLabel(0)).toBe('habis hari ini');
    expect(remainingDaysLabel(1)).toBe('tersisa 1 hari');
    expect(remainingDaysLabel(30)).toBe('tersisa 30 hari');
  });
});
