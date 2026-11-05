import { CHURN_WINDOW_MS, countChangesInWindow } from '@webcat/contracts';

/**
 * F5-13 — pelacak "jawaban diubah berkali-kali" di sisi klien.
 *
 * Ambang TIDAK diduplikasi di sini: `countChangesInWindow` dari
 * `@webcat/contracts` yang memutuskan apakah deretan waktu perubahan sudah
 * melewati batas. Modul ini hanya menyimpan riwayat waktu perubahan per soal
 * dan membuang entri lama supaya memori tidak tumbuh selama subtes.
 *
 * Yang dicatat hanya PERUBAHAN jawaban — jawaban pertama untuk sebuah soal
 * bukan perubahan, jadi pemanggil (`ExamRunnerStore.recordAnswer`) wajib
 * memeriksa apakah soal itu sudah pernah dijawab sebelum mencatat.
 */

/**
 * Batas riwayat yang disimpan per soal. Jauh di atas `CHURN_LIMIT` supaya
 * keputusan tetap benar, cukup kecil supaya tidak menumpuk.
 */
const MAX_TIMESTAMPS_PER_QUESTION = 12;

export interface AnswerChurnTracker {
  /**
   * Mencatat satu perubahan jawaban pada `questionId` pukul `at` (epoch ms).
   *
   * Mengembalikan jumlah perubahan pada jendela terakhir (0 bila masih wajar).
   * Pemanggil mengirim sinyal sekali lalu memanggil `reset(questionId)` agar
   * ledakan berikutnya dihitung dari nol.
   */
  record(questionId: string, at: number): number;
  /** Membersihkan riwayat satu soal, atau seluruhnya bila tanpa argumen. */
  reset(questionId?: string): void;
}

export function createAnswerChurnTracker(): AnswerChurnTracker {
  const timestamps = new Map<string, number[]>();

  return {
    record(questionId: string, at: number): number {
      const history = timestamps.get(questionId) ?? [];
      history.push(at);

      // Buang yang sudah keluar jendela: perubahan lama tidak boleh membuat
      // soal yang sama dilaporkan lagi saat peserta kembali ke soal itu.
      const cutoff = at - CHURN_WINDOW_MS;
      const recent = history.filter((timestamp) => timestamp >= cutoff);
      // `slice` terakhir hanya jaring pengaman; `recent` biasanya <= 6.
      const bounded = recent.slice(-MAX_TIMESTAMPS_PER_QUESTION);
      timestamps.set(questionId, bounded);

      // Keputusan sepenuhnya milik kontrak: 0 = masih wajar.
      return countChangesInWindow(bounded);
    },

    reset(questionId?: string): void {
      if (questionId === undefined) {
        timestamps.clear();
        return;
      }
      timestamps.delete(questionId);
    },
  };
}
